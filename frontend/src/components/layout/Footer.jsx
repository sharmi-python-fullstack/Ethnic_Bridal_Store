import { Link } from 'react-router-dom'
import { GiCrown } from 'react-icons/gi'
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiMapPin, FiPhone, FiMail } from 'react-icons/fi'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-deep-red text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center">
                <GiCrown className="text-brand-deep-red text-2xl" />
              </div>
              <div>
                <div className="font-heading text-xl font-bold text-white leading-tight">Shaaz Ethnicwear</div>
                <div className="text-brand-gold text-xs tracking-widest uppercase">The Complete Bridal Store</div>
              </div>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Discover exquisite bridal collections crafted with love and tradition. 
              From stunning lehengas to graceful sarees — your dream look awaits.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: FiFacebook, href: '#', label: 'Facebook' },
                { icon: FiInstagram, href: '#', label: 'Instagram' },
                { icon: FiTwitter, href: '#', label: 'Twitter' },
                { icon: FiYoutube, href: '#', label: 'YouTube' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:bg-brand-gold hover:text-brand-charcoal hover:border-brand-gold transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-brand-gold text-lg font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'All Products', to: '/products' },
                { label: 'New Arrivals', to: '/products?sort=-created_at' },
                { label: 'Sale Items', to: '/products?on_sale=true' },
                { label: 'My Orders', to: '/orders' },
                { label: 'My Wishlist', to: '/wishlist' },
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
              {[
                'Bridal Lehengas',
                'Designer Sarees',
                'Anarkali Suits',
                'Wedding Kurtis',
                'Sharara Sets',
                'Ethnic Gowns',
                'Dupatta Collection',
                'Accessories',
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/products?search=${encodeURIComponent(cat)}`}
                    className="text-white/70 hover:text-brand-gold text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold/50 group-hover:bg-brand-gold transition-colors" />
                    {cat}
                  </Link>
                </li>
              ))}
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
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-brand-gold"
                />
                <button className="bg-brand-gold text-brand-charcoal px-3 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-all">
                  Go
                </button>
              </div>
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
            {['Privacy Policy', 'Terms of Service', 'Return Policy'].map((item) => (
              <a key={item} href="#" className="text-white/60 hover:text-brand-gold text-xs transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
