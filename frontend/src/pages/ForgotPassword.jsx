import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GiCrown } from 'react-icons/gi'
import { FiMail } from 'react-icons/fi'
import { forgotPasswordApi } from '../api/auth'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'

const DEMO_RESET_EMAIL = 'customer@shaaz.com'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || DEMO_RESET_EMAIL)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [testOtp, setTestOtp] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const response = await forgotPasswordApi({ email })
      setTestOtp(response.data.test_otp || '')
      setSent(true)
      toast.success(response.data.message || 'OTP is ready.')
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
          <div className="w-16 h-16 rounded-full bg-brand-deep-red flex items-center justify-center mx-auto mb-4">
            <GiCrown className="text-brand-gold text-3xl" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">Forgot Password</h1>
          <p className="text-gray-500 mt-2">Test the complete password-reset flow without sending email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="font-heading text-xl font-bold text-brand-charcoal mb-2">{testOtp ? 'Test OTP Ready!' : 'OTP Sent!'}</h3>
              {testOtp ? (
                <div className="mb-6">
                  <p className="text-gray-600 text-sm">No real email was sent. Use this one-time test code:</p>
                  <p className="mt-3 py-3 rounded-xl bg-amber-50 border border-amber-200 font-mono text-3xl tracking-[0.3em] font-bold text-brand-deep-red" aria-label={`Test OTP ${testOtp}`}>{testOtp}</p>
                  <p className="text-xs text-gray-500 mt-2">Valid for 10 minutes and only for {email}.</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-6">We've sent a 6-digit OTP to <strong>{email}</strong>. Check your inbox.</p>
              )}
              <Link to={`/reset-password?email=${encodeURIComponent(email)}`} state={{ email, testOtp }} className="btn-primary inline-block w-full text-center">
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
                <p className="text-xs text-gray-500 mt-2">Demo account: <strong>{DEMO_RESET_EMAIL}</strong>. No email will be sent.</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating test OTP…' : 'Get Test OTP'}
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
