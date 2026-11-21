import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  discount: 0,
  couponCode: null,
  isLoading: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action) => {
      const data = action.payload
      state.items = data.items || []
      state.total = data.total_price || data.total || 0
      state.itemCount = data.total_items != null ? data.total_items : state.items.reduce((acc, item) => acc + item.quantity, 0)
      state.isLoading = false
    },
    addItem: (state, action) => {
      const existing = state.items.find(i => i.id === action.payload.id)
      if (existing) {
        existing.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
      state.itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0)
    },
    updateItem: (state, action) => {
      const item = state.items.find(i => i.id === action.payload.id)
      if (item) {
        item.quantity = action.payload.quantity
      }
      state.itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0)
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload)
      state.itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0)
    },
    clearCart: (state) => {
      state.items = []
      state.total = 0
      state.itemCount = 0
      state.discount = 0
      state.couponCode = null
    },
    applyCoupon: (state, action) => {
      state.discount = action.payload.discount
      state.couponCode = action.payload.code
    },
    removeCoupon: (state) => {
      state.discount = 0
      state.couponCode = null
    },
    setCartLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
})

export const { setCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, setCartLoading } = cartSlice.actions
export default cartSlice.reducer
