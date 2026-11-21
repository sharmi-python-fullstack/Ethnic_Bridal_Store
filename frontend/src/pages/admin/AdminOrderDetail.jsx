import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiMapPin, FiPackage } from 'react-icons/fi'
import { updateOrderStatus } from '../../api/admin'
import axiosInstance from '../../api/axios'
import { formatPrice, formatDate, formatDateTime, getStatusColor, getStatusDotColor } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const STATUSES = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED']
const PAY_STATUSES = ['PENDING','PAID','FAILED','REFUNDED']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newPayStatus, setNewPayStatus] = useState('')

  const load = () => {
    axiosInstance.get(`/api/admin/orders/${id}/`)
      .then((r) => {
        setOrder(r.data)
        setNewStatus(r.data.status)
        setNewPayStatus(r.data.payment_status)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await updateOrderStatus(id, newStatus)
      await axiosInstance.patch(`/api/admin/orders/${id}/`, { payment_status: newPayStatus })
      toast.success('Order updated!')
      load()
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <AdminLayout title="Order Detail">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full" />
      </div>
    </AdminLayout>
  )

  if (!order) return <AdminLayout title="Order Detail"><p className="text-gray-400">Order not found</p></AdminLayout>

  return (
    <AdminLayout title={`Order: ${order.order_number}`}>
      <Link to="/admin-dashboard/orders" className="inline-flex items-center gap-1.5 text-brand-red text-sm font-medium hover:underline mb-5">
        <FiArrowLeft /> Back to Orders
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Status Update */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-brand-charcoal mb-4">Update Order Status</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Order Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
              <select value={newPayStatus} onChange={(e) => setNewPayStatus(e.target.value)} className="input-field text-sm">
                {PAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={handleUpdate} disabled={updating} className="btn-primary text-sm w-full">
              {updating ? 'Updating…' : 'Update Order'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-brand-charcoal mb-3">Order Summary</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Order #</span><span className="font-medium">{order.order_number}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Placed</span><span className="font-medium">{formatDate(order.created_at)}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`badge border text-xs ${getStatusColor(order.status)}`}>{order.status_display}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className={`font-medium ${order.payment_status === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>{order.payment_status_display}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium">{order.payment_method_display}</span></div>
            {order.coupon_code && <div className="flex justify-between"><span className="text-gray-500">Coupon</span><span className="text-green-600 font-medium">{order.coupon_code}</span></div>}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-400"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between text-xs text-gray-400"><span>Shipping</span><span>{order.shipping_charge > 0 ? formatPrice(order.shipping_charge) : 'FREE'}</span></div>
              <div className="flex justify-between font-bold text-brand-deep-red"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.shipping_address && (
        <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
          <h3 className="font-semibold text-brand-charcoal mb-3 flex items-center gap-2"><FiMapPin className="text-brand-gold" /> Shipping Address</h3>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-brand-charcoal">{order.shipping_address.name}</p>
            <p>{order.shipping_address.address_line1}{order.shipping_address.address_line2 ? `, ${order.shipping_address.address_line2}` : ''}</p>
            <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
            <p>{order.shipping_address.phone}</p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h3 className="font-semibold text-brand-charcoal mb-4 flex items-center gap-2"><FiPackage className="text-brand-gold" /> Items ({order.items?.length})</h3>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4 pb-3 border-b border-gray-50 last:border-0">
              <img src={item.product_image || 'https://placehold.co/60x80/FFF8F0/9B1313?text=SE'} alt={item.product_name} className="w-14 h-18 object-cover rounded-lg" onError={(e) => { e.target.src = 'https://placehold.co/60x80/FFF8F0/9B1313?text=SE' }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-brand-charcoal">{item.product_name}</p>
                <p className="text-xs text-gray-400">{item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`}</p>
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <span className="font-bold text-brand-deep-red text-sm">{formatPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking */}
      {order.tracking_history?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-brand-charcoal mb-4">Tracking History</h3>
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
    </AdminLayout>
  )
}
