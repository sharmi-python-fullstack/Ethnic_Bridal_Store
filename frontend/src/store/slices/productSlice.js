import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  products: [],
  categories: [],
  featured: [],
  filters: {
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    colors: [],
    occasions: [],
    inStock: false,
    sort: '-created_at',
  },
  pagination: {
    page: 1,
    totalPages: 1,
    count: 0,
  },
  isLoading: false,
}

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload.results || action.payload
      state.pagination = {
        page: action.payload.page || 1,
        totalPages: action.payload.total_pages || 1,
        count: action.payload.count || 0,
      }
      state.isLoading = false
    },
    setCategories: (state, action) => {
      state.categories = action.payload
    },
    setFeatured: (state, action) => {
      state.featured = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    setProductLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
})

export const { setProducts, setCategories, setFeatured, setFilters, resetFilters, setProductLoading } = productSlice.actions
export default productSlice.reducer
