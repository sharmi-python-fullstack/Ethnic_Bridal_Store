import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage } from 'react-icons/fi'
import { getAdminProducts, deleteProduct } from '../../api/admin'
import { formatPrice, getImageUrl } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = (p = 1, q = '') => {
    setLoading(true)
    getAdminProducts({ page: p, search: q })
      .then((r) => {
        setProducts(r.data.results || r.data)
        setTotalPages(Math.ceil((r.data.count || 0) / 20) || 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page, search) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteProduct(id)
      toast.success(`"${name}" deleted`)
      load(page, search)
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <AdminLayout title="Products">
      <div className="flex flex-col sm:flex-row gap-3 mb-5 justify-between items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="input-field pl-9 text-sm w-64"
            />
          </div>
          <button type="submit" className="btn-primary py-2.5 px-4 text-sm">Search</button>
        </form>
        <Link to="/admin-dashboard/products/add" className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus /> Add Product
        </Link>
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
                    {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0]?.image_url ? (
                            <img src={p.images[0].image_url} alt={p.name} className="w-12 h-14 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-14 bg-brand-cream rounded-lg flex items-center justify-center">
                              <FiImage className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-brand-charcoal text-sm max-w-[200px] truncate">{p.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{p.occasion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.category?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-bold text-brand-deep-red text-sm">{formatPrice(p.discount_price || p.price)}</span>
                          {p.discount_price && <span className="block text-xs text-gray-400 line-through">{formatPrice(p.price)}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${p.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/admin-dashboard/products/edit/${p.id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                            <FiEdit2 size={15} />
                          </Link>
                          <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
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
