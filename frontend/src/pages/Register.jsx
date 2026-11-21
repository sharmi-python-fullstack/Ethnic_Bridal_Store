import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { GiCrown } from 'react-icons/gi'
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone } from 'react-icons/fi'
import { registerApi } from '../api/auth'
import { loginSuccess } from '../store/slices/authSlice'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Single stable onChange handler — never causes unmount
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field-level error on edit
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required'
    if (!form.last_name.trim())  errs.last_name  = 'Last name is required'
    if (!form.email.trim())      errs.email      = 'Email is required'
    if (form.password.length < 8) errs.password  = 'Password must be at least 8 characters'
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setErrors({})
    setLoading(true)
    try {
      const res = await registerApi(form)
      const { user, tokens } = res.data
      localStorage.setItem('token', tokens.access)
      localStorage.setItem('refreshToken', tokens.refresh)
      localStorage.setItem('user', JSON.stringify(user))
      dispatch(loginSuccess({ user, token: tokens.access, refreshToken: tokens.refresh }))
      toast.success('Account created! Welcome to Shaaz Ethnicwear 🎉')
      navigate('/')
    } catch (err) {
      const data = err?.response?.data
      if (data && typeof data === 'object' && !data.detail && !data.message && !data.error) {
        // Field-level errors from DRF
        setErrors(data)
      } else {
        setErrors({ general: getErrorMessage(err) })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-brand-deep-red flex items-center justify-center mx-auto mb-4 shadow-red">
            <GiCrown className="text-brand-gold text-3xl" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">Create Account</h1>
          <p className="text-gray-500 mt-2">Join the Shaaz Ethnicwear family today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* First Name + Last Name — inline, no sub-component */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  First Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={form.first_name}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.first_name ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Priya"
                  />
                </div>
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={form.last_name}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.last_name ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Sharma"
                  />
                </div>
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                  placeholder="priya@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  className={`input-field pl-10 pr-11 ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="password2" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <input
                  id="password2"
                  name="password2"
                  type={showPass2 ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password2}
                  onChange={handleChange}
                  className={`input-field pl-10 pr-11 ${errors.password2 ? 'border-red-400 focus:ring-red-300' : ''}`}
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass2((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass2 ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password2 && (
                <p className="text-red-500 text-xs mt-1">{errors.password2}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating Account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-red font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
