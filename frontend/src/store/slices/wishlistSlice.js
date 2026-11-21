import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  isLoading: false,
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload
      state.isLoading = false
    },
    addToWishlist: (state, action) => {
      const exists = state.items.find(i => i.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload)
    },
    setWishlistLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
})

export const { setWishlist, addToWishlist, removeFromWishlist, setWishlistLoading } = wishlistSlice.actions
export default wishlistSlice.reducer
