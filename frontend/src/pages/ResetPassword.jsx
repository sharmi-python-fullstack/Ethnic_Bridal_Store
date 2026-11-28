import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordApi } from '../api/auth'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import BrandLogo from '../components/common/BrandLogo'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const resetState = location.state || {}
  const [form, setForm] = useState({
    email: resetState.email || searchParams.get('email') || '',
    otp: '',
    new_password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (form.new_password !== form.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match' })
      return
    }
    setLoading(true)
    try {
      await resetPasswordApi(form)
      toast.success('Password reset successful! Please login.')
      navigate('/login', { replace: true, state: { email: form.email, passwordReset: true } })
    } catch (err) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
        const generalError = data.non_field_errors || data.detail || data.error
        if (generalError) toast.error(Array.isArray(generalError) ? generalError[0] : generalError)
      }
      else toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size="lg" className="brand-logo--dark mx-auto mb-3" />
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">Reset Password</h1>
          <p className="text-gray-500 mt-2">Enter the OTP from your email and choose a new password.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
              { name: 'otp', label: 'OTP Code', type: 'text', placeholder: '6-digit OTP' },
              { name: 'new_password', label: 'New Password', type: 'password', placeholder: 'Min. 8 characters' },
              { name: 'confirm_password', label: 'Confirm Password', type: 'password', placeholder: 'Repeat new password' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  className={`input-field ${errors[name] ? 'border-red-400' : ''}`}
                  placeholder={placeholder}
                  inputMode={name === 'otp' ? 'numeric' : undefined}
                  maxLength={name === 'otp' ? 6 : undefined}
                  autoComplete={name === 'otp' ? 'one-time-code' : name.includes('password') ? 'new-password' : 'email'}
                  required
                />
                {errors[name] && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>}
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link to={`/forgot-password${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`} className="text-brand-red hover:underline">Resend OTP</Link>
              {' · '}
              <Link to="/login" className="text-brand-red hover:underline">Back to Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
