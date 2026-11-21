import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { GiCrown } from 'react-icons/gi'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { loginApi } from '../api/auth'
import { loginSuccess } from '../store/slices/authSlice'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (!form.email) { setErrors({ email: 'Email is required' }); return }
    if (!form.password) { setErrors({ password: 'Password is required' }); return }

    setLoading(true)
    try {
      const res = await loginApi(form)
      const { user, tokens } = res.data
      localStorage.setItem('token', tokens.access)
      localStorage.setItem('refreshToken', tokens.refresh)
      localStorage.setItem('user', JSON.stringify(user))
      dispatch(loginSuccess({ user, token: tokens.access, refreshToken: tokens.refresh }))
      toast.success(`Welcome back, ${user.first_name || user.email}!`)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = getErrorMessage(err)
      setErrors({ general: msg })
      toast.error(msg)
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
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to your Shaaz Ethnicwear account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-red hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base">
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-red font-semibold hover:underline">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
