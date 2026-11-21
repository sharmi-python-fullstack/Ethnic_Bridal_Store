import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import { getWishlist, toggleWishlist } from '../api/products'
import { setWishlist, removeFromWishlist } from '../store/slices/wishlistSlice'
import { getImageUrl, formatPrice } from '../utils/helpers'
import { useCart } from '../hooks/useCart'
import toast from 'react-hot-toast'

export default function Wishlist() {
  const dispatch = useDispatch()
  const { items } = useSelector((s) => s.wishlist)
  const { addItemToCart } = useCart()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWishlist()
      .then((r) => dispatch(setWishlist(r.data.results || r.data)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dispatch])

  const handleRemove = async (productId) => {
    try {
      await toggleWishlist(productId)
      dispatch(removeFromWishlist(productId))
      toast.success('Removed from wishlist')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const handleAddToCart = async (product) => {
    await addItemToCart(product.id, 1)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" />
    </div>
  )

  if (items.length === 0) return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center py-20 text-center px-4">
      <FiHeart className="text-7xl text-gray-300 mb-5" />
      <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">Your Wishlist is Empty</h2>
      <p className="text-gray-400 mb-7">Save your favourite items to come back later</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-charcoal mb-6">My Wishlist ({items.length})</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => {
            const p = item.product
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-card overflow-hidden group">
                <div className="relative">
                  <Link to={`/products/${p.slug}`}>
                    <img
                      src={getImageUrl(p.primary_image?.image_url)}
                      alt={p.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300/FFF8F0/9B1313?text=SE' }}
                    />
                  </Link>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 className="text-red-400" size={15} />
                  </button>
                </div>
                <div className="p-4">
                  <Link to={`/products/${p.slug}`}>
                    <h3 className="font-heading font-semibold text-sm text-brand-charcoal hover:text-brand-red transition-colors line-clamp-2 mb-2">{p.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-brand-deep-red font-bold">{formatPrice(p.effective_price)}</span>
                    {p.discount_price && <span className="text-gray-400 line-through text-xs">{formatPrice(p.price)}</span>}
                  </div>
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={!p.in_stock}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-1.5 py-2.5"
                  >
                    <FiShoppingCart size={14} />
                    {p.in_stock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
