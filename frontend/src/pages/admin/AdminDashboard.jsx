import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiUsers, FiShoppingBag, FiDollarSign, FiAlertCircle, FiTag } from 'react-icons/fi'
import { getDashboardStats } from '../../api/admin'
import { formatPrice, formatDate, getStatusColor } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const CARDS = stats ? [
    { label: 'Total Revenue', value: formatPrice(stats.total_revenue), icon: FiDollarSign, color: 'text-brand-green', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Total Orders', value: stats.total_orders, icon: FiShoppingBag, color: 'text-brand-blue', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Total Products', value: stats.total_products, icon: FiPackage, color: 'text-brand-purple', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Total Users', value: stats.total_users, icon: FiUsers, color: 'text-brand-orange', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: 'Low Stock', value: stats.low_stock_products, icon: FiAlertCircle, color: 'text-brand-red', bg: 'bg-red-50', border: 'border-red-200' },
    { label: 'Active Coupons', value: stats.active_coupons, icon: FiTag, color: 'text-brand-gold', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  ] : []

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {CARDS.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`${bg} border ${border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">{label}</span>
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center`}>
                    <Icon className={color} size={20} />
                  </div>
                </div>
                <p className={`font-heading text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Orders by Status */}
          {stats?.orders_by_status && (
            <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
              <h3 className="font-heading font-bold text-brand-charcoal mb-4">Orders by Status</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.orders_by_status).map(([status, count]) => (
                  <div key={status} className={`badge border ${getStatusColor(status)} text-sm px-4 py-2`}>
                    {status}: <span className="font-bold ml-1">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {stats?.recent_orders?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="font-heading font-bold text-brand-charcoal">Recent Orders</h3>
                <Link to="/admin-dashboard/orders" className="text-brand-red text-sm hover:underline">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Order #', 'Date', 'Status', 'Total', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.recent_orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-brand-charcoal">{o.order_number}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{formatDate(o.created_at)}</td>
                        <td className="px-5 py-3">
                          <span className={`badge border text-xs ${getStatusColor(o.status)}`}>{o.status_display}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-brand-deep-red">{formatPrice(o.total)}</td>
                        <td className="px-5 py-3">
                          <Link to={`/admin-dashboard/orders/${o.id}`} className="text-brand-red text-xs hover:underline">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
