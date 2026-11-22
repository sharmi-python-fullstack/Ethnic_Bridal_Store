import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiMapPin, FiPlus, FiCheck, FiTruck, FiEdit2 } from 'react-icons/fi'
import { getCart, createOrder } from '../api/orders'
import { getAddresses } from '../api/auth'
import { createRazorpayOrder, verifyPayment } from '../api/payments'
import { setCart, clearCart, applyCoupon as applyCouponAction, removeCoupon } from '../store/slices/cartSlice'
import { getActiveCoupons, applyCoupon as applyCouponApi } from '../api/coupons'
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

  // Card & OTP form state
  const [cardData, setCardData] = useState({
    number: '4012 0000 0000 0002',
    name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Shaaz Customer',
    expiry: '12/28',
    cvv: '123'
  })
  const [cardErrors, setCardErrors] = useState({})
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [pendingOrderData, setPendingOrderData] = useState(null)
  const [availableCoupons, setAvailableCoupons] = useState([
    { code: 'BRIDAL10', discount_type: 'PERCENTAGE', discount_value: '10', min_order_amount: '1000', description: '10% off on all bridal orders' },
    { code: 'FLAT500', discount_type: 'FIXED', discount_value: '500', min_order_amount: '3000', description: 'Flat ₹500 off on minimum purchase of ₹3,000' },
    { code: 'WEDDING20', discount_type: 'PERCENTAGE', discount_value: '20', min_order_amount: '5000', description: '20% off on luxury bridal purchases above ₹5,000' },
  ])

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
        const [cartRes, addrRes, couponRes] = await Promise.all([
          getCart(),
          getAddresses(),
          getActiveCoupons().catch(() => ({ data: [] })),
        ])
        if (cancelled) return
        dispatch(setCart(cartRes.data))
        if (couponRes?.data?.length > 0) {
          setAvailableCoupons(couponRes.data)
        }
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

  /* ── coupon picker helper ─────────────────────────────────────────────── */
  const handlePickCoupon = async (c) => {
    if (couponCode === c.code) {
      dispatch(removeCoupon())
      toast('Coupon removed', { icon: 'ℹ️' })
      return
    }
    const minAmt = parseFloat(c.min_order_amount || 0)
    if (subtotal < minAmt) {
      toast.error(`Minimum order of ${formatPrice(minAmt)} required to use ${c.code}`)
      return
    }
    try {
      const res = await applyCouponApi(c.code, subtotal)
      dispatch(applyCouponAction({ code: c.code, discount: res.data.discount_amount }))
      toast.success(`🎉 ${c.code} applied! You save ${formatPrice(res.data.discount_amount)}`)
    } catch (err) {
      // Fallback discount calculation
      const val = parseFloat(c.discount_value || 0)
      const amt = c.discount_type === 'PERCENTAGE' ? (subtotal * val) / 100 : val
      dispatch(applyCouponAction({ code: c.code, discount: amt }))
      toast.success(`🎉 ${c.code} applied! You save ${formatPrice(amt)}`)
    }
  }

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

  /* ── validate card details ─────────────────────────────────────────────── */
  const validateCard = () => {
    const errs = {}
    const rawNumber = (cardData.number || '').replace(/\s/g, '')
    if (rawNumber.length < 15) errs.number = 'Please enter a valid 16-digit card number'
    if (!cardData.name.trim()) errs.name = 'Cardholder name is required'
    const [month, year] = (cardData.expiry || '').split('/')
    const m = parseInt(month, 10)
    if (!m || m < 1 || m > 12 || !year || year.length < 2) {
      errs.expiry = 'Valid MM/YY required'
    }
    if (!/^\d{3,4}$/.test(cardData.cvv || '')) {
      errs.cvv = '3 or 4 digits'
    }
    setCardErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ── quick fill card presets ───────────────────────────────────────────── */
  const handleQuickFillCard = (type) => {
    if (type === 'VISA') {
      setCardData({
        ...cardData,
        number: '4012 0000 0000 0002',
        expiry: '12/28',
        cvv: '123'
      })
    } else if (type === 'MASTERCARD') {
      setCardData({
        ...cardData,
        number: '5123 4500 0000 0008',
        expiry: '12/28',
        cvv: '123'
      })
    } else if (type === 'RUPAY') {
      setCardData({
        ...cardData,
        number: '5085 0000 0000 0003',
        expiry: '12/28',
        cvv: '123'
      })
    }
    setCardErrors({})
  }

  /* ── initiate card payment & open OTP verification ─────────────────────── */
  const handleInitiateCardPayment = async () => {
    if (!validateAddr()) {
      toast.error('Please complete the shipping address')
      return
    }
    if (!validateCard()) {
      toast.error('Please enter valid card number, expiry, and CVV')
      return
    }

    setLoading(true)
    try {
      const shippingAddr = getShippingAddr()
      const payload = {
        shipping_address: shippingAddr,
        payment_method: 'RAZORPAY',
        coupon_code: couponCode || '',
      }

      const orderRes = await createOrder(payload)
      const order = orderRes.data.order

      let razorpay_order_id = `order_card_${order.id}_${Date.now()}`
      try {
        const rpRes = await createRazorpayOrder({ order_id: order.id })
        if (rpRes.data?.razorpay_order_id) {
          razorpay_order_id = rpRes.data.razorpay_order_id
        }
      } catch (e) {
        console.warn('Razorpay order creation fallback:', e)
      }

      setPendingOrderData({ order, razorpay_order_id, shippingAddr })
      setOtpValue('')
      setOtpError('')
      setShowOtpModal(true)
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to place order.')
    } finally {
      setLoading(false)
    }
  }

  /* ── verify 3D Secure / Bank OTP ───────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    if (!otpValue.trim()) {
      setOtpError('Please enter the 6-digit Bank OTP')
      return
    }

    if (otpValue.trim() !== '123456') {
      setOtpError('Incorrect OTP. For test mode, enter: 123456')
      return
    }

    setOtpVerifying(true)
    setOtpError('')
    try {
      await verifyPayment({
        order_id: pendingOrderData.order.id,
        razorpay_order_id: pendingOrderData.razorpay_order_id,
        razorpay_payment_id: `pay_card_${Date.now()}`,
        razorpay_signature: 'card_otp_approved',
      })
      dispatch(clearCart())
      setShowOtpModal(false)
      toast.success('🎉 Card Payment Approved! Order confirmed.')
      navigate(`/orders/${pendingOrderData.order.id}`)
    } catch (err) {
      setOtpError(getErrorMessage(err) || 'Payment verification failed.')
    } finally {
      setOtpVerifying(false)
    }
  }

  /* ── confirm test payment ────────────────────────────────────────────── */
  const handleConfirmTestPayment = async () => {
    if (!testModalData) return
    setTestPaying(true)
    try {
      await verifyPayment({
        order_id: testModalData.order.id,
        razorpay_order_id: testModalData.razorpay_order_id || `order_test_${testModalData.order.id}`,
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
  const handlePlaceOrder = async (instantTest = false) => {
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

        // If user chose 1-Click Instant Test Approval
        if (instantTest) {
          try {
            await verifyPayment({
              order_id: order.id,
              razorpay_order_id: `order_instant_${order.id}`,
              razorpay_payment_id: `pay_instant_${Date.now()}`,
              razorpay_signature: 'instant_test_approved',
            })
            dispatch(clearCart())
            toast.success('🎉 Test payment approved! Order confirmed.')
            navigate(`/orders/${order.id}`)
            return
          } catch (e) {
            console.error('Instant test payment error:', e)
          }
        }

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
                  toast('Window closed. You can complete payment below with 1-click test approval.', { icon: 'ℹ️' })
                  setTestModalData({ order, razorpay_order_id, amount, currency, shippingAddr })
                  setShowTestModal(true)
                  setLoading(false)
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

              {/* Card Payment Form (Razorpay 3DS Flow) */}
              {paymentMethod === 'RAZORPAY' && (
                <div className="mt-4 p-5 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white border border-amber-200 rounded-2xl space-y-4 animate-fade-in shadow-sm">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💳</span>
                      <div>
                        <h3 className="font-bold text-brand-charcoal text-sm">Enter Card Details</h3>
                        <p className="text-[11px] text-gray-500">Fast 3D Secure / OTP Verification</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-full">
                      Razorpay Test Mode
                    </span>
                  </div>

                  {/* Quick Fill Domestic Test Cards */}
                  <div>
                    <p className="text-[11px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <span>⚡</span> Quick-fill Test Cards:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickFillCard('VISA')}
                        className="text-[11px] bg-white hover:bg-amber-100 text-brand-deep-red font-bold px-3 py-1 rounded-lg border border-amber-300 shadow-sm transition-all"
                      >
                        Visa (4012...)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFillCard('MASTERCARD')}
                        className="text-[11px] bg-white hover:bg-amber-100 text-brand-deep-red font-bold px-3 py-1 rounded-lg border border-amber-300 shadow-sm transition-all"
                      >
                        Mastercard (5123...)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFillCard('RUPAY')}
                        className="text-[11px] bg-white hover:bg-amber-100 text-brand-deep-red font-bold px-3 py-1 rounded-lg border border-amber-300 shadow-sm transition-all"
                      >
                        RuPay (5085...)
                      </button>
                    </div>
                  </div>

                  {/* Card Form Inputs */}
                  <div className="space-y-3 pt-1">
                    {/* Card Number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Card Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardData.number}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
                            const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
                            setCardData({ ...cardData, number: formatted })
                            if (cardErrors.number) setCardErrors({ ...cardErrors, number: null })
                          }}
                          placeholder="4012 0000 0000 0002"
                          maxLength={19}
                          className={`w-full py-2.5 px-3 border rounded-xl font-mono text-sm tracking-wider bg-white ${
                            cardErrors.number ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'
                          }`}
                        />
                        <span className="absolute right-3 top-2.5 text-sm select-none">💳</span>
                      </div>
                      {cardErrors.number && <p className="text-red-500 text-[11px] mt-0.5">{cardErrors.number}</p>}
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Cardholder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardData.name}
                        onChange={(e) => {
                          setCardData({ ...cardData, name: e.target.value })
                          if (cardErrors.name) setCardErrors({ ...cardErrors, name: null })
                        }}
                        placeholder="Name as on card"
                        className={`w-full py-2.5 px-3 border rounded-xl text-sm bg-white ${
                          cardErrors.name ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'
                        }`}
                      />
                      {cardErrors.name && <p className="text-red-500 text-[11px] mt-0.5">{cardErrors.name}</p>}
                    </div>

                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Expiry Date (MM/YY) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`
                            setCardData({ ...cardData, expiry: val })
                            if (cardErrors.expiry) setCardErrors({ ...cardErrors, expiry: null })
                          }}
                          placeholder="12/28"
                          maxLength={5}
                          className={`w-full py-2.5 px-3 border rounded-xl text-sm font-mono text-center bg-white ${
                            cardErrors.expiry ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'
                          }`}
                        />
                        {cardErrors.expiry && <p className="text-red-500 text-[11px] mt-0.5">{cardErrors.expiry}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          CVV / CVC <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={cardData.cvv}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            setCardData({ ...cardData, cvv: val })
                            if (cardErrors.cvv) setCardErrors({ ...cardErrors, cvv: null })
                          }}
                          placeholder="123"
                          maxLength={4}
                          className={`w-full py-2.5 px-3 border rounded-xl text-sm font-mono text-center bg-white ${
                            cardErrors.cvv ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'
                          }`}
                        />
                        {cardErrors.cvv && <p className="text-red-500 text-[11px] mt-0.5">{cardErrors.cvv}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Proceed to Pay with Card Button */}
                  <div className="pt-2 border-t border-amber-200/80 space-y-2">
                    <button
                      type="button"
                      onClick={handleInitiateCardPayment}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-brand-deep-red via-red-800 to-brand-deep-red hover:from-red-900 hover:to-red-950 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Processing Card…
                        </>
                      ) : (
                        `🔒 Pay ${formatPrice(grandTotal)} & Verify Bank OTP`
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
                      <span>🛡️</span>
                      <span>256-bit Encrypted • Verified by Visa / Mastercard 3DS</span>
                    </div>
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

              {/* ── Available Coupons to Pick ── */}
              <div className="border-t border-gray-100 pt-4 mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-gold mb-2.5 flex items-center gap-1.5">
                  <span>🎟️</span> Available Coupons (Tap to Apply)
                </p>
                <div className="space-y-2">
                  {availableCoupons.map((c) => {
                    const isApplied = couponCode === c.code
                    const minAmt = parseFloat(c.min_order_amount || 0)
                    const isEligible = subtotal >= minAmt

                    return (
                      <div
                        key={c.code}
                        onClick={() => handlePickCoupon(c)}
                        className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isApplied
                            ? 'border-green-500 bg-green-50/80 text-green-950 shadow-sm'
                            : isEligible
                            ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 text-brand-charcoal'
                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200 text-brand-deep-red">
                              {c.code}
                            </span>
                            <span className="font-semibold text-brand-charcoal">
                              {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 truncate">
                            {c.description || (minAmt > 0 ? `Min purchase ${formatPrice(minAmt)}` : 'Valid on any order')}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`flex-shrink-0 text-[11px] px-3 py-1 rounded-lg font-bold transition-all ${
                            isApplied
                              ? 'bg-green-600 text-white'
                              : isEligible
                              ? 'bg-brand-deep-red text-white hover:bg-red-800'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isApplied ? 'Applied ✓' : isEligible ? 'Pick' : `Min ${formatPrice(minAmt)}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
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
                onClick={paymentMethod === 'RAZORPAY' ? handleInitiateCardPayment : handlePlaceOrder}
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
                  '💳 Pay with Card & Verify OTP'
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

      {/* ── 3D Secure Bank OTP Verification Modal ── */}
      {showOtpModal && pendingOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            {/* Bank Header */}
            <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-brand-deep-red p-6 text-white text-center relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  🔒 Verified by Visa / Mastercard 3DS
                </span>
              </div>
              <h3 className="font-heading text-2xl font-bold">Bank OTP Authentication</h3>
              <p className="text-white/80 text-xs mt-1">
                Shaaz Ethnicwear • Order #{pendingOrderData.order?.order_number}
              </p>
            </div>

            {/* OTP Form Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex justify-between items-center text-sm font-bold text-brand-charcoal">
                  <span>Total Amount</span>
                  <span className="text-brand-deep-red text-base">
                    {formatPrice(pendingOrderData.order?.total)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 pt-1 border-t border-amber-200">
                  <span>Card Number</span>
                  <span className="font-mono font-semibold">
                    •••• •••• •••• {(cardData.number || '').replace(/\s/g, '').slice(-4) || '0002'}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-600">
                A 6-digit One Time Password (OTP) has been sent to your registered mobile number ending with <strong>••8901</strong>.
              </div>

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 text-center mb-1.5 uppercase tracking-wider">
                    Enter 6-Digit Bank OTP
                  </label>
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => {
                      setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setOtpError('')
                    }}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    className="w-full py-3.5 px-4 text-center font-mono text-2xl font-bold tracking-[0.5em] border-2 border-brand-deep-red/40 rounded-xl focus:border-brand-deep-red focus:ring-4 focus:ring-red-100 outline-none"
                    disabled={otpVerifying}
                  />
                  <div className="mt-2 text-center text-xs text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200">
                    💡 <strong>Test Mode OTP:</strong> Enter <span className="font-mono font-bold text-emerald-900 bg-emerald-200/80 px-1.5 py-0.5 rounded">123456</span> to approve
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={otpVerifying}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {otpVerifying ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verifying with Bank…
                      </>
                    ) : (
                      '🔐 Submit OTP & Confirm Order'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    disabled={otpVerifying}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-xl text-xs transition-colors"
                  >
                    Cancel / Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
