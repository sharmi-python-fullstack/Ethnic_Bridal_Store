import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload } from 'react-icons/fi'
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin'
import { getErrorMessage } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', parent: '', is_active: true, image: null }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    getAdminCategories()
      .then((r) => setCategories(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openAdd = () => { setEditId(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (c) => {
    setEditId(c.id)
    setForm({ name: c.name, description: c.description || '', parent: c.parent || '', is_active: c.is_active, image: null })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('is_active', form.is_active)
      if (form.parent) fd.append('parent', form.parent)
      if (form.image) fd.append('image', form.image)
      if (editId) await updateCategory(editId, fd)
      else await createCategory(fd)
      toast.success(editId ? 'Category updated!' : 'Category created!')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteCategory(id)
      toast.success('Category deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <AdminLayout title="Categories">
      <div className="flex justify-end mb-5">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-card p-6 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-bold text-brand-charcoal">{editId ? 'Edit Category' : 'New Category'}</h3>
            <button onClick={() => setShowForm(false)}><FiX /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field text-sm" required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent Category</label>
              <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className="input-field text-sm">
                <option value="">None (root category)</option>
                {categories.filter((c) => !c.parent && c.id !== editId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image</label>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg p-3 hover:border-brand-gold transition-colors">
                <FiUpload className="text-gray-400" />
                <span className="text-sm text-gray-500">{form.image ? form.image.name : 'Upload image'}</span>
                <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="hidden" />
              </label>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-brand-green w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving…' : 'Save Category'}</button>
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
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Parent', 'Products', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-brand-charcoal text-sm">{c.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {c.parent ? categories.find((x) => x.id === c.parent)?.name || '-' : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{c.product_count || 0}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={15} /></button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}
