import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiArrowRight, FiTruck, FiShield, FiRotateCcw, FiAward, FiStar } from 'react-icons/fi'
import { GiCrown, GiFlowerEmblem, GiDiamondRing, GiLotus } from 'react-icons/gi'
import { getFeaturedProducts, getCategories } from '../api/products'
import { setFeatured, setCategories } from '../store/slices/productSlice'
import { getImageUrl, formatPrice } from '../utils/helpers'
import ProductCard from '../components/common/ProductCard'

/* ─── hero slides ─────────────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    title: 'Bridal Dreams Begin Here',
    subtitle: 'Exquisite bridal lehengas for your most special day',
    bg: 'from-rose-950 via-rose-900 to-pink-900',
    cta: 'Shop Bridal', link: '/category/bridal-lehengas',
    accent: 'bg-brand-gold',
    leftDress: { color: '#c0392b', accent: '#f39c12' },
    rightDress: { color: '#8e1a1a', accent: '#e74c3c' },
  },
  {
    title: 'Royal Wedding Collection',
    subtitle: 'Designer sarees & anarkali suits for every occasion',
    bg: 'from-purple-950 via-purple-900 to-indigo-900',
    cta: 'Explore Collection', link: '/products?occasion=wedding',
    accent: 'bg-yellow-400',
    leftDress: { color: '#6c3483', accent: '#f1c40f' },
    rightDress: { color: '#4a235a', accent: '#9b59b6' },
  },
  {
    title: 'Festive Elegance 2025',
    subtitle: 'Celebrate every festival in style with our ethnic wear',
    bg: 'from-orange-950 via-orange-900 to-amber-900',
    cta: 'View Festive Wear', link: '/products?occasion=festive',
    accent: 'bg-white',
    leftDress: { color: '#c0392b', accent: '#f39c12' },
    rightDress: { color: '#d35400', accent: '#e67e22' },
  },
]

const FEATURES = [
  { icon: FiTruck,     title: 'Free Shipping',    desc: 'On orders above ₹999',  color: 'text-green-600',  bg: 'bg-green-50' },
  { icon: FiShield,    title: '100% Authentic',   desc: 'Genuine ethnic wear',   color: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: FiRotateCcw, title: 'Easy Returns',     desc: '7-day return policy',   color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: FiAward,     title: 'Premium Quality',  desc: 'Handpicked fabrics',    color: 'text-purple-600', bg: 'bg-purple-50' },
]

const OCCASION_TAGS = [
  { label: '👰 Bridal',    color: 'bg-rose-100 text-rose-700',     value: 'bridal' },
  { label: '💒 Wedding',   color: 'bg-purple-100 text-purple-700', value: 'wedding' },
  { label: '🪔 Festive',   color: 'bg-orange-100 text-orange-700', value: 'festive' },
  { label: '🎉 Party',     color: 'bg-pink-100 text-pink-700',     value: 'party' },
  { label: '☀️ Casual',    color: 'bg-blue-100 text-blue-700',     value: 'casual' },
]

/* ─── Animated Bridal Dress SVG ───────────────────────────────────────────── */
function BridalDressSVG({ color, accent, flip = false, size = 220 }) {
  return (
    <svg
      width={size} height={size * 1.6}
      viewBox="0 0 200 320"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* glow */}
      <defs>
        <radialGradient id={`glow-${color.replace('#','')}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </radialGradient>
        <filter id="blur-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* glow circle */}
      <ellipse cx="100" cy="230" rx="90" ry="80"
        fill={`url(#glow-${color.replace('#','')})`} opacity="0.5"/>

      {/* lehenga skirt — full flared */}
      <path d="M 70 140 Q 20 200 10 310 L 190 310 Q 180 200 130 140 Z"
        fill={color} opacity="0.95"/>

      {/* skirt embroidery layers */}
      <path d="M 60 170 Q 20 220 12 300 L 50 300 Q 55 230 80 185 Z"
        fill={accent} opacity="0.25"/>
      <path d="M 140 170 Q 180 220 188 300 L 150 300 Q 145 230 120 185 Z"
        fill={accent} opacity="0.25"/>

      {/* skirt border bottom */}
      <path d="M 10 300 Q 100 285 190 300 L 190 310 L 10 310 Z"
        fill={accent} opacity="0.6"/>

      {/* skirt embroidery dots */}
      {[40,60,80,100,120,140,160].map((x,i) => (
        <circle key={i} cx={x} cy={260 + (i%2)*15} r="3"
          fill={accent} opacity="0.7"/>
      ))}
      {[55,75,95,115,135].map((x,i) => (
        <circle key={i} cx={x} cy={235 + (i%2)*10} r="2"
          fill={accent} opacity="0.5"/>
      ))}

      {/* waist band */}
      <rect x="68" y="135" width="64" height="12" rx="4"
        fill={accent} opacity="0.8"/>
      {/* waist dots */}
      {[76,88,100,112,124].map((x,i) => (
        <circle key={i} cx={x} cy="141" r="2" fill={color} opacity="0.9"/>
      ))}

      {/* blouse */}
      <path d="M 72 90 L 65 138 L 135 138 L 128 90 Q 100 80 72 90 Z"
        fill={color} opacity="0.9"/>
      {/* blouse embroidery */}
      <path d="M 78 100 Q 100 95 122 100 L 120 120 Q 100 115 80 120 Z"
        fill={accent} opacity="0.3"/>

      {/* neck */}
      <ellipse cx="100" cy="88" rx="18" ry="10"
        fill="#f5cba7" opacity="0.9"/>

      {/* head */}
      <ellipse cx="100" cy="68" rx="20" ry="22"
        fill="#f5cba7" opacity="0.95"/>

      {/* hair */}
      <path d="M 80 56 Q 100 42 120 56 L 122 68 Q 100 60 78 68 Z"
        fill="#2c1810" opacity="0.9"/>
      {/* hair bun / maangtika */}
      <ellipse cx="100" cy="47" rx="12" ry="8" fill="#2c1810" opacity="0.9"/>
      <circle cx="100" cy="40" r="4" fill={accent} opacity="0.95"/>
      <line x1="100" y1="44" x2="100" y2="58" stroke={accent} strokeWidth="1.5" opacity="0.8"/>
      <circle cx="100" cy="58" r="3" fill={accent} opacity="0.9"/>

      {/* dupatta — flowing */}
      <path d="M 78 92 Q 50 110 30 150 Q 20 180 25 220 L 35 215 Q 32 185 48 155 Q 62 118 85 105 Z"
        fill={accent} opacity="0.4"/>
      <path d="M 122 92 Q 150 110 170 150 Q 180 180 175 220 L 165 215 Q 168 185 152 155 Q 138 118 115 105 Z"
        fill={accent} opacity="0.3"/>

      {/* arms */}
      <path d="M 70 100 Q 50 125 48 150" stroke="#f5cba7" strokeWidth="12"
        fill="none" strokeLinecap="round"/>
      <path d="M 130 100 Q 150 125 152 150" stroke="#f5cba7" strokeWidth="12"
        fill="none" strokeLinecap="round"/>

      {/* bangles */}
      <circle cx="50" cy="148" r="7" fill="none" stroke={accent} strokeWidth="3"/>
      <circle cx="150" cy="148" r="7" fill="none" stroke={accent} strokeWidth="3"/>

      {/* necklace */}
      <path d="M 83 95 Q 100 105 117 95" stroke={accent} strokeWidth="2"
        fill="none" strokeLinecap="round"/>
      {[88,94,100,106,112].map((x,i) => (
        <circle key={i} cx={x} cy={97 + Math.abs(i-2)*2} r="2"
          fill={accent} opacity="0.9"/>
      ))}

      {/* earrings */}
      <line x1="81" y1="76" x2="78" y2="88" stroke={accent} strokeWidth="1.5"/>
      <circle cx="77" cy="90" r="3" fill={accent} opacity="0.9"/>
      <line x1="119" y1="76" x2="122" y2="88" stroke={accent} strokeWidth="1.5"/>
      <circle cx="123" cy="90" r="3" fill={accent} opacity="0.9"/>

      {/* sparkles */}
      <circle cx="30"  cy="130" r="2" fill={accent} opacity="0.7"/>
      <circle cx="170" cy="140" r="2" fill={accent} opacity="0.7"/>
      <circle cx="45"  cy="90"  r="1.5" fill="white" opacity="0.6"/>
      <circle cx="160" cy="95"  r="1.5" fill="white" opacity="0.6"/>
      <circle cx="90"  cy="280" r="2" fill={accent} opacity="0.5"/>
      <circle cx="115" cy="295" r="2" fill={accent} opacity="0.5"/>
    </svg>
  )
}

/* ─── floating decoration element ────────────────────────────────────────── */
function FloatingDecor({ x, y, delay, color }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x, top: y,
        animation: `float ${3 + delay}s ease-in-out ${delay}s infinite alternate`,
      }}
    >
      <GiFlowerEmblem style={{ color, fontSize: 20, opacity: 0.6 }} />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { featured, categories } = useSelector((s) => s.products)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [visible,      setVisible]      = useState({})
  const sectionRefs = useRef({})

  /* auto-slide */
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((s) => (s + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  /* scroll animations */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setVisible((p) => ({ ...p, [e.target.id]: true }))
      }),
      { threshold: 0.15 }
    )
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [loading])

  const addRef = (id) => (el) => { sectionRefs.current[id] = el }

  const fadeIn = (id) =>
    visible[id]
      ? 'opacity-100 translate-y-0 transition-all duration-700'
      : 'opacity-0 translate-y-8'

  /* load data */
  useEffect(() => {
    ;(async () => {
      try {
        const [fRes, cRes] = await Promise.all([
          getFeaturedProducts(),
          categories.length === 0 ? getCategories() : Promise.resolve(null),
        ])
        dispatch(setFeatured(fRes.data.results || fRes.data))
        if (cRes) dispatch(setCategories(cRes.data))
      } catch {}
      finally { setLoading(false) }
    })()
  }, [dispatch, categories.length])

  const slide = HERO_SLIDES[currentSlide]

  return (
    <div className="bg-brand-cream min-h-screen">

      {/* inject float keyframes once */}
      <style>{`
        @keyframes float {
          0%   { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-18px) rotate(8deg); }
        }
        @keyframes dressFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .dress-float { animation: dressFloat 4s ease-in-out infinite; }
        .dress-float-slow { animation: dressFloat 5.5s ease-in-out 1s infinite; }
        .shimmer-pulse { animation: shimmer 2.5s ease-in-out infinite; }
        .spin-slow { animation: spinSlow 12s linear infinite; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <section
        className={`relative bg-gradient-to-br ${slide.bg} text-white overflow-hidden`}
        style={{ minHeight: 480, transition: 'background 0.8s' }}
      >
        {/* paisley overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paisley.png')" }} />

        {/* ── floating petals / decor ── */}
        {[
          { x:'8%',  y:'15%', d:0,   c:'#f1c40f' },
          { x:'5%',  y:'55%', d:1.2, c:'#e74c3c' },
          { x:'12%', y:'80%', d:0.5, c:'#f39c12' },
          { x:'85%', y:'12%', d:0.8, c:'#9b59b6' },
          { x:'90%', y:'50%', d:1.5, c:'#f1c40f' },
          { x:'87%', y:'78%', d:0.3, c:'#e74c3c' },
        ].map((d, i) => (
          <FloatingDecor key={i} x={d.x} y={d.y} delay={d.d} color={d.c} />
        ))}

        {/* spinning mandala rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
          <div className="spin-slow w-[600px] h-[600px] rounded-full border-2 border-white/40" />
        </div>

        <div className="relative flex items-stretch" style={{ minHeight: 480 }}>

          {/* ── LEFT DRESS ── */}
          <div className="hidden lg:flex flex-col items-center justify-end flex-shrink-0 pl-6 pb-0"
            style={{ width: 200 }}>
            <div className="dress-float">
              <BridalDressSVG
                color={slide.leftDress.color}
                accent={slide.leftDress.accent}
                size={180}
              />
            </div>
            {/* label ribbon */}
            <div className="mb-3 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 border border-white/20">
              ✨ Bridal Collection
            </div>
          </div>

          {/* ── CENTER TEXT ── */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
            {/* spinning crown ring */}
            <div className="relative mb-5">
              <div className={`w-16 h-16 rounded-full ${slide.accent} flex items-center justify-center shadow-gold animate-bounce`}>
                <GiCrown className="text-brand-deep-red text-3xl" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-white/30 spin-slow" />
            </div>

            <span className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3 font-medium">
              Shaaz Ethnicwear
            </span>
            <h1
              key={currentSlide}
              className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-5"
              style={{ animation: 'fadeIn .6s ease' }}
            >
              {slide.title}
            </h1>
            <p className="text-white/80 text-base md:text-xl mb-8 max-w-xl"
              style={{ animation: 'fadeIn .8s ease .2s both' }}>
              {slide.subtitle}
            </p>

            <div className="flex gap-4 flex-wrap justify-center">
              <Link to={slide.link}
                className="bg-brand-gold text-brand-charcoal px-8 py-3.5 rounded-full font-bold text-sm hover:scale-105 hover:shadow-gold transition-all flex items-center gap-2 shadow-lg">
                {slide.cta} <FiArrowRight />
              </Link>
              <Link to="/products"
                className="border-2 border-white/50 text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-white/15 transition-all">
                View All
              </Link>
            </div>

            {/* slide dots */}
            <div className="flex gap-2 mt-10">
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-8 bg-brand-gold' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* stats bar */}
            <div className="flex items-center gap-6 mt-8 flex-wrap justify-center">
              {[
                { n: '500+', label: 'Bridal Designs' },
                { n: '50K+', label: 'Happy Brides' },
                { n: '4.9★', label: 'Rating' },
              ].map(({ n, label }) => (
                <div key={label} className="text-center">
                  <p className="text-brand-gold font-heading font-bold text-xl">{n}</p>
                  <p className="text-white/60 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT DRESS ── */}
          <div className="hidden lg:flex flex-col items-center justify-end flex-shrink-0 pr-6 pb-0"
            style={{ width: 200 }}>
            <div className="dress-float-slow">
              <BridalDressSVG
                color={slide.rightDress.color}
                accent={slide.rightDress.accent}
                flip
                size={180}
              />
            </div>
            <div className="mb-3 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 border border-white/20">
              💎 New Arrivals
            </div>
          </div>
        </div>

        {/* bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ display:'block', height:40 }}>
            <path d="M0,40 C360,0 1080,40 1440,0 L1440,40 Z" fill="#FFF8F0"/>
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          OCCASION FILTER BAR
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-white shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="text-sm text-gray-500 font-semibold whitespace-nowrap">Shop:</span>
          {OCCASION_TAGS.map((t) => (
            <button key={t.value}
              onClick={() => navigate(`/products?occasion=${t.value}`)}
              className={`${t.color} px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap hover:opacity-80 hover:scale-105 transition-all`}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES STRIP
      ═══════════════════════════════════════════════════════ */}
      <section id="features" ref={addRef('features')}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${fadeIn('features')}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className={`${bg} rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <Icon className={`${color} text-lg`} />
              </div>
              <div>
                <p className="font-semibold text-brand-charcoal text-xs">{title}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section id="cats" ref={addRef('cats')}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${fadeIn('cats')}`}>
          <div className="text-center mb-8">
            <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1">Collections</p>
            <h2 className="section-title">Shop by Category</h2>
            <p className="text-gray-400 text-sm">Curated for every celebration</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} to={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all duration-300 aspect-[3/4]">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none' }}/>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-deep-red/30 to-brand-gold/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                {/* hover ring */}
                <div className="absolute inset-0 ring-0 group-hover:ring-4 ring-brand-gold/60 rounded-2xl transition-all duration-300" />
                <div className="relative z-10 p-3 h-full flex flex-col justify-end">
                  <h3 className="font-heading text-white font-bold text-sm drop-shadow">{cat.name}</h3>
                  <p className="text-white/70 text-xs">{cat.product_count} Products</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/products" className="btn-outline inline-flex items-center gap-2 text-sm">
              View All Products <FiArrowRight />
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURED PRODUCTS
      ═══════════════════════════════════════════════════════ */}
      <section id="featured" ref={addRef('featured')}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${fadeIn('featured')}`}>
        <div className="text-center mb-8">
          <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1">Handpicked</p>
          <h2 className="section-title">✨ Featured Products</h2>
          <p className="text-gray-400 text-sm">Favourites from our master craftsmen</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card">
                <div className="skeleton h-64" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" /><div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <GiCrown className="text-5xl text-brand-gold mx-auto mb-4" />
            <p className="text-gray-400">Our collection is coming soon…</p>
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            View Full Collection <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROMO BANNER WITH SIDE DRESS DECORATIONS
      ═══════════════════════════════════════════════════════ */}
      <section id="promo" ref={addRef('promo')}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${fadeIn('promo')}`}>
        <div className="relative bg-gradient-to-r from-brand-deep-red via-red-700 to-rose-700 rounded-3xl overflow-hidden">
          {/* sparkle dots */}
          {[12,25,40,55,70,85].map((x,i) => (
            <div key={i} className="absolute top-4 shimmer-pulse"
              style={{ left:`${x}%`, animationDelay:`${i*0.4}s` }}>
              <FiStar style={{ color:'#f1c40f', fontSize:14, opacity:0.7 }} />
            </div>
          ))}
          <div className="relative z-10 flex items-center justify-between px-8 md:px-16 py-10">
            {/* left mini dress */}
            <div className="hidden md:block opacity-80 dress-float flex-shrink-0 -ml-4">
              <BridalDressSVG color="#7b1818" accent="#f1c40f" size={120} />
            </div>
            {/* center text */}
            <div className="text-white text-center flex-1">
              <span className="text-brand-gold text-xs font-bold uppercase tracking-widest">Special Offer</span>
              <h3 className="font-heading text-2xl md:text-4xl font-bold my-3">
                Use Code{' '}
                <span className="bg-brand-gold text-brand-charcoal px-3 py-1 rounded-xl inline-block">
                  BRIDAL10
                </span>{' '}
                for 10% Off
              </h3>
              <p className="text-white/80 mb-5 text-sm md:text-base">
                On your first bridal collection purchase. Limited time!
              </p>
              <Link to="/products?occasion=bridal"
                className="inline-flex items-center gap-2 bg-white text-brand-deep-red px-7 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg">
                Shop Now <FiArrowRight />
              </Link>
            </div>
            {/* right mini dress */}
            <div className="hidden md:block opacity-80 dress-float-slow flex-shrink-0 -mr-4">
              <BridalDressSVG color="#5a0e0e" accent="#e74c3c" flip size={120} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          COLOR SHOP
      ═══════════════════════════════════════════════════════ */}
      <section id="colors" ref={addRef('colors')}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${fadeIn('colors')}`}>
        <div className="text-center mb-8">
          <h2 className="section-title">Shop by Color</h2>
          <p className="text-gray-400 text-sm">Find your perfect shade</p>
        </div>
        <div className="flex flex-wrap justify-center gap-5">
          {[
            { name: 'Red',      color: '#DC143C', value: 'red' },
            { name: 'Pink',     color: '#DB2777', value: 'pink' },
            { name: 'Purple',   color: '#7C3AED', value: 'purple' },
            { name: 'Blue',     color: '#1D4ED8', value: 'blue' },
            { name: 'Green',    color: '#16A34A', value: 'green' },
            { name: 'Yellow',   color: '#D97706', value: 'yellow' },
            { name: 'Orange',   color: '#EA580C', value: 'orange' },
            { name: 'Gold',     color: '#D4AF37', value: 'gold' },
          ].map(({ name, color, value }) => (
            <Link key={value} to={`/products?color=${value}`}
              className="flex flex-col items-center gap-1.5 group">
              <div className="relative w-14 h-14 rounded-full border-4 border-white shadow-lg group-hover:scale-125 group-hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: color }}>
                {/* inner shine */}
                <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white/30" />
              </div>
              <span className="text-xs font-medium text-gray-500 group-hover:text-brand-deep-red transition-colors">
                {name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════ */}
      <section id="reviews" ref={addRef('reviews')}
        className={`bg-white py-14 ${fadeIn('reviews')}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-1">Testimonials</p>
            <h2 className="section-title">What Our Brides Say 💕</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name:'Priya Sharma',   city:'Mumbai',    rating:5, text:'Absolutely stunning lehenga! Fabric quality is exceptional and delivery was on time for my wedding.' },
              { name:'Anjali Patel',   city:'Ahmedabad', rating:5, text:'Best bridal shopping experience! The team helped me find the perfect saree. Highly recommended!' },
              { name:'Meera Reddy',    city:'Hyderabad', rating:5, text:'The anarkali suit was exactly as pictured. Beautiful craftsmanship and great packaging!' },
            ].map((t, i) => (
              <div key={i}
                className="relative bg-brand-cream rounded-2xl p-6 border border-brand-gold/20 hover:shadow-gold transition-shadow"
                style={{ animation: `fadeIn .5s ease ${i*0.15}s both` }}>
                {/* quote mark */}
                <div className="absolute top-4 right-5 font-heading text-6xl text-brand-gold/20 leading-none select-none">"</div>
                <div className="flex gap-0.5 mb-3">
                  {Array(t.rating).fill(0).map((_,j) => (
                    <FiStar key={j} className="text-brand-gold fill-brand-gold text-sm" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-deep-red flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-charcoal text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
