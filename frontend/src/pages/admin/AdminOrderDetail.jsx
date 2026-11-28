import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiEdit2, FiMapPin, FiPackage, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { createOrderTracking, deleteOrderTracking, updateOrderTracking } from '../../api/admin'
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
  const [trackingForm, setTrackingForm] = useState({ status: '', description: '', sync_order_status: true })
  const [editingTrackingId, setEditingTrackingId] = useState(null)

  const load = () => {
    axiosInstance.get(`/api/admin/orders/${id}/`)
      .then((r) => {
        setOrder(r.data)
        setNewStatus(r.data.status)
        setNewPayStatus(r.data.payment_status)
        if (!editingTrackingId) setTrackingForm((current) => ({ ...current, status: current.status || r.data.status }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await axiosInstance.patch(`/api/admin/orders/${id}/`, { status: newStatus, payment_status: newPayStatus })
      toast.success('Order updated!')
      load()
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  const resetTrackingForm = () => {
    setEditingTrackingId(null)
    setTrackingForm({ status: order?.status || 'PENDING', description: '', sync_order_status: true })
  }

  const handleTrackingSubmit = async (event) => {
    event.preventDefault()
    if (!trackingForm.description.trim()) {
      toast.error('Please enter a tracking message for the customer.')
      return
    }
    setUpdating(true)
    try {
      if (editingTrackingId) {
        await updateOrderTracking(id, editingTrackingId, {
          status: trackingForm.status,
          description: trackingForm.description,
        })
        toast.success('Tracking update edited!')
      } else {
        await createOrderTracking(id, trackingForm)
        toast.success('Tracking update added!')
      }
      resetTrackingForm()
      load()
    } catch (error) {
      toast.error(error?.response?.data?.description?.[0] || 'Unable to save the tracking update.')
    } finally {
      setUpdating(false)
    }
  }

  const editTracking = (tracking) => {
    setEditingTrackingId(tracking.id)
    setTrackingForm({ status: tracking.status, description: tracking.description, sync_order_status: false })
  }

  const removeTracking = async (trackingId) => {
    if (!window.confirm('Remove this tracking update? This cannot be undone.')) return
    setUpdating(true)
    try {
      await deleteOrderTracking(id, trackingId)
      toast.success('Tracking update removed.')
      if (editingTrackingId === trackingId) resetTrackingForm()
      load()
    } catch {
      toast.error('Unable to remove the tracking update.')
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

      {/* Customer-visible tracking controls */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-brand-charcoal">Customer Tracking Updates</h3>
            <p className="text-xs text-gray-500 mt-1">Add or correct the messages customers see in their tracking timeline.</p>
          </div>
          {editingTrackingId && (
            <button type="button" onClick={resetTrackingForm} className="text-xs font-semibold text-gray-500 hover:text-brand-deep-red inline-flex items-center gap-1">
              <FiX /> Cancel edit
            </button>
          )}
        </div>
        {editingTrackingId && <p className="text-xs text-gray-500 mb-3">Changing the status of the latest tracking update also updates the current order status. Editing an older update leaves the order status unchanged.</p>}
        <form onSubmit={handleTrackingSubmit} className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tracking status</label>
            <select value={trackingForm.status} onChange={(event) => setTrackingForm({ ...trackingForm, status: event.target.value })} className="input-field text-sm" required>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Message for customer</label>
            <input value={trackingForm.description} onChange={(event) => setTrackingForm({ ...trackingForm, description: event.target.value })} className="input-field text-sm" placeholder="Example: Parcel handed to BlueDart, tracking ID will follow." maxLength={600} required />
          </div>
          {!editingTrackingId && (
            <label className="md:col-span-2 inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer w-fit">
              <input type="checkbox" checked={trackingForm.sync_order_status} onChange={(event) => setTrackingForm({ ...trackingForm, sync_order_status: event.target.checked })} className="accent-brand-deep-red" />
              Update the current order status to match this tracking event and email the customer
            </label>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={updating} className="btn-primary text-sm inline-flex items-center gap-2">
              {editingTrackingId ? <FiEdit2 /> : <FiPlus />}
              {updating ? 'Saving…' : editingTrackingId ? 'Save Tracking Edit' : 'Add Tracking Update'}
            </button>
          </div>
        </form>
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
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-semibold text-brand-charcoal mb-4">Tracking History</h3>
        {order.tracking_history?.length > 0 ? (
          <div className="space-y-3">
            {order.tracking_history.map((t) => (
              <div key={t.id} className="flex gap-3 group">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getStatusDotColor(t.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-charcoal">{t.description}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(t.timestamp)} · {t.updated_by_name}</p>
                </div>
                <div className="flex items-start gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => editTracking(t)} className="p-1.5 text-gray-500 hover:text-brand-deep-red hover:bg-red-50 rounded" aria-label="Edit tracking update"><FiEdit2 size={15} /></button>
                  <button type="button" onClick={() => removeTracking(t.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" aria-label="Delete tracking update"><FiTrash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-500">No tracking events yet. Add the first update above.</p>}
      </div>
    </AdminLayout>
  )
}
