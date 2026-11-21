import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiCheck } from 'react-icons/fi'
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/auth'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India', is_default: false }

export default function AddressManager() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const load = () => {
    getAddresses().then((r) => setAddresses(r.data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setErrors({}); setShowForm(true) }
  const openEdit = (a) => { setEditId(a.id); setForm({ ...a }); setErrors({}); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name) errs.name = 'Required'
    if (!form.phone) errs.phone = 'Required'
    if (!form.address_line1) errs.address_line1 = 'Required'
    if (!form.city) errs.city = 'Required'
    if (!form.state) errs.state = 'Required'
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = 'Must be 6 digits'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      if (editId) {
        await updateAddress(editId, form)
        toast.success('Address updated!')
      } else {
        await addAddress(form)
        toast.success('Address added!')
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return
    try {
      await deleteAddress(id)
      toast.success('Address deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id)
      toast.success('Default address updated')
      load()
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">My Addresses</h1>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 py-2.5 px-4">
            <FiPlus /> Add Address
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-card">
            <FiMapPin className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No addresses saved yet</p>
            <button onClick={openAdd} className="btn-primary">Add First Address</button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr.id} className={`bg-white rounded-2xl shadow-card p-5 border-2 ${addr.is_default ? 'border-brand-gold' : 'border-transparent'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-brand-charcoal">{addr.name}</p>
                      {addr.is_default && (
                        <span className="bg-brand-gold text-brand-charcoal text-xs font-bold px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                    <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-brand-gold border border-brand-gold/30 px-2.5 py-1 rounded-lg hover:bg-brand-cream transition-colors">
                        Set Default
                      </button>
                    )}
                    <button onClick={() => openEdit(addr)} className="p-1.5 text-gray-400 hover:text-brand-blue transition-colors">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mt-5 bg-white rounded-2xl shadow-card p-6">
            <h3 className="font-heading font-bold text-xl text-brand-charcoal mb-5">
              {editId ? 'Edit Address' : 'Add New Address'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'name', label: 'Full Name *', placeholder: 'Recipient name' },
                  { name: 'phone', label: 'Phone *', placeholder: '+91 XXXXX XXXXX' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                    <input value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                      className={`input-field text-sm ${errors[name] ? 'border-red-400' : ''}`} placeholder={placeholder} />
                    {errors[name] && <p className="text-red-500 text-xs mt-0.5">{errors[name]}</p>}
                  </div>
                ))}
              </div>
              {[
                { name: 'address_line1', label: 'Address Line 1 *', placeholder: 'House / Flat / Building' },
                { name: 'address_line2', label: 'Address Line 2', placeholder: 'Area / Colony (optional)' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    className={`input-field text-sm ${errors[name] ? 'border-red-400' : ''}`} placeholder={placeholder} />
                  {errors[name] && <p className="text-red-500 text-xs mt-0.5">{errors[name]}</p>}
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'city', label: 'City *', placeholder: 'City' },
                  { name: 'state', label: 'State *', placeholder: 'State' },
                  { name: 'pincode', label: 'PIN *', placeholder: '6-digit' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                    <input value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                      className={`input-field text-sm ${errors[name] ? 'border-red-400' : ''}`} placeholder={placeholder} maxLength={name === 'pincode' ? 6 : undefined} />
                    {errors[name] && <p className="text-red-500 text-xs mt-0.5">{errors[name]}</p>}
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="accent-brand-gold w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Set as default address</span>
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Address'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
