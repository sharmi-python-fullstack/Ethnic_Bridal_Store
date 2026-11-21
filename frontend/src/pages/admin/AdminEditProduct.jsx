import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi'
import { getAdminCategories, updateProduct } from '../../api/admin'
import axiosInstance from '../../api/axios'
import { getErrorMessage } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const OCCASIONS = ['bridal','wedding','festive','party','casual','office']
const COLORS = ['red','pink','blue','green','yellow','orange','purple','maroon','gold','silver','white','black','multicolor']

export default function AdminEditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [newImages, setNewImages] = useState([])
  const [form, setForm] = useState({
    name: '', category: '', description: '', price: '', discount_price: '',
    stock: '', fabric: '', care_instructions: '', occasion: '', color: '',
    is_featured: false, is_active: true,
  })

  useEffect(() => {
    Promise.all([
      axiosInstance.get(`/api/admin/products/${id}/`),
      getAdminCategories(),
    ]).then(([pRes, cRes]) => {
      const p = pRes.data
      setForm({
        name: p.name || '', category: p.category?.id || p.category || '',
        description: p.description || '', price: p.price || '',
        discount_price: p.discount_price || '', stock: p.stock || '',
        fabric: p.fabric || '', care_instructions: p.care_instructions || '',
        occasion: p.occasion || '', color: p.color || '',
        is_featured: p.is_featured || false, is_active: p.is_active !== false,
      })
      setCategories(cRes.data.results || cRes.data)
    }).catch(() => navigate('/admin-dashboard/products'))
    .finally(() => setPageLoading(false))
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      newImages.forEach((img, i) => fd.append(`image_${i}`, img))
      await updateProduct(id, fd)
      toast.success('Product updated!')
      navigate('/admin-dashboard/products')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return <AdminLayout title="Edit Product"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full" /></div></AdminLayout>

  return (
    <AdminLayout title="Edit Product">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-brand-red text-sm font-medium hover:underline mb-5">
        <FiArrowLeft /> Back
      </button>
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Product Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input-field resize-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field text-sm">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Occasion</label>
                <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className="input-field text-sm">
                  <option value="">Select occasion</option>
                  {OCCASIONS.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Pricing & Stock</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'price', label: 'Price (₹) *' },
              { name: 'discount_price', label: 'Discount Price' },
              { name: 'stock', label: 'Stock *' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type="number" value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="input-field text-sm" min="0" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fabric</label>
              <input value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
              <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input-field text-sm">
                <option value="">Select color</option>
                {COLORS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Care Instructions</label>
            <textarea value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} rows={2} className="input-field resize-none text-sm" />
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-brand-gold w-4 h-4" />
              <span className="text-sm font-medium">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-brand-green w-4 h-4" />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Add More Images</h3>
          <div className="flex gap-3 flex-wrap mb-2">
            {newImages.map((img, i) => (
              <div key={i} className="relative w-20 h-24 rounded-lg overflow-hidden bg-gray-100">
                <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setNewImages(newImages.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <FiX size={10} />
                </button>
              </div>
            ))}
            <label className="w-20 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-gold transition-colors">
              <FiUpload className="text-gray-400 mb-1" size={16} />
              <span className="text-xs text-gray-400">Upload</span>
              <input type="file" accept="image/*" multiple onChange={(e) => setNewImages((prev) => [...prev, ...Array.from(e.target.files)])} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary text-base px-8">
            {loading ? 'Saving…' : 'Update Product'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-outline px-8">Cancel</button>
        </div>
      </form>
    </AdminLayout>
  )
}
