import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX, FiChevronDown, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi'
import BrandLogo from '../common/BrandLogo'
import { logout } from '../../store/slices/authSlice'
import { clearCart } from '../../store/slices/cartSlice'
import { setWishlist } from '../../store/slices/wishlistSlice'
import { logoutApi } from '../../api/auth'
import toast from 'react-hot-toast'

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token } = useSelector((state) => state.auth)
  const { itemCount } = useSelector((state) => state.cart)
  const { items: wishlistItems } = useSelector((state) => state.wishlist)
  const { categories } = useSelector((state) => state.products)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [announcementIndex, setAnnouncementIndex] = useState(0)

  const userMenuRef = useRef(null)
  const categoryMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const announcements = [
    <>Free Shipping on Orders Above ₹999</>,
    <>Use Code <span className="announcement-code">BRIDAL10</span> for 10% Off</>,
    <>New Year 2027 Collection: Coming Soon!</>,
  ]

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAnnouncementIndex((current) => (current + 1) % announcements.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [announcements.length])

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await logoutApi(refreshToken).catch(() => {})
      }
    } catch {}
    dispatch(logout())
    dispatch(clearCart())
    dispatch(setWishlist([]))
    setUserMenuOpen(false)
    toast.success('Logged out successfully!')
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const query = searchQuery.trim()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <header className="sticky top-0 z-50 shadow-lg">
      {/* Announcement Bar */}
      <div className="announcement-bar" aria-live="polite">
        <div className="announcement-bar__viewport">
          <div className="announcement-bar__track" style={{ transform: `translateX(-${announcementIndex * 100}%)` }}>
            {announcements.map((announcement, index) => (
              <div className="announcement-bar__slide" key={index}>🎊&nbsp; {announcement}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-brand-deep-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.5rem] py-1">
            {/* Logo */}
            <Link to="/" className="flex flex-col items-center gap-0.5 group flex-shrink-0" aria-label="Shaaz Ethnicwear home">
              <BrandLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <span className="font-heading text-white text-xs sm:text-sm font-bold leading-tight whitespace-nowrap">Shaaz Ethnicwear</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className="text-white/90 hover:text-brand-gold px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                Home
              </Link>

              {/* Products Dropdown */}
              <div className="relative" ref={categoryMenuRef}>
                <button
                  onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                  className="flex items-center gap-1 text-white/90 hover:text-brand-gold px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
                >
                  Products <FiChevronDown className={`transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoryMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-100 animate-fade-in z-50">
                    <Link
                      to="/products"
                      onClick={() => setCategoryMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-cream hover:text-brand-deep-red transition-colors font-medium"
                    >
                      All Products
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    {categories.slice(0, 8).map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setCategoryMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-600 hover:bg-brand-cream hover:text-brand-deep-red transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/products?is_featured=true"
                className="text-white/90 hover:text-brand-gold px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                New Year 2027
              </Link>
              <Link
                to="/faq"
                className="text-white/90 hover:text-brand-gold px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                FAQs
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-white/90 hover:text-brand-gold hover:bg-white/10 rounded-lg transition-all"
                aria-label="Search"
              >
                <FiSearch size={20} />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2 text-white/90 hover:text-brand-gold hover:bg-white/10 rounded-lg transition-all"
                aria-label="Wishlist"
              >
                <FiHeart size={20} />
                {wishlistItems && wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-gold text-brand-charcoal text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              {/* Cart */}
              <Link
                to={token ? '/cart' : '/login'}
                className="relative p-2 text-white/90 hover:text-brand-gold hover:bg-white/10 rounded-lg transition-all"
                aria-label="Cart"
              >
                <FiShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-gold text-brand-charcoal text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {token ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2 text-white/90 hover:text-brand-gold hover:bg-white/10 rounded-lg transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center">
                      <span className="text-brand-charcoal text-xs font-bold">
                        {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <FiChevronDown size={14} className={`hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl py-2 border border-gray-100 animate-fade-in z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-brand-charcoal truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-cream hover:text-brand-deep-red transition-colors"
                      >
                        <FiUser size={16} /> My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-cream hover:text-brand-deep-red transition-colors"
                      >
                        <FiPackage size={16} /> My Orders
                      </Link>
                      {user?.is_staff && (
                        <Link
                          to="/admin-dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 hover:text-purple-900 transition-colors"
                        >
                          <FiSettings size={16} /> Admin Dashboard
                        </Link>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1.5 bg-brand-gold text-brand-charcoal px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-all"
                >
                  <FiUser size={16} /> Login
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-white/90 hover:text-brand-gold hover:bg-white/10 rounded-lg transition-all"
              >
                {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>

          {/* Search Bar Dropdown */}
          {searchOpen && (
            <div className="pb-3 animate-fade-in">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for lehengas, sarees, kurtis..."
                  className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:bg-white/20 transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-brand-gold text-brand-charcoal px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-all"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-white/70 hover:text-white p-2"
                >
                  <FiX size={18} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/20 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg text-sm font-medium"
              >
                All Products
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg text-sm font-medium"
              >
                <span>My Wishlist</span>
                {wishlistItems && wishlistItems.length > 0 && (
                  <span className="bg-brand-gold text-brand-charcoal text-xs font-bold px-2 py-0.5 rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <Link
                to="/faq"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg text-sm font-medium"
              >
                FAQs
              </Link>
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-white/70 hover:bg-white/10 rounded-lg text-sm pl-8"
                >
                  {cat.name}
                </Link>
              ))}
              {!token && (
                <div className="pt-2 border-t border-white/20 flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center bg-brand-gold text-brand-charcoal py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center border border-brand-gold text-brand-gold py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
