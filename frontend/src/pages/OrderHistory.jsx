import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiArrowRight } from 'react-icons/fi'
import { getOrders } from '../api/orders'
import { formatPrice, formatDate, getStatusColor, getStatusDotColor } from '../utils/helpers'

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders()
      .then((r) => setOrders(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" />
    </div>
  )

  if (orders.length === 0) return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center py-20 text-center px-4">
      <FiPackage className="text-7xl text-gray-300 mb-5" />
      <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">No Orders Yet</h2>
      <p className="text-gray-400 mb-7">Start shopping to see your orders here</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-charcoal mb-6">My Orders</h1>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-brand-charcoal">{order.order_number}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge border ${getStatusColor(order.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotColor(order.status)}`} />
                    {order.status_display}
                  </span>
                  <span className="font-bold text-brand-deep-red">{formatPrice(order.total)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {order.total_items} item{order.total_items !== 1 ? 's' : ''} •{' '}
                  {order.payment_method_display} •{' '}
                  <span className={order.payment_status === 'PAID' ? 'text-green-600' : 'text-orange-500'}>
                    {order.payment_status_display}
                  </span>
                </span>
                <Link
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-1 text-brand-red font-medium hover:underline"
                >
                  View Details <FiArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
