import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiMail } from 'react-icons/fi'
import { forgotPasswordApi } from '../api/auth'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'
import BrandLogo from '../components/common/BrandLogo'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const response = await forgotPasswordApi({ email })
      setSent(true)
      toast.success(response.data.message || 'OTP sent.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size="lg" className="mx-auto mb-3" />
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">Forgot Password</h1>
          <p className="text-gray-500 mt-2">We’ll send a one-time code to your registered email address.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="font-heading text-xl font-bold text-brand-charcoal mb-2">OTP Sent!</h3>
              <p className="text-gray-500 text-sm mb-6">We’ve sent a 6-digit OTP to <strong>{email}</strong>. Check your inbox and spam folder. The code expires in 10 minutes.</p>
              <Link to={`/reset-password?email=${encodeURIComponent(email)}`} state={{ email }} className="btn-primary inline-block w-full text-center">
                Enter OTP & Reset Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Use the email address registered with your Shaaz Ethnicwear account.</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-brand-red font-medium hover:underline">Back to Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
