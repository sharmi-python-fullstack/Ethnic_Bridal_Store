import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiMapPin, FiPackage, FiTruck, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi'
import { getOrderDetail, cancelOrder } from '../api/orders'
import { formatPrice, formatDate, formatDateTime, getStatusColor, getStatusDotColor, getImageUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  /* Legacy simulated-payment flow retained below only as a migration note.
    setPaying(true)
    try {
      await verifyPayment({
        order_id: order.id,
        razorpay_order_id: order.razorpay_order_id || `order_test_${order.id}`,
        razorpay_payment_id: `pay_approved_${Date.now()}`,
        razorpay_signature: 'test_approved',
      })
      toast.success('🎉 Payment verified and received! Order is confirmed.')
      reloadOrder()
    } catch {
      toast.error('Payment confirmation failed.')
    } finally {
      setPaying(false)
    }
  */

  useEffect(() => {
    let active = true
    const loadOrder = async (initial = false) => {
      try {
        const response = await getOrderDetail(id)
        if (active) setOrder(response.data)
      } catch {
        // Keep the last known order visible if a background refresh fails.
      } finally {
        if (active && initial) setLoading(false)
      }
    }
    setLoading(true)
    loadOrder(true)
    const refreshVisible = () => { if (document.visibilityState === 'visible') loadOrder() }
    const timer = window.setInterval(refreshVisible, 30000)
    document.addEventListener('visibilitychange', refreshVisible)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshVisible)
    }
  }, [id])

  const refreshOrder = async () => {
    setRefreshing(true)
    try {
      const response = await getOrderDetail(id)
      setOrder(response.data)
      toast.success('Order status refreshed')
    } catch {
      toast.error('Unable to refresh your order. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      await cancelOrder(id)
      const r = await getOrderDetail(id)
      setOrder(r.data)
      toast.success('Order cancelled successfully')
    } catch {
      toast.error('Could not cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" />
    </div>
  )

  if (!order) return <div className="min-h-screen bg-brand-cream flex items-center justify-center"><p className="text-gray-400">Order not found</p></div>

  const currentStepIdx = STEPS.indexOf(order.status)

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-brand-red text-sm font-medium hover:underline mb-6">
          <FiArrowLeft /> All Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold text-brand-charcoal">{order.order_number}</h1>
              <p className="text-sm text-gray-400 mt-0.5">Placed on {formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={refreshOrder} disabled={refreshing} className="text-sm text-brand-deep-red border border-brand-deep-red/30 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60 flex items-center gap-1.5" aria-label="Refresh order status">
                <FiRefreshCw className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
              <span className={`badge border ${getStatusColor(order.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotColor(order.status)}`} />
                {order.status_display}
              </span>
              {order.can_cancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-sm text-red-500 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  {cancelling ? 'Cancelling…' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Tracking Steps */}
          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
            <div className="mt-6">
              <div className="flex items-center">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    <div className="flex items-center w-full">
                      <div className={`w-full h-1 ${i === 0 ? 'opacity-0' : currentStepIdx >= i ? 'bg-brand-gold' : 'bg-gray-200'}`} />
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                        currentStepIdx >= i
                          ? 'bg-brand-gold border-brand-gold text-white'
                          : 'bg-white border-gray-200 text-gray-400'
                      }`}>
                        {currentStepIdx > i ? <FiCheck size={14} /> : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      <div className={`w-full h-1 ${i === STEPS.length - 1 ? 'opacity-0' : currentStepIdx > i ? 'bg-brand-gold' : 'bg-gray-200'}`} />
                    </div>
                    <span className={`text-xs mt-1.5 font-medium ${currentStepIdx >= i ? 'text-brand-gold' : 'text-gray-400'}`}>
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-semibold text-brand-charcoal mb-3 flex items-center gap-2">
              <FiMapPin className="text-brand-gold" /> Shipping Address
            </h3>
            {order.shipping_address && (
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-semibold text-brand-charcoal">{order.shipping_address.name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                <p>{order.shipping_address.country}</p>
                <p className="mt-1 font-medium">{order.shipping_address.phone}</p>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-semibold text-brand-charcoal mb-3 flex items-center gap-2">
              💳 Payment Details
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{order.payment_method_display}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${order.payment_status === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>
                  {order.payment_status_display}
                </span>
              </div>
              {order.coupon_code && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Coupon</span>
                  <span className="font-medium text-green-600">{order.coupon_code}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount</span><span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Shipping</span><span>{order.shipping_charge > 0 ? formatPrice(order.shipping_charge) : 'FREE'}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-deep-red">
                  <span>Total</span><span>{formatPrice(order.total)}</span>
                </div>
              </div>

              {false && order.payment_status !== 'PAID' && order.payment_method === 'RAZORPAY' && (
                <div className="mt-4 pt-3 border-t">
                  <button
                    onClick={handleCompletePayment}
                    disabled={paying}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verifying Payment…
                      </>
                    ) : (
                      '💳 Complete Payment Now (Instant Approval)'
                    )}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-1.5">
                    Click to confirm test payment and mark order as Paid
                  </p>
                </div>
              )}
              {order.payment_status !== 'PAID' && order.payment_method === 'RAZORPAY' && (
                <div className="mt-4 pt-3 border-t text-center">
                  <p className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                    Payment is awaiting Razorpay confirmation. Return to checkout to securely complete it, or cancel this pending order.
                  </p>
                  <Link to="/checkout" className="inline-block text-xs font-semibold text-brand-deep-red hover:underline mt-2">
                    Return to checkout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
          <h3 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2">
            <FiPackage className="text-brand-gold" /> Order Items ({order.items?.length})
          </h3>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <img
                  src={item.product_image || 'https://placehold.co/80x100/FFF8F0/9B1313?text=SE'}
                  alt={item.product_name}
                  className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => { e.target.src = 'https://placehold.co/80x100/FFF8F0/9B1313?text=SE' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-charcoal text-sm">{item.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.size && `Size: ${item.size}`}{item.size && item.color ? ' | ' : ''}{item.color && `Color: ${item.color}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <span className="font-bold text-brand-deep-red text-sm flex-shrink-0">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking History */}
        {order.tracking_history?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2">
              <FiTruck className="text-brand-gold" /> Tracking History
            </h3>
            <div className="space-y-3">
              {order.tracking_history.map((t) => (
                <div key={t.id} className="flex gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getStatusDotColor(t.status)}`} />
                  <div>
                    <p className="text-sm font-semibold text-brand-charcoal">{t.description}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(t.timestamp)} · {t.updated_by_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
