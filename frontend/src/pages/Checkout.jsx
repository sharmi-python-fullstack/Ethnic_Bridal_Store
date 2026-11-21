import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiMapPin, FiPlus, FiCheck, FiTruck, FiEdit2 } from 'react-icons/fi'
import { getCart, createOrder } from '../api/orders'
import { getAddresses } from '../api/auth'
import { createRazorpayOrder, verifyPayment } from '../api/payments'
import { setCart, clearCart } from '../store/slices/cartSlice'
import { formatPrice, getErrorMessage, getImageUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Checkout() {
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const { items, discount, couponCode } = useSelector((s) => s.cart)
  const { user }  = useSelector((s) => s.auth)

  const [addresses,       setAddresses]       = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod,   setPaymentMethod]   = useState('COD')
  const [loading,         setLoading]         = useState(false)
  const [pageLoading,     setPageLoading]     = useState(true)
  const [showForm,        setShowForm]        = useState(false)   // ← always show form when no saved addr
  const [showTestModal,   setShowTestModal]   = useState(false)
  const [testModalData,   setTestModalData]   = useState(null)
  const [testPaying,      setTestPaying]      = useState(false)

  const [addr, setAddr] = useState({
    name:         `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    phone:        user?.phone || '',
    address_line1: '',
    address_line2: '',
    city:          '',
    state:         '',
    pincode:       '',
    country:       'India',
  })
  const [addrErrors, setAddrErrors] = useState({})

  /* ── load Razorpay script dynamically ──────────────────────────────────── */
  useEffect(() => {
    if (window.Razorpay) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { /* leave it; no need to remove */ }
  }, [])

  /* ── load cart + saved addresses ─────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cartRes, addrRes] = await Promise.all([getCart(), getAddresses()])
        if (cancelled) return
        dispatch(setCart(cartRes.data))
        const saved = addrRes.data || []
        setAddresses(saved)
        const def = saved.find((a) => a.is_default) || saved[0] || null
        if (def) {
          setSelectedAddress(def)
          setShowForm(false)
        } else {
          setShowForm(true)   // no saved address → show form immediately
        }
      } catch (err) {
        if (!cancelled) {
          toast.error('Could not load cart data. Please refresh.')
          setShowForm(true)
        }
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [dispatch])

  /* ── derived totals ───────────────────────────────────────────────────── */
  const subtotal   = items.reduce((s, i) => s + parseFloat(i.unit_price || 0) * i.quantity, 0)
  const shipping   = subtotal >= 999 ? 0 : subtotal > 0 ? 99 : 0
  const grandTotal = subtotal + shipping - (discount || 0)

  /* ── addr helpers ─────────────────────────────────────────────────────── */
  const handleAddrChange = (e) => {
    const { name, value } = e.target
    setAddr((p) => ({ ...p, [name]: value }))
    if (addrErrors[name]) setAddrErrors((p) => ({ ...p, [name]: '' }))
  }

  const getShippingAddr = () => {
    if (showForm) return addr
    if (selectedAddress) return {
      name:          selectedAddress.name,
      phone:         selectedAddress.phone,
      address_line1: selectedAddress.address_line1,
      address_line2: selectedAddress.address_line2 || '',
      city:          selectedAddress.city,
      state:         selectedAddress.state,
      pincode:       selectedAddress.pincode,
      country:       selectedAddress.country,
    }
    return null
  }

  const validateAddr = () => {
    if (!showForm) return true          // saved address is already valid
    const errs = {}
    if (!addr.name.trim())          errs.name          = 'Required'
    if (!addr.phone.trim())         errs.phone         = 'Required'
    if (!addr.address_line1.trim()) errs.address_line1 = 'Required'
    if (!addr.city.trim())          errs.city          = 'Required'
    if (!addr.state.trim())         errs.state         = 'Required'
    if (!/^\d{6}$/.test(addr.pincode)) errs.pincode   = 'Must be 6 digits'
    setAddrErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ── confirm test payment ────────────────────────────────────────────── */
  const handleConfirmTestPayment = async () => {
    if (!testModalData) return
    setTestPaying(true)
    try {
      await verifyPayment({
        razorpay_order_id: testModalData.razorpay_order_id,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'test_signature_approved',
      })
      dispatch(clearCart())
      setShowTestModal(false)
      toast.success('Payment verified successfully! 🎉 Order confirmed.')
      navigate(`/orders/${testModalData.order.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Payment confirmation failed.')
    } finally {
      setTestPaying(false)
    }
  }

  /* ── place order ──────────────────────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    if (!validateAddr()) {
      toast.error('Please complete the shipping address')
      return
    }
    const shippingAddr = getShippingAddr()
    setLoading(true)
    try {
      const payload = {
        shipping_address: shippingAddr,
        payment_method:   paymentMethod,
        coupon_code:      couponCode || '',
      }

      if (paymentMethod === 'RAZORPAY') {
        const orderRes = await createOrder(payload)
        const order    = orderRes.data.order
        const rpRes    = await createRazorpayOrder({ order_id: order.id })
        const { razorpay_order_id, amount, currency, key } = rpRes.data

        // If Razorpay SDK is available, always open the official Razorpay checkout modal
        if (window.Razorpay) {
          try {
            const isRealServerOrder = razorpay_order_id && !razorpay_order_id.startsWith('order_test_')

            const options = {
              key: key || 'rzp_test_TqeE3jTwsnidKS',
              amount,
              currency: currency || 'INR',
              name: 'Shaaz Ethnicwear',
              description: `Order #${order.order_number} - Bridal Collection`,
              ...(isRealServerOrder ? { order_id: razorpay_order_id } : {}),
              handler: async (response) => {
                try {
                  await verifyPayment({
                    order_id: order.id,
                    razorpay_order_id: response.razorpay_order_id || razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature || '',
                  })
                  dispatch(clearCart())
                  toast.success('Payment successful! Order confirmed. 🎉')
                  navigate(`/orders/${order.id}`)
                } catch {
                  toast.error('Payment verification failed. Please contact support.')
                }
              },
              prefill: {
                name: shippingAddr.name,
                contact: shippingAddr.phone,
                email: user?.email || '',
              },
              notes: {
                order_number: order.order_number,
                address: shippingAddr.address_line1,
              },
              theme: { color: '#9B1313' },
              modal: {
                ondismiss: () => {
                  toast('Payment window closed. You can retry anytime from Order History.', { icon: 'ℹ️' })
                  navigate(`/orders/${order.id}`)
                }
              }
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (response) {
              toast.error(response?.error?.description || 'Payment failed')
            })
            rzp.open()
            setLoading(false)
            return
          } catch (popupErr) {
            console.warn('Razorpay popup error, opening confirmation modal:', popupErr)
          }
        }

        // Graceful fallback to confirmation modal if popup was blocked
        setTestModalData({ order, razorpay_order_id, amount, currency, shippingAddr })
        setShowTestModal(true)
        setLoading(false)
        return
      }

      // COD
      const res = await createOrder(payload)
      dispatch(clearCart())
      toast.success('Order placed successfully! 🎉')
      navigate(`/orders/${res.data.order.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  /* ── loading / empty states ───────────────────────────────────────────── */
  if (pageLoading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" />
    </div>
  )

  if (items.length === 0) return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-gray-500 text-lg">Your cart is empty</p>
      <Link to="/products" className="btn-primary">Shop Now</Link>
    </div>
  )

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-charcoal mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* SHIPPING ADDRESS ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-xl text-brand-charcoal flex items-center gap-2">
                  <FiMapPin className="text-brand-gold" /> Shipping Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-1.5 text-sm text-brand-red hover:underline font-medium"
                  >
                    <FiEdit2 size={14} />
                    {showForm ? 'Use Saved' : 'New Address'}
                  </button>
                )}
              </div>

              {/* ── Saved address cards ── */}
              {!showForm && addresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAddress(a)}
                      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedAddress?.id === a.id
                          ? 'border-brand-gold bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {a.is_default && (
                        <span className="absolute top-2 right-2 bg-brand-gold text-brand-charcoal text-xs font-bold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      {selectedAddress?.id === a.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-brand-gold rounded-full flex items-center justify-center">
                          <FiCheck size={12} className="text-white" />
                        </div>
                      )}
                      <p className="font-semibold text-brand-charcoal text-sm mb-1">{a.name}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {a.address_line1}
                        {a.address_line2 ? `, ${a.address_line2}` : ''}
                      </p>
                      <p className="text-gray-500 text-xs">{a.city}, {a.state} — {a.pincode}</p>
                      <p className="text-gray-500 text-xs mt-1">📞 {a.phone}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowForm(true)}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-brand-gold hover:text-brand-gold transition-all text-gray-400 min-h-[110px]"
                  >
                    <FiPlus size={22} />
                    <span className="text-xs font-medium">Add New Address</span>
                  </button>
                </div>
              )}

              {/* ── New / manual address form ── */}
              {showForm && (
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <button
                      onClick={() => { setShowForm(false); setAddrErrors({}) }}
                      className="text-sm text-brand-red hover:underline font-medium"
                    >
                      ← Use a saved address
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="addr_name" className="block text-xs font-semibold text-gray-600 mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="addr_name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={addr.name}
                        onChange={handleAddrChange}
                        placeholder="Recipient's full name"
                        className={`input-field text-sm ${addrErrors.name ? 'border-red-400' : ''}`}
                      />
                      {addrErrors.name && <p className="text-red-500 text-xs mt-0.5">{addrErrors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="addr_phone" className="block text-xs font-semibold text-gray-600 mb-1">
                        Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="addr_phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={addr.phone}
                        onChange={handleAddrChange}
                        placeholder="+91 98765 43210"
                        className={`input-field text-sm ${addrErrors.phone ? 'border-red-400' : ''}`}
                      />
                      {addrErrors.phone && <p className="text-red-500 text-xs mt-0.5">{addrErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Address Line 1 */}
                  <div>
                    <label htmlFor="addr_line1" className="block text-xs font-semibold text-gray-600 mb-1">
                      Address Line 1 <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="addr_line1"
                      name="address_line1"
                      type="text"
                      autoComplete="address-line1"
                      value={addr.address_line1}
                      onChange={handleAddrChange}
                      placeholder="Flat / House No. / Building / Street"
                      className={`input-field text-sm ${addrErrors.address_line1 ? 'border-red-400' : ''}`}
                    />
                    {addrErrors.address_line1 && <p className="text-red-500 text-xs mt-0.5">{addrErrors.address_line1}</p>}
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label htmlFor="addr_line2" className="block text-xs font-semibold text-gray-600 mb-1">
                      Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="addr_line2"
                      name="address_line2"
                      type="text"
                      autoComplete="address-line2"
                      value={addr.address_line2}
                      onChange={handleAddrChange}
                      placeholder="Area / Colony / Landmark"
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* City */}
                    <div>
                      <label htmlFor="addr_city" className="block text-xs font-semibold text-gray-600 mb-1">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="addr_city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        value={addr.city}
                        onChange={handleAddrChange}
                        placeholder="Mumbai"
                        className={`input-field text-sm ${addrErrors.city ? 'border-red-400' : ''}`}
                      />
                      {addrErrors.city && <p className="text-red-500 text-xs mt-0.5">{addrErrors.city}</p>}
                    </div>

                    {/* State */}
                    <div>
                      <label htmlFor="addr_state" className="block text-xs font-semibold text-gray-600 mb-1">
                        State <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="addr_state"
                        name="state"
                        type="text"
                        autoComplete="address-level1"
                        value={addr.state}
                        onChange={handleAddrChange}
                        placeholder="Maharashtra"
                        className={`input-field text-sm ${addrErrors.state ? 'border-red-400' : ''}`}
                      />
                      {addrErrors.state && <p className="text-red-500 text-xs mt-0.5">{addrErrors.state}</p>}
                    </div>

                    {/* PIN */}
                    <div>
                      <label htmlFor="addr_pin" className="block text-xs font-semibold text-gray-600 mb-1">
                        PIN Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="addr_pin"
                        name="pincode"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="postal-code"
                        value={addr.pincode}
                        onChange={handleAddrChange}
                        placeholder="400001"
                        className={`input-field text-sm ${addrErrors.pincode ? 'border-red-400' : ''}`}
                      />
                      {addrErrors.pincode && <p className="text-red-500 text-xs mt-0.5">{addrErrors.pincode}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-heading font-bold text-xl text-brand-charcoal mb-5">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'COD',      label: 'Cash on Delivery',         desc: 'Pay when your order arrives',  emoji: '💵' },
                  { value: 'RAZORPAY', label: 'Online Payment (Razorpay)', desc: 'UPI · Cards · Net Banking',    emoji: '💳' },
                ].map((m) => (
                  <div
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === m.value
                        ? 'border-brand-gold bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl select-none">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-charcoal text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      paymentMethod === m.value ? 'border-brand-gold bg-brand-gold' : 'border-gray-300'
                    }`}>
                      {paymentMethod === m.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Razorpay Test Payment Guidance Box */}
              {paymentMethod === 'RAZORPAY' && (
                <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl text-xs text-amber-950 space-y-2 animate-fade-in shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-brand-deep-red text-sm">
                    <span>💡</span> Razorpay Test Mode Card & Payment Guide
                  </div>
                  <p className="text-amber-800">
                    Your Razorpay account is in domestic India mode. Use these <strong>Domestic Test Cards</strong> to pay smoothly without international card errors:
                  </p>
                  <div className="bg-white/90 p-3 rounded-xl border border-amber-200 font-mono text-[12px] space-y-1">
                    <p>• <strong>Visa Test Card:</strong> <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">4012 0000 0000 0002</span></p>
                    <p>• <strong>Mastercard:</strong> <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">5123 4500 0000 0008</span></p>
                    <p>• <strong>RuPay:</strong> <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">5085 0000 0000 0003</span></p>
                    <p className="text-[11px] text-gray-600 font-sans mt-1">Expiry: Any future date (e.g. <strong>12/28</strong>) | CVV: <strong>123</strong> | OTP: <strong>123456</strong></p>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-900">
                    <span>⚡</span> <em>Tip: You can also choose <strong>Netbanking</strong> in Razorpay → pick SBI or HDFC → click "Success" for instant 1-second approval!</em>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN — Order Summary ─────────────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h2 className="font-heading font-bold text-xl text-brand-charcoal mb-4">Order Summary</h2>

              {/* Items list */}
              <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-brand-cream">
                      <img
                        src={
                          item.product?.primary_image?.image_url
                            ? getImageUrl(item.product.primary_image.image_url)
                            : '/placeholder-bridal.svg'
                        }
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/placeholder-bridal.svg' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-charcoal line-clamp-2 leading-snug">
                        {item.product_name || item.product?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-deep-red flex-shrink-0">
                      {formatPrice(parseFloat(item.unit_price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon {couponCode && `(${couponCode})`}</span>
                    <span className="font-medium">−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? '🎁 FREE' : formatPrice(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">
                    Add {formatPrice(999 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-base">
                  <span className="text-brand-charcoal">Total</span>
                  <span className="text-brand-deep-red text-xl">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="btn-primary w-full mt-5 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Placing Order…
                  </>
                ) : paymentMethod === 'COD' ? (
                  '🛍️ Place Order (COD)'
                ) : (
                  '💳 Pay Now'
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                <FiTruck size={12} />
                {shipping === 0 ? 'Free delivery on this order' : `₹${shipping} delivery charge`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Test Mode Razorpay Modal ── */}
      {showTestModal && testModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-deep-red p-6 text-white text-center relative">
              <span className="inline-block bg-yellow-400 text-gray-900 font-bold text-xs uppercase px-3 py-1 rounded-full mb-2 tracking-wider">
                🧪 Test Mode
              </span>
              <h3 className="font-heading text-2xl font-bold">Razorpay Payment</h3>
              <p className="text-white/80 text-xs mt-1">Shaaz Ethnicwear • Order #{testModalData.order?.order_number}</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-brand-cream/80 p-4 rounded-2xl border border-brand-gold/30 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Payable Amount</span>
                <span className="text-2xl font-bold text-brand-deep-red">
                  {formatPrice(testModalData.order?.total)}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <p className="font-semibold text-gray-700">Simulated Payment Gateway Details:</p>
                <p>• Razorpay Order ID: <span className="font-mono text-indigo-700">{testModalData.razorpay_order_id}</span></p>
                <p>• Customer: {testModalData.shippingAddr?.name} ({user?.email})</p>
                <p>• Currency: INR (Test Mode Enabled)</p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmTestPayment}
                  disabled={testPaying}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {testPaying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verifying Payment…
                    </>
                  ) : (
                    '✅ Approve & Pay Successfully'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  disabled={testPaying}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors"
                >
                  Cancel / Return to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
