import { useState, useEffect } from 'react'
import { FiSearch, FiToggleLeft, FiToggleRight, FiShield } from 'react-icons/fi'
import { getAdminUsers, updateUserStatus } from '../../api/admin'
import { formatDate } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'
import axiosInstance from '../../api/axios'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (q = '') => {
    setLoading(true)
    const params = {}
    if (q) params.search = q
    getAdminUsers(params)
      .then((r) => setUsers(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggleActive = async (user) => {
    try {
      await updateUserStatus(user.id, !user.is_active)
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`)
      load(search)
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleToggleStaff = async (user) => {
    try {
      await axiosInstance.patch(`/api/admin/users/${user.id}/`, { is_staff: !user.is_staff })
      toast.success(`Admin role ${!user.is_staff ? 'granted' : 'revoked'}`)
      load(search)
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <AdminLayout title="Users">
      <form onSubmit={(e) => { e.preventDefault(); load(search) }} className="flex gap-2 mb-5">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="input-field pl-9 text-sm w-64" />
        </div>
        <button type="submit" className="btn-primary py-2.5 px-4 text-sm">Search</button>
      </form>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Email', 'Joined', 'Orders', 'Status', 'Admin', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-deep-red flex items-center justify-center text-white text-xs font-bold">
                          {u.first_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-brand-charcoal">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.date_joined)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">-</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_staff && <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1 w-fit"><FiShield size={11} /> Admin</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleActive(u)} className={`text-xs px-2 py-1 rounded-lg border transition-colors ${u.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleToggleStaff(u)} className="text-xs px-2 py-1 rounded-lg border border-purple-200 text-purple-500 hover:bg-purple-50 transition-colors">
                          {u.is_staff ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
