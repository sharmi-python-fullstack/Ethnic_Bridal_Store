import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiTag, FiArrowRight } from 'react-icons/fi'
import { getCart } from '../api/orders'
import { applyCoupon as applyCouponApi } from '../api/coupons'
import { setCart, applyCoupon, removeCoupon } from '../store/slices/cartSlice'
import { getImageUrl, formatPrice, getErrorMessage } from '../utils/helpers'
import { useCart } from '../hooks/useCart'
import toast from 'react-hot-toast'

export default function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, discount, couponCode } = useSelector((s) => s.cart)
  const { updateCartItemQty, removeCartItem } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadCart = useCallback(async () => {
    setPageLoading(true)
    setLoadError('')
    try {
      const response = await getCart()
      dispatch(setCart(response.data))
    } catch (error) {
      setLoadError(getErrorMessage(error) || 'We could not load your cart.')
    } finally {
      setPageLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const getItemPrice = (item) => Number(
    item.unit_price ?? item.product?.effective_price ?? item.product?.discount_price ?? item.product?.price ?? 0
  )
  const getItemImage = (item) => (
    item.product?.primary_image?.image_url || item.product?.images?.[0]?.image_url || item.image_url || ''
  )
  const subtotal = items.reduce((acc, item) => acc + getItemPrice(item) * Number(item.quantity || 0), 0)
  const shipping = subtotal >= 999 ? 0 : (subtotal > 0 ? 99 : 0)
  const grandTotal = subtotal + shipping - (discount || 0)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const res = await applyCouponApi(couponInput.trim(), subtotal)
      dispatch(applyCoupon({ code: res.data.code, discount: res.data.discount_amount }))
      toast.success(res.data.message)
      setCouponInput('')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCouponLoading(false)
    }
  }

  if (pageLoading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full" />
    </div>
  )

  if (loadError) return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-4 px-4 text-center">
      <FiShoppingBag className="text-6xl text-gray-300" />
      <h2 className="font-heading text-2xl font-bold text-gray-700">Your cart could not be loaded</h2>
      <p className="max-w-md text-gray-500">{loadError}</p>
      <button type="button" onClick={loadCart} className="btn-primary">Try again</button>
    </div>
  )

  if (items.length === 0) return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center py-20 px-4 text-center">
      <FiShoppingBag className="text-7xl text-gray-300 mb-5" />
      <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">Your Cart is Empty</h2>
      <p className="text-gray-400 mb-7">Add beautiful ethnic wear to your cart</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-charcoal mb-6">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product || {}
              const productName = item.product_name || product.name || 'Product unavailable'
              const productUrl = product.slug ? `/products/${product.slug}` : '/products'
              const unitPrice = getItemPrice(item)
              const imageUrl = getItemImage(item)
              const stock = product.stock

              return (
              <div key={item.id} className="bg-white rounded-2xl shadow-card p-5 flex gap-4">
                <Link to={productUrl} className="flex-shrink-0">
                  <img
                    src={getImageUrl(imageUrl)}
                    alt={productName}
                    className="w-24 h-32 object-cover rounded-xl"
                    onError={(e) => { e.target.src = '/placeholder-bridal.svg' }}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={productUrl}>
                    <h3 className="font-heading font-semibold text-brand-charcoal leading-tight hover:text-brand-red transition-colors line-clamp-2">
                      {productName}
                    </h3>
                  </Link>
                  {(item.size || item.color) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.size && `Size: ${item.size}`}{item.size && item.color && ' | '}{item.color && `Color: ${item.color}`}
                    </p>
                  )}
                  <p className="text-brand-deep-red font-bold mt-2">{formatPrice(unitPrice)}</p>
                  {/* Stock warning */}
                  {stock != null && stock <= 5 && stock > 0 && (
                    <p className="text-xs text-orange-500 font-medium mt-1">⚠ Only {item.product.stock} left in stock</p>
                  )}
                  {stock === 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1">❌ Out of stock — please remove</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="px-4 py-1.5 font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                        disabled={stock != null && item.quantity >= stock}
                        className="px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-charcoal">{formatPrice(unitPrice * item.quantity)}</span>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-brand-charcoal mb-3 flex items-center gap-2">
                <FiTag className="text-brand-gold" /> Apply Coupon
              </h3>
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-green-700 text-sm font-semibold">{couponCode} applied!</span>
                  <button onClick={() => dispatch(removeCoupon())} className="text-red-400 text-xs hover:text-red-600">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="input-field text-sm flex-1"
                    placeholder="BRIDAL10"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="bg-brand-gold text-brand-charcoal px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-all"
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-heading font-bold text-brand-charcoal mb-4 text-lg">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">Add {formatPrice(999 - subtotal)} more for free shipping</p>
                )}
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-brand-charcoal text-base">
                  <span>Total</span>
                  <span className="text-brand-deep-red">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2 text-base"
              >
                Proceed to Checkout <FiArrowRight />
              </button>
              <Link to="/products" className="block text-center text-sm text-brand-red mt-3 hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
