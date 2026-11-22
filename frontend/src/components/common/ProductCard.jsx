import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiHeart, FiShoppingCart, FiStar, FiEye } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import { formatPrice, getImageUrl } from '../../utils/helpers'
import { toggleWishlist } from '../../api/products'
import { toggleWishlistAction } from '../../store/slices/wishlistSlice'
import { useCart } from '../../hooks/useCart'
import toast from 'react-hot-toast'

const ProductCard = ({ product, onWishlistToggle }) => {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const { items: wishlistItems } = useSelector((state) => state.wishlist)
  const isItemInWishlist = wishlistItems.some((i) => (i.product?.id || i.id) === product.id)
  const [inWishlist, setInWishlist] = useState(isItemInWishlist || product.in_wishlist || false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const { addItemToCart } = useCart()

  // Keep heart state synced with Redux store
  useEffect(() => {
    setInWishlist(isItemInWishlist)
  }, [isItemInWishlist])

  const primaryImage = product.primary_image?.image_url
  const imgSrc = getImageUrl(primaryImage)

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlistLoading(true)

    // Instantly update Redux and localStorage
    dispatch(toggleWishlistAction({ id: product.id, product }))
    const nextState = !inWishlist
    setInWishlist(nextState)

    if (nextState) {
      toast.success(`"${product.name}" added to wishlist! ❤️`)
    } else {
      toast.success(`"${product.name}" removed from wishlist.`)
    }

    if (onWishlistToggle) {
      onWishlistToggle(product.id, nextState)
    }

    // Sync with backend if logged in
    if (token) {
      try {
        const res = await toggleWishlist(product.id)
        if (res.data?.in_wishlist !== undefined) {
          setInWishlist(res.data.in_wishlist)
        }
      } catch (err) {
        console.warn('Backend wishlist sync notice:', err)
      }
    }
    setWishlistLoading(false)
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token) { toast.error('Please login to add to cart'); return }
    setCartLoading(true)
    try {
      await addItemToCart(product.id, 1)
    } finally {
      setCartLoading(false)
    }
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.discount_percentage > 0 && (
          <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{product.discount_percentage}%
          </span>
        )}
        {product.is_featured && (
          <span className="bg-brand-gold text-brand-charcoal text-xs font-bold px-2.5 py-1 rounded-full">
            ✨ Featured
          </span>
        )}
        {!product.in_stock && (
          <span className="bg-gray-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Out of Stock
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        disabled={wishlistLoading}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition-all duration-200"
      >
        {inWishlist
          ? <FaHeart className="text-brand-red text-base" />
          : <FiHeart className="text-gray-500 text-base" />
        }
      </button>

      {/* Product Image */}
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden h-64 bg-gray-50">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = '/placeholder-bridal.svg' }}
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <Link
              to={`/products/${product.slug}`}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-brand-gold transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FiEye className="text-brand-charcoal text-lg" />
            </Link>
            {product.in_stock && (
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-brand-gold transition-colors"
              >
                <FiShoppingCart className="text-brand-charcoal text-lg" />
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-brand-gold font-medium">{product.category_name}</span>
          {product.occasion && (
            <>
              <span className="text-gray-300 text-xs">•</span>
              <span className="text-xs text-gray-500 capitalize">{product.occasion}</span>
            </>
          )}
        </div>

        <Link to={`/products/${product.slug}`}>
          <h3 className="font-heading text-brand-charcoal font-semibold text-sm leading-tight mb-2 line-clamp-2 hover:text-brand-red transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <FiStar className="text-brand-gold text-xs fill-brand-gold" />
            <span className="text-xs font-semibold text-brand-charcoal">{product.average_rating}</span>
            <span className="text-xs text-gray-400">({product.review_count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-brand-deep-red font-bold text-lg">
            {formatPrice(product.effective_price)}
          </span>
          {product.discount_price && (
            <span className="text-gray-400 line-through text-sm">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!product.in_stock || cartLoading}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            ${product.in_stock
              ? 'bg-brand-deep-red text-white hover:bg-red-800 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          <FiShoppingCart size={15} />
          {cartLoading ? 'Adding...' : product.in_stock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  )
}

export default ProductCard
