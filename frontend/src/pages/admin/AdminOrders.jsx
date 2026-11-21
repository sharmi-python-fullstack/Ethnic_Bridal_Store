import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiEye } from 'react-icons/fi'
import { getAdminOrders } from '../../api/admin'
import { formatPrice, formatDate, getStatusColor } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = (p = 1) => {
    setLoading(true)
    const params = { page: p }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    getAdminOrders(params)
      .then((r) => {
        setOrders(r.data.results || r.data)
        setTotalPages(Math.ceil((r.data.count || 0) / 20) || 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page, statusFilter])

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(1) }} className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order # or email…" className="input-field pl-9 text-sm w-56" />
          </div>
          <button type="submit" className="btn-primary py-2.5 px-4 text-sm">Search</button>
        </form>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field text-sm w-44">
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order #', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-brand-charcoal text-sm">{o.order_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {o.user?.email || o.user?.first_name || 'Guest'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{o.total_items}</td>
                      <td className="px-4 py-3 font-bold text-brand-deep-red text-sm">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge border text-xs ${getStatusColor(o.status)}`}>{o.status_display}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${o.payment_status === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>
                          {o.payment_status_display}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin-dashboard/orders/${o.id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg inline-block">
                          <FiEye size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === page ? 'bg-brand-deep-red text-white' : 'border border-gray-200 hover:border-brand-deep-red'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
