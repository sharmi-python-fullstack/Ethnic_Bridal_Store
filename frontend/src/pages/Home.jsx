import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiArrowRight, FiTruck, FiShield, FiRotateCcw, FiAward, FiStar } from 'react-icons/fi'
import { GiCrown, GiFlowerEmblem, GiLotus } from 'react-icons/gi'
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
    leftImg: '/images/hero-bride-left.jpg',
    rightImg: '/images/hero-bride.jpg',
  },
  {
    title: 'Royal Wedding Collection',
    subtitle: 'Designer sarees & anarkali suits for every occasion',
    bg: 'from-purple-950 via-purple-900 to-indigo-900',
    cta: 'Explore Collection', link: '/products?occasion=wedding',
    accent: 'bg-yellow-400',
    leftImg: '/images/hero-mehndi.jpg',
    rightImg: '/images/hero-right.jpg',
  },
  {
    title: 'New Year 2027 Collection',
    subtitle: 'A celebration of fresh beginnings, arriving soon in timeless ethnic style',
    bg: 'from-orange-950 via-orange-900 to-amber-900',
    cta: 'View Festive Wear', link: '/products?occasion=festive',
    accent: 'bg-white',
    leftImg: '/images/hero-bride.jpg',
    rightImg: '/images/hero-bride-left.jpg',
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

/* ─── Real Bridal Photo Component (Replaced SVG doll) ───────────────────────── */
function BridalHeroImage({ src, alt = "Shaaz Bridal Collection", size = 260, rounded = "rounded-3xl" }) {
  return (
    <div className={`relative overflow-hidden ${rounded} shadow-2xl border-2 border-brand-gold/40 group`} style={{ width: size, height: size * 1.35 }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
        onError={(e) => {
          e.target.src = '/images/hero-bride.jpg'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 text-center">
        <span className="bg-black/50 backdrop-blur-sm text-brand-gold border border-brand-gold/40 px-3 py-1 rounded-full text-xs font-semibold">
          ✨ Premium Bridal
        </span>
      </div>
    </div>
  )
}

/* ─── floating decoration element ────────────────────────────────────────── */
function FloralGarland({ className = '', count = 9, mirrored = false }) {
  const colors = ['#F8D36B', '#F7A7A7', '#FDE6A8', '#E9B7D1']

  return (
    <div
      className={'absolute pointer-events-none flex items-start gap-0.5 floral-garland ' + className}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => {
        const curve = Math.sin((index / Math.max(count - 1, 1)) * Math.PI) * (mirrored ? -8 : 8)
        const Flower = index % 3 === 0 ? GiLotus : GiFlowerEmblem
        return (
          <span key={index} className="inline-flex" style={{ marginTop: curve }}>
            <Flower
              className="garland-flower"
              style={{
                color: colors[index % colors.length],
                animationDelay: index * 0.32 + 's',
                fontSize: index % 3 === 0 ? 27 : 21,
              }}
            />
          </span>
        )
      })}
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
        if (fRes?.data) {
          dispatch(setFeatured(fRes.data.results || fRes.data))
        }
        if (cRes?.data) {
          dispatch(setCategories(cRes.data))
        }
      } catch (err) {
        console.error('Failed to load featured products from local API:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [dispatch, categories.length])

  const slide = HERO_SLIDES[currentSlide]

  return (
    <div className="bg-brand-cream min-h-screen">

      {/* inject float keyframes once */}
      <style>{`
        @keyframes dressFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes garlandBloom {
          0%, 100% { opacity: 0.18; transform: translateY(2px) scale(0.9); }
          50%      { opacity: 0.78; transform: translateY(-4px) scale(1.04); }
        }
        .dress-float { animation: dressFloat 4s ease-in-out infinite; }
        .dress-float-slow { animation: dressFloat 5.5s ease-in-out 1s infinite; }
        .shimmer-pulse { animation: shimmer 2.5s ease-in-out infinite; }
        .garland-flower { animation: garlandBloom 5.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .dress-float, .dress-float-slow, .shimmer-pulse, .garland-flower { animation: none !important; }
        }
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
        <FloralGarland className="top-5 left-1/2 -translate-x-1/2" count={11} />
        <FloralGarland className="bottom-12 right-0 hidden sm:flex rotate-[-10deg]" count={7} mirrored />
        <FloralGarland className="bottom-20 left-2 hidden lg:flex rotate-[12deg]" count={6} />

        <div className="relative flex items-stretch" style={{ minHeight: 480 }}>

          {/* ── LEFT DRESS / HERO IMAGE ── */}
          <div className="hidden lg:flex flex-col items-center justify-center flex-shrink-0 pl-8 pb-4"
            style={{ width: 240 }}>
            <div className="dress-float">
              <BridalHeroImage
                src={slide.leftImg}
                alt={slide.title}
                size={200}
              />
            </div>
          </div>

          {/* ── CENTER TEXT ── */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
            {/* spinning crown ring */}
            <div className="mb-5 flex items-center justify-center gap-2 text-brand-gold">
              <GiFlowerEmblem className="garland-flower text-2xl" style={{ animationDelay: '0.2s' }} />
              <GiLotus className="garland-flower text-4xl" style={{ animationDelay: '0.5s' }} />
              <GiFlowerEmblem className="garland-flower text-2xl" style={{ animationDelay: '0.8s' }} />
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

          {/* ── RIGHT DRESS / HERO IMAGE ── */}
          <div className="hidden lg:flex flex-col items-center justify-center flex-shrink-0 pr-8 pb-4"
            style={{ width: 240 }}>
            <div className="dress-float-slow">
              <BridalHeroImage
                src={slide.rightImg}
                alt="Shaaz Bridal Wear"
                size={200}
              />
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
            <div className="hidden md:block opacity-90 dress-float flex-shrink-0 -ml-2">
              <img
                src="/images/hero-bride.jpg"
                alt="Bridal Offer"
                className="w-24 h-32 object-cover object-top rounded-2xl border-2 border-brand-gold/60 shadow-xl"
              />
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
            <div className="hidden md:block opacity-90 dress-float-slow flex-shrink-0 -mr-2">
              <img
                src="/images/hero-bride-left.jpg"
                alt="Bridal Offer"
                className="w-24 h-32 object-cover object-top rounded-2xl border-2 border-brand-gold/60 shadow-xl"
              />
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
