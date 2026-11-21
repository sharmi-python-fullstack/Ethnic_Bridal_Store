import { useSelector, useDispatch } from 'react-redux'
import { setCart, addItem, updateItem, removeItem, clearCart as clearCartAction } from '../store/slices/cartSlice'
import { addToCart, updateCartItem, removeFromCart, clearCart as clearCartApi } from '../api/orders'
import toast from 'react-hot-toast'

export const useCart = () => {
  const dispatch = useDispatch()
  const { items, total, itemCount, discount, couponCode, isLoading } = useSelector((state) => state.cart)

  const addItemToCart = async (productId, quantity = 1, size = '', color = '') => {
    try {
      const response = await addToCart({ product_id: productId, quantity, size, color })
      if (response.data.cart) dispatch(setCart(response.data.cart))
      toast.success('Added to cart!')
      return true
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.detail || 'Failed to add to cart')
      return false
    }
  }

  const updateCartItemQty = async (itemId, quantity) => {
    try {
      const response = await updateCartItem(itemId, { quantity })
      if (response.data.cart) dispatch(setCart(response.data.cart))
      return true
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update cart')
      return false
    }
  }

  const removeCartItem = async (itemId) => {
    try {
      const response = await removeFromCart(itemId)
      if (response.data.cart) dispatch(setCart(response.data.cart))
      toast.success('Item removed from cart')
      return true
    } catch (error) {
      toast.error('Failed to remove item')
      return false
    }
  }

  const emptyCart = async () => {
    try {
      await clearCartApi()
      dispatch(clearCartAction())
      return true
    } catch (error) {
      toast.error('Failed to clear cart')
      return false
    }
  }

  const subtotal = items.reduce((acc, item) => {
    const price = parseFloat(item.product?.discounted_price || item.product?.price || 0)
    return acc + price * item.quantity
  }, 0)

  const shipping = subtotal >= 999 ? 0 : 99
  const grandTotal = subtotal + shipping - (discount || 0)

  return {
    items,
    total,
    itemCount,
    discount,
    couponCode,
    isLoading,
    subtotal,
    shipping,
    grandTotal,
    addItemToCart,
    updateCartItemQty,
    removeCartItem,
    emptyCart,
  }
}

export default useCart
