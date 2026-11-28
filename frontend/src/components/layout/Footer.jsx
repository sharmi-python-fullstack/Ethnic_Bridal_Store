import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiMapPin, FiPhone, FiMail } from 'react-icons/fi'
import { getCategories } from '../../api/products'
import axiosInstance from '../../api/axios'
import BrandLogo from '../common/BrandLogo'

const SOCIAL_PLATFORMS = {
  facebook: { icon: FiFacebook, label: 'Facebook' },
  instagram: { icon: FiInstagram, label: 'Instagram' },
  x: { icon: FiTwitter, label: 'X' },
  youtube: { icon: FiYoutube, label: 'YouTube' },
}

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [footerCategories, setFooterCategories] = useState([])
  const [socialLinks, setSocialLinks] = useState([])

  useEffect(() => {
    getCategories()
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data.results || [])
        setFooterCategories(data.filter((c) => c.is_active !== false).slice(0, 8))
      })
      .catch(() => {})
    axiosInstance.get('/api/social-links/')
      .then((response) => setSocialLinks(Array.isArray(response.data) ? response.data : []))
      .catch(() => setSocialLinks([]))
  }, [])

  const handleSubscribe = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="bg-brand-deep-red text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex flex-col items-center gap-1 mb-4 w-fit" aria-label="Shaaz Ethnicwear home">
              <BrandLogo size="md" />
              <div className="text-brand-gold text-xs tracking-widest uppercase">The Complete Bridal Store</div>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Discover exquisite bridal collections crafted with love and tradition. 
              From stunning lehengas to graceful sarees — your dream look awaits.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ platform, url }) => {
                const item = SOCIAL_PLATFORMS[platform]
                if (!item || !url.startsWith('https://')) return null
                const { icon: Icon, label } = item
                return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:bg-brand-gold hover:text-brand-charcoal hover:border-brand-gold transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              )})}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-brand-gold text-lg font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'All Products', to: '/products' },
                { label: 'New Year 2027', to: '/products?ordering=-created_at' },
                { label: 'Sale Items', to: '/products?has_discount=true' },
                { label: 'My Orders', to: '/orders' },
                { label: 'My Wishlist', to: '/wishlist' },
                { label: 'FAQs', to: '/faq' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-white/70 hover:text-brand-gold text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold/50 group-hover:bg-brand-gold transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading text-brand-gold text-lg font-semibold mb-5">Categories</h4>
            <ul className="space-y-3">
              {footerCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-white/70 hover:text-brand-gold text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold/50 group-hover:bg-brand-gold transition-colors" />
                    {cat.name}
                  </Link>
                </li>
              ))}
              {footerCategories.length === 0 && (
                <li className="text-white/50 text-sm italic">Loading categories…</li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-brand-gold text-lg font-semibold mb-5">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <FiMapPin size={18} className="text-brand-gold flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">
                  123, Bridal Lane, Fashion Street,<br />Mumbai, Maharashtra 400001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone size={18} className="text-brand-gold flex-shrink-0" />
                <a href="tel:+919876543210" className="text-white/70 hover:text-brand-gold text-sm transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail size={18} className="text-brand-gold flex-shrink-0" />
                <a href="mailto:info@shaazethnicwear.com" className="text-white/70 hover:text-brand-gold text-sm transition-colors">
                  info@shaazethnicwear.com
                </a>
              </li>
            </ul>

            {/* Newsletter Mini */}
            <div className="mt-6">
              <p className="text-white/80 text-sm font-medium mb-2">Subscribe for updates</p>
              <form className="flex gap-2" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  aria-label="Email address for newsletter"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-brand-gold"
                />
                <button type="submit" className="bg-brand-gold text-brand-charcoal px-3 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-all">
                  Go
                </button>
              </form>
              {subscribed && <p className="text-brand-gold text-xs mt-2" role="status">Thanks — you’re on the list!</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/60 text-xs text-center">
            © {currentYear} Shaaz Ethnicwear. All rights reserved. Crafted with ❤️ in India.
          </p>
          <div className="flex items-center gap-4">
            {[
              ['Privacy Policy', 'privacy'],
              ['Terms of Service', 'terms'],
              ['Return Policy', 'returns'],
            ].map(([label, page]) => (
              <Link key={page} to={`/legal/${page}`} className="text-white/60 hover:text-brand-gold text-xs transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
