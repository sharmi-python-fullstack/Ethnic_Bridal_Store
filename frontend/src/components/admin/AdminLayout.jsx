import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { FiGrid, FiPackage, FiUsers, FiTag, FiShoppingBag, FiLogOut, FiLayers, FiChevronRight } from 'react-icons/fi'
import { GiCrown } from 'react-icons/gi'
import { logout } from '../../store/slices/authSlice'
import { clearCart } from '../../store/slices/cartSlice'

const NAV = [
  { to: '/admin-dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/admin-dashboard/products', label: 'Products', icon: FiPackage },
  { to: '/admin-dashboard/categories', label: 'Categories', icon: FiLayers },
  { to: '/admin-dashboard/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin-dashboard/users', label: 'Users', icon: FiUsers },
  { to: '/admin-dashboard/coupons', label: 'Coupons', icon: FiTag },
]

export default function AdminLayout({ children, title }) {
  const { pathname } = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearCart())
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-charcoal flex-shrink-0 hidden md:flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center">
              <GiCrown className="text-brand-charcoal text-lg" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Shaaz Ethnicwear</p>
              <p className="text-brand-gold text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to || (to !== '/admin-dashboard' && pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {isActive && <FiChevronRight size={14} />}
              </Link>
            )
          })}
        </nav>
        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <Link to="/" className="admin-sidebar-link text-gray-400 hover:text-white hover:bg-white/10 mb-1 block">
            ← Back to Store
          </Link>
          <button onClick={handleLogout} className="admin-sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full">
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <h1 className="font-heading text-xl font-bold text-brand-charcoal">{title}</h1>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
