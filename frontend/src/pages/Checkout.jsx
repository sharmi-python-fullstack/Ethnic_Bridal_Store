import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiAlertCircle, FiCheck, FiCreditCard, FiEdit2, FiInfo, FiMapPin, FiPlus, FiShield, FiTruck } from 'react-icons/fi'
import { createOrder, getCart } from '../api/orders'
import { getAddresses } from '../api/auth'
import { createRazorpayOrder, verifyPayment, razorpayStatus } from '../api/payments'
import { getActiveCoupons, applyCoupon as applyCouponApi } from '../api/coupons'
import { applyCoupon, clearCart, removeCoupon, setCart } from '../store/slices/cartSlice'
import { formatPrice, getErrorMessage, getImageUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

const FALLBACK_COUPONS = [
  { code: 'BRIDAL10', min_order_amount: 1000, description: '10% off on bridal orders' },
  { code: 'FLAT500', min_order_amount: 3000, description: '₹500 off orders above ₹3,000' },
]

const TEST_CARD = {
  number: '4111 1111 1111 1111',
  expiry: '12/35',
  cvv: '123',
}

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const existing = document.getElementById('razorpay-checkout-js')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => reject(new Error('Razorpay SDK failed to load')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-checkout-js'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'))
    document.body.appendChild(script)
    setTimeout(() => reject(new Error('Razorpay SDK took too long to load')), 15000)
  })
}

export default function Checkout() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, discount, couponCode } = useSelector((state) => state.cart)
  const { user } = useSelector((state) => state.auth)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [availableCoupons, setAvailableCoupons] = useState(FALLBACK_COUPONS)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [addressErrors, setAddressErrors] = useState({})
  const [address, setAddress] = useState({
    name: ((user?.first_name || '') + ' ' + (user?.last_name || '')).trim(),
    phone: user?.phone || '',
    address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India',
  })
  const [razorpayConfigured, setRazorpayConfigured] = useState(false)
  const [razorpayMode, setRazorpayMode] = useState(null)

  useEffect(() => {
    let active = true
    razorpayStatus()
      .then((r) => {
        if (!active) return
        // Configuration is enough to enable the payment choice. The actual
        // create-order request is the authoritative credentials check, so a
        // temporary network issue cannot hide a working payment button.
        setRazorpayConfigured(r.data.configured === true && r.data.sdk_available !== false)
        setRazorpayMode(r.data.mode || null)
      })
      .catch(() => {
        if (!active) return
        setRazorpayConfigured(false)
      })

    Promise.all([getCart(), getAddresses(), getActiveCoupons().catch(() => ({ data: [] }))])
      .then(([cartResponse, addressResponse, couponResponse]) => {
        if (!active) return
        dispatch(setCart(cartResponse.data))
        const saved = Array.isArray(addressResponse.data) ? addressResponse.data : []
        const defaultAddress = saved.find((item) => item.is_default) || saved[0] || null
        setAddresses(saved)
        setSelectedAddress(defaultAddress)
        setShowAddressForm(!defaultAddress)
        if (Array.isArray(couponResponse.data) && couponResponse.data.length) setAvailableCoupons(couponResponse.data)
      })
      .catch(() => active && toast.error('Could not load checkout details. Please refresh.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [dispatch])

  const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price || item.product?.effective_price || item.product?.price || 0) * item.quantity, 0)
  const shipping = subtotal >= 999 ? 0 : subtotal > 0 ? 99 : 0
  const total = Math.max(0, subtotal + shipping - Number(discount || 0))
  const shippingAddress = () => (showAddressForm ? address : selectedAddress)
  const isTestMode = razorpayMode === 'test'

  const updateAddress = (event) => {
    const { name, value } = event.target
    setAddress((current) => ({ ...current, [name]: value }))
    if (addressErrors[name]) setAddressErrors((current) => ({ ...current, [name]: '' }))
  }

  const validateAddress = () => {
    const selected = shippingAddress()
    if (!selected) {
      toast.error('Please add or select a delivery address.')
      return false
    }
    if (!showAddressForm) return true
    const errors = {}
    ;['name', 'phone', 'address_line1', 'city', 'state'].forEach((field) => {
      if (!selected[field]?.trim()) errors[field] = 'Required'
    })
    if (!/^\d{6}$/.test(selected.pincode || '')) errors.pincode = 'Enter a valid 6-digit PIN code'
    if (!/^\+?[\d\s-]{10,}$/.test(selected.phone || '')) errors.phone = 'Enter a valid phone number'
    setAddressErrors(errors)
    if (Object.keys(errors).length) {
      toast.error('Please complete the delivery address.')
      return false
    }
    return true
  }

  const handleCoupon = async (coupon) => {
    if (couponCode === coupon.code) {
      dispatch(removeCoupon())
      toast('Coupon removed', { icon: 'ℹ️' })
      return
    }
    if (subtotal < Number(coupon.min_order_amount || 0)) {
      toast.error('This coupon does not yet meet its minimum order amount.')
      return
    }
    try {
      const response = await applyCouponApi(coupon.code, subtotal)
      dispatch(applyCoupon({ code: coupon.code, discount: response.data.discount_amount }))
      toast.success(coupon.code + ' applied!')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const completeOrder = (orderId) => {
    dispatch(clearCart())
    toast.success('😊 Order was placed successfully!')
    navigate('/orders/' + orderId + '/confirmation')
  }

  const openRazorpay = async (order, deliveryAddress) => {
    if (!razorpayConfigured) {
      toast.error('Online payments are not configured on the server. Please use Cash on Delivery or contact support.')
      return
    }
    setSubmitting(true)
    try {
      if (!(await loadRazorpay())) throw new Error('Razorpay checkout could not load. Please check your internet connection and try again.')
      const response = await createRazorpayOrder({ order_id: order.id })
      const { amount, currency, key, razorpay_order_id } = response.data
      if (!key || !razorpay_order_id || !amount) throw new Error('Razorpay returned an incomplete order. Please try again.')

      const razorpay = new window.Razorpay({
        key,
        amount,
        currency: currency || 'INR',
        order_id: razorpay_order_id,
        name: 'Shaaz Ethnicwear',
        description: 'Order #' + order.order_number,
        prefill: {
          name: deliveryAddress.name,
          email: user?.email || '',
          contact: deliveryAddress.phone,
        },
        notes: { order_number: order.order_number },
        theme: { color: '#9B1313' },
        retry: { enabled: true },
        handler: async (paymentResponse) => {
          setVerifying(true)
          try {
            await verifyPayment({ order_id: order.id, ...paymentResponse })
            setPendingOrder(null)
            completeOrder(order.id)
          } catch (error) {
            setPendingOrder(order)
            toast.error(getErrorMessage(error) || 'Payment could not be verified. Please contact support.')
          } finally {
            setVerifying(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPendingOrder(order)
            toast('Payment window closed. You can resume payment when ready.', { icon: 'ℹ️' })
          },
        },
      })
      razorpay.on('payment.failed', (response) => {
        setPendingOrder(order)
        toast.error(response?.error?.description || 'Payment was not completed. You can try again.')
      })
      razorpay.open()
    } catch (error) {
      setPendingOrder(order)
      toast.error(getErrorMessage(error) || 'Failed to start Razorpay checkout. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const placeOrder = async () => {
    if (!validateAddress()) return
    const deliveryAddress = shippingAddress()
    if (paymentMethod === 'RAZORPAY' && !razorpayConfigured) {
      toast.error('Online payments are not configured on the server. Please use Cash on Delivery.')
      return
    }
    if (paymentMethod === 'RAZORPAY' && pendingOrder) {
      openRazorpay(pendingOrder, deliveryAddress)
      return
    }
    setSubmitting(true)
    try {
      const response = await createOrder({
        shipping_address: deliveryAddress, payment_method: paymentMethod, coupon_code: couponCode || '',
      })
      const order = response.data.order
      if (paymentMethod === 'RAZORPAY') {
        setPendingOrder(order)
        await openRazorpay(order, deliveryAddress)
      } else {
        completeOrder(order.id)
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-brand-cream flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" /></div>
  if (!items.length) return <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-4 px-4 text-center"><p className="text-gray-600 text-lg">Your cart is empty.</p><Link to="/products" className="btn-primary">Shop the collection</Link></div>

  return (
    <main className="min-h-screen bg-brand-cream py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-charcoal mb-7">Checkout</h1>

        {isTestMode && (
          <div className="mb-6 p-5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-4">
            <div className="flex-shrink-0">
              <FiInfo className="text-amber-600 mt-0.5" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 text-sm mb-2">🧪 Test Mode — No Real Money Deducted</h3>
              <p className="text-amber-700 text-xs mb-3">
                You are using Razorpay <strong>test keys</strong>. Use any test details below — no money will be deducted.
              </p>
              <p className="text-xs text-amber-700">
                Test card: <span className="font-mono font-bold">{TEST_CARD.number} / {TEST_CARD.expiry} / {TEST_CARD.cvv}</span>
              </p>
            </div>
          </div>
        )}

        {!razorpayConfigured && paymentMethod === 'RAZORPAY' && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <FiAlertCircle className="text-red-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-red-800 text-sm mb-1">Online Payments Not Configured</h3>
              <p className="text-red-700 text-xs">Razorpay is not configured on the server. Please use Cash on Delivery.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="font-heading text-xl font-bold text-brand-charcoal flex items-center gap-2"><FiMapPin className="text-brand-gold" /> Delivery address</h2>
                {addresses.length > 0 && <button type="button" onClick={() => setShowAddressForm((visible) => !visible)} className="text-sm text-brand-deep-red font-semibold hover:underline flex items-center gap-1"><FiEdit2 size={14} />{showAddressForm ? 'Use saved' : 'Add new'}</button>}
              </div>
              {!showAddressForm && addresses.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((item) => <button type="button" key={item.id} onClick={() => setSelectedAddress(item)} className={'relative text-left border-2 rounded-xl p-4 transition-all ' + (selectedAddress?.id === item.id ? 'border-brand-gold bg-amber-50' : 'border-gray-200 hover:border-brand-gold/70')}>
                  {selectedAddress?.id === item.id && <span className="absolute top-3 right-3 w-5 h-5 bg-brand-gold text-white rounded-full flex items-center justify-center"><FiCheck size={13} /></span>}
                  <p className="font-semibold text-brand-charcoal text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{item.address_line1}{item.address_line2 ? ', ' + item.address_line2 : ''}<br />{item.city}, {item.state} — {item.pincode}</p>
                  <p className="text-gray-500 text-xs mt-1">{item.phone}</p>
                </button>)}
                <button type="button" onClick={() => setShowAddressForm(true)} className="border-2 border-dashed border-gray-300 rounded-xl p-4 min-h-[118px] text-gray-500 hover:border-brand-gold hover:text-brand-deep-red transition-colors flex flex-col items-center justify-center gap-1"><FiPlus size={20} /><span className="text-sm">Add a new address</span></button>
              </div>}
              {showAddressForm && <div className="space-y-4">
                {addresses.length > 0 && <button type="button" onClick={() => setShowAddressForm(false)} className="text-sm text-brand-deep-red font-semibold hover:underline">Use a saved address</button>}
                <div className="grid sm:grid-cols-2 gap-4"><Field label="Full name" name="name" value={address.name} onChange={updateAddress} error={addressErrors.name} autoComplete="name" /><Field label="Phone" name="phone" type="tel" value={address.phone} onChange={updateAddress} error={addressErrors.phone} autoComplete="tel" /></div>
                <Field label="Address line 1" name="address_line1" value={address.address_line1} onChange={updateAddress} error={addressErrors.address_line1} autoComplete="address-line1" />
                <Field label="Address line 2 (optional)" name="address_line2" value={address.address_line2} onChange={updateAddress} autoComplete="address-line2" required={false} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><Field label="City" name="city" value={address.city} onChange={updateAddress} error={addressErrors.city} autoComplete="address-level2" /><Field label="State" name="state" value={address.state} onChange={updateAddress} error={addressErrors.state} autoComplete="address-level1" /><Field label="PIN code" name="pincode" value={address.pincode} onChange={updateAddress} error={addressErrors.pincode} inputMode="numeric" autoComplete="postal-code" /></div>
              </div>}
            </div>
            <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
              <h2 className="font-heading text-xl font-bold text-brand-charcoal mb-4">Payment method</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentMethod('COD')} className={'text-left p-4 rounded-xl border-2 transition-all ' + (paymentMethod === 'COD' ? 'border-brand-gold bg-amber-50' : 'border-gray-200 hover:border-brand-gold/70')}><span className="font-semibold text-brand-charcoal block">Cash on Delivery</span><span className="text-xs text-gray-500 mt-1 block">Pay when your order arrives.</span></button>
                {!razorpayConfigured ? (
                  <button type="button" disabled className="text-left p-4 rounded-xl border-2 border-gray-300 bg-gray-50 text-gray-400 transition-all"><span className="font-semibold text-gray-600 flex items-center gap-2"><FiCreditCard className="text-gray-400" /> Razorpay secure payment</span><span className="text-xs text-gray-500 mt-1 block">Not configured on server</span></button>
                ) : (
                  <button type="button" onClick={() => setPaymentMethod('RAZORPAY')} className={'text-left p-4 rounded-xl border-2 transition-all ' + (paymentMethod === 'RAZORPAY' ? 'border-brand-gold bg-amber-50' : 'border-gray-200 hover:border-brand-gold/70')}> <span className="font-semibold text-brand-charcoal flex items-center gap-2"><FiCreditCard className="text-brand-deep-red" /> Razorpay secure payment{isTestMode && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded ml-2 font-bold uppercase">TEST</span>}</span> <span className="text-xs text-gray-500 mt-1 block">Cards, UPI, netbanking and wallets.</span></button>
                )}
              </div>
              {paymentMethod === 'RAZORPAY' && razorpayConfigured && <p className="mt-4 p-3 rounded-lg bg-green-50 text-green-800 text-xs flex gap-2"><FiShield className="flex-shrink-0 mt-0.5" /> Card and banking details are entered only in Razorpay’s secure checkout, never on this website.</p>}
            </div>
          </section>
          <aside><div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 sticky top-24">
            <h2 className="font-heading text-xl font-bold text-brand-charcoal mb-4">Order summary</h2>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">{items.map((item) => <div key={item.id} className="flex gap-3 items-center"><img src={getImageUrl(item.product?.primary_image?.image_url)} alt={item.product_name || item.product?.name || 'Product'} className="w-12 h-14 object-cover rounded-lg bg-brand-cream" onError={(event) => { event.currentTarget.src = '/placeholder-bridal.svg' }} /><div className="flex-1 min-w-0"><p className="text-xs font-medium text-brand-charcoal line-clamp-2">{item.product_name || item.product?.name}</p><p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p></div><span className="text-sm font-semibold text-brand-deep-red">{formatPrice(Number(item.unit_price || item.product?.effective_price || item.product?.price || 0) * item.quantity)}</span></div>)}</div>
            <div className="border-t border-gray-100 mt-5 pt-4"><p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Available coupons</p><div className="space-y-2">{availableCoupons.map((coupon) => { const eligible = subtotal >= Number(coupon.min_order_amount || 0); const active = couponCode === coupon.code; return <button type="button" key={coupon.code} onClick={() => handleCoupon(coupon)} disabled={!eligible} className={'w-full text-left p-2.5 rounded-lg border text-xs transition-colors ' + (active ? 'border-green-500 bg-green-50' : eligible ? 'border-amber-200 hover:bg-amber-50' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed')}><span className="font-mono font-bold text-brand-deep-red">{coupon.code}</span><span className="block mt-1 text-gray-500">{coupon.description || 'Apply at checkout'}{!eligible && ' · Minimum order applies'}</span></button> })}</div></div>
            <div className="border-t border-gray-100 mt-5 pt-4 space-y-2 text-sm"><div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>{discount > 0 && <div className="flex justify-between text-green-600"><span>Discount {couponCode ? '(' + couponCode + ')' : ''}</span><span>−{formatPrice(discount)}</span></div>}<div className="flex justify-between text-gray-600"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div><div className="flex justify-between border-t pt-3 mt-3 font-bold text-base"><span>Total</span><span className="text-brand-deep-red text-xl">{formatPrice(total)}</span></div></div>
            <button type="button" onClick={placeOrder} disabled={submitting || verifying} className="btn-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-60">{submitting || verifying ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{verifying ? 'Verifying payment…' : 'Please wait…'}</> : paymentMethod === 'RAZORPAY' ? pendingOrder ? 'Resume secure payment' : 'Pay ' + formatPrice(total) + ' securely' : 'Place order (COD)'}</button>
            <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1"><FiTruck size={13} />{shipping === 0 ? 'Free delivery on this order' : formatPrice(shipping) + ' delivery charge'}</p>
          </div></aside>
        </div>
      </div>
    </main>
  )
}

function Field({ label, name, value, onChange, error, type = 'text', required = true, ...props }) {
  return <div><label htmlFor={name} className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label><input id={name} name={name} type={type} value={value} onChange={onChange} required={required} className={'input-field text-sm ' + (error ? 'border-red-400 focus:ring-red-300' : '')} {...props} />{error && <p className="text-red-500 text-xs mt-1">{error}</p>}</div>
}
