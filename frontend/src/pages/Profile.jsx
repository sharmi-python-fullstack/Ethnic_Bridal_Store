import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiUser, FiMail, FiPhone, FiCalendar, FiCamera, FiLock, FiPackage, FiHeart, FiMapPin } from 'react-icons/fi'
import { updateProfile, changePassword } from '../api/auth'
import { updateUser } from '../store/slices/authSlice'
import { getErrorMessage } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Profile() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)

  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwErrors, setPwErrors] = useState({})

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const res = await updateProfile(profile)
      dispatch(updateUser(res.data.user || res.data))
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwErrors({})
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwErrors({ confirm_password: 'Passwords do not match' })
      return
    }
    setPwLoading(true)
    try {
      await changePassword(pwForm)
      setPwForm({ old_password: '', new_password: '', confirm_password: '' })
      toast.success('Password changed successfully!')
    } catch (err) {
      const data = err?.response?.data
      if (data?.old_password) setPwErrors({ old_password: data.old_password })
      else toast.error(getErrorMessage(err))
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-charcoal mb-6">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-5">
              {/* Avatar */}
              <div className="text-center mb-5">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="w-20 h-20 rounded-full bg-brand-deep-red flex items-center justify-center text-white text-2xl font-bold">
                    {user?.first_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
                <p className="font-semibold text-brand-charcoal mt-2 text-sm">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>

              <nav className="space-y-1">
                {[
                  { key: 'profile', label: 'Profile', icon: FiUser },
                  { key: 'password', label: 'Password', icon: FiLock },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      tab === key ? 'bg-brand-deep-red text-white' : 'text-gray-600 hover:bg-brand-cream'
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-2" />
                {[
                  { to: '/orders', label: 'My Orders', icon: FiPackage },
                  { to: '/wishlist', label: 'My Wishlist', icon: FiHeart },
                  { to: '/addresses', label: 'Addresses', icon: FiMapPin },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-brand-cream transition-colors"
                  >
                    <Icon size={16} /> {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {tab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="font-heading font-bold text-xl text-brand-charcoal mb-5">Personal Information</h2>
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} className="input-field pl-10 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} className="input-field pl-10 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input value={user?.email} disabled className="input-field pl-10 text-sm bg-gray-50 cursor-not-allowed" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field pl-10 text-sm" placeholder="+91 XXXXX XXXXX" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="date" value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} className="input-field pl-10 text-sm" />
                    </div>
                  </div>
                  <button type="submit" disabled={profileLoading} className="btn-primary">
                    {profileLoading ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'password' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="font-heading font-bold text-xl text-brand-charcoal mb-5">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  {[
                    { name: 'old_password', label: 'Current Password', placeholder: 'Enter current password' },
                    { name: 'new_password', label: 'New Password', placeholder: 'Min. 8 characters' },
                    { name: 'confirm_password', label: 'Confirm Password', placeholder: 'Repeat new password' },
                  ].map(({ name, label, placeholder }) => (
                    <div key={name}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                      <input
                        type="password"
                        value={pwForm[name]}
                        onChange={(e) => setPwForm({ ...pwForm, [name]: e.target.value })}
                        className={`input-field text-sm ${pwErrors[name] ? 'border-red-400' : ''}`}
                        placeholder={placeholder}
                        required
                      />
                      {pwErrors[name] && <p className="text-red-500 text-xs mt-1">{pwErrors[name]}</p>}
                    </div>
                  ))}
                  <button type="submit" disabled={pwLoading} className="btn-primary">
                    {pwLoading ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
