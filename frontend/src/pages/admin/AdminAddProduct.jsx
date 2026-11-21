import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUpload, FiX, FiArrowLeft } from 'react-icons/fi'
import { createProduct, getAdminCategories } from '../../api/admin'
import { getErrorMessage } from '../../utils/helpers'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

const OCCASIONS = ['bridal','wedding','festive','party','casual','office']
const COLORS = ['red','pink','blue','green','yellow','orange','purple','maroon','gold','silver','white','black','multicolor']

export default function AdminAddProduct() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    name: '', category: '', description: '', price: '', discount_price: '',
    stock: '', fabric: '', care_instructions: '', occasion: '', color: '',
    is_featured: false, is_active: true,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    getAdminCategories().then((r) => setCategories(r.data.results || r.data)).catch(() => {})
  }, [])

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files)
    setImages((prev) => [...prev, ...files].slice(0, 6))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.price || isNaN(form.price)) errs.price = 'Valid price required'
    if (!form.stock || isNaN(form.stock)) errs.stock = 'Valid stock required'
    if (!form.description.trim()) errs.description = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      images.forEach((img, i) => fd.append(`image_${i}`, img))
      // We'll send primary image as first image
      if (images.length > 0) fd.set('primary_image', images[0])

      const res = await createProduct(fd)
      toast.success('Product created!')
      navigate('/admin-dashboard/products')
    } catch (err) {
      toast.error(getErrorMessage(err))
      const data = err?.response?.data
      if (data && typeof data === 'object') setErrors(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Add Product">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-brand-red text-sm font-medium hover:underline mb-5">
        <FiArrowLeft /> Back
      </button>
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Royal Bridal Lehenga" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
                placeholder="Describe the product…" />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
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

        {/* Pricing & Stock */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Pricing & Stock</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'price', label: 'Price (₹) *', placeholder: '5000' },
              { name: 'discount_price', label: 'Discount Price (₹)', placeholder: '4000' },
              { name: 'stock', label: 'Stock *', placeholder: '25' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type="number" value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  className={`input-field text-sm ${errors[name] ? 'border-red-400' : ''}`} placeholder={placeholder} min="0" />
                {errors[name] && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Product Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fabric</label>
              <input value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} className="input-field text-sm" placeholder="Silk, Cotton, etc." />
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
            <textarea value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })}
              rows={2} className="input-field resize-none text-sm" placeholder="Dry clean only, etc." />
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-brand-gold w-4 h-4" />
              <span className="text-sm font-medium">Featured Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-brand-green w-4 h-4" />
              <span className="text-sm font-medium">Active / Published</span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-bold text-brand-charcoal mb-4">Product Images</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <FiX size={10} />
                </button>
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-brand-gold text-xs text-brand-charcoal text-center font-bold py-0.5">Primary</span>}
              </div>
            ))}
            {images.length < 6 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-gold transition-colors">
                <FiUpload className="text-gray-400 mb-1" size={18} />
                <span className="text-xs text-gray-400">Add</span>
                <input type="file" accept="image/*" multiple onChange={handleImageAdd} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400">First image will be the primary image. Max 6 images.</p>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary text-base px-8">
            {loading ? 'Creating…' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-outline px-8">Cancel</button>
        </div>
      </form>
    </AdminLayout>
  )
}
