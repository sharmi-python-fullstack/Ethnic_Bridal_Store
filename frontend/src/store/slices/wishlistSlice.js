import { createSlice } from '@reduxjs/toolkit'

// Load initial wishlist from localStorage
const storedWishlist = (() => {
  try {
    const saved = localStorage.getItem('wishlist')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
})()

const initialState = {
  items: Array.isArray(storedWishlist) ? storedWishlist : [],
  isLoading: false,
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : []
      state.isLoading = false
      try {
        localStorage.setItem('wishlist', JSON.stringify(state.items))
      } catch {}
    },
    addToWishlist: (state, action) => {
      const prod = action.payload.product || action.payload
      const prodId = prod.id
      const exists = state.items.some(i => (i.product?.id || i.id) === prodId)
      if (!exists) {
        state.items.push(action.payload)
        try {
          localStorage.setItem('wishlist', JSON.stringify(state.items))
        } catch {}
      }
    },
    removeFromWishlist: (state, action) => {
      const prodId = action.payload
      state.items = state.items.filter(i => (i.product?.id || i.id) !== prodId)
      try {
        localStorage.setItem('wishlist', JSON.stringify(state.items))
      } catch {}
    },
    toggleWishlistAction: (state, action) => {
      const prod = action.payload.product || action.payload
      const prodId = prod.id
      const index = state.items.findIndex(i => (i.product?.id || i.id) === prodId)
      if (index >= 0) {
        state.items.splice(index, 1)
      } else {
        state.items.push(action.payload)
      }
      try {
        localStorage.setItem('wishlist', JSON.stringify(state.items))
      } catch {}
    },
    setWishlistLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
})

export const { setWishlist, addToWishlist, removeFromWishlist, toggleWishlistAction, setWishlistLoading } = wishlistSlice.actions
export default wishlistSlice.reducer
