import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/admin'
import { formatDate, formatPrice } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const EMPTY = {
  code: '', description: '', discount_type: 'PERCENTAGE', discount_value: '',
  min_order_amount: '0', max_discount_amount: '', max_uses: '0',
  valid_from: '', valid_until: '', is_active: true,
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    getCoupons()
      .then((r) => setCoupons(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openAdd = () => { setEditId(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (c) => {
    setEditId(c.id)
    setForm({ ...c, valid_from: c.valid_from?.split('T')[0] || '', valid_until: c.valid_until?.split('T')[0] || '' })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.valid_until) delete payload.valid_until
      if (!payload.max_discount_amount) delete payload.max_discount_amount
      if (editId) await updateCoupon(editId, payload)
      else await createCoupon(payload)
      toast.success(editId ? 'Coupon updated!' : 'Coupon created!')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.code?.[0] || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return
    try {
      await deleteCoupon(id)
      toast.success('Coupon deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <AdminLayout title="Coupons">
      <div className="flex justify-end mb-5">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-card p-6 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-bold text-brand-charcoal">{editId ? 'Edit Coupon' : 'New Coupon'}</h3>
            <button onClick={() => setShowForm(false)}><FiX /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            {[
              { name: 'code', label: 'Coupon Code *', placeholder: 'BRIDAL10', col: 1 },
              { name: 'description', label: 'Description', placeholder: '10% off on bridal wear', col: 1 },
              { name: 'discount_value', label: 'Discount Value *', type: 'number', placeholder: '10', col: 1 },
              { name: 'min_order_amount', label: 'Min Order (₹)', type: 'number', placeholder: '1000', col: 1 },
              { name: 'max_discount_amount', label: 'Max Discount Cap (₹)', type: 'number', placeholder: 'Optional', col: 1 },
              { name: 'max_uses', label: 'Max Uses (0=unlimited)', type: 'number', placeholder: '0', col: 1 },
            ].map(({ name, label, type = 'text', placeholder, col }) => (
              <div key={name} className={`col-span-2 sm:col-span-${col}`}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  className="input-field text-sm" placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-field text-sm">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valid From</label>
              <input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="input-field text-sm" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-brand-green w-4 h-4" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving…' : 'Save Coupon'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

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
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Valid Until', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-brand-charcoal text-sm">{c.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.discount_type}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-deep-red">
                      {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : formatPrice(c.discount_value)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatPrice(c.min_order_amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.times_used}/{c.max_uses || '∞'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.valid_until ? formatDate(c.valid_until) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={15} /></button>
                        <button onClick={() => handleDelete(c.id, c.code)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
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
