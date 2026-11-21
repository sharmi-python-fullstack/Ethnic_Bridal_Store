import axiosInstance from './axios'

export const getProducts = (params = {}) =>
  axiosInstance.get('/api/products/', { params })

export const getProduct = (slug) =>
  axiosInstance.get(`/api/products/${slug}/`)

export const getCategories = () =>
  axiosInstance.get('/api/products/categories/all/')

export const getFeaturedProducts = () =>
  axiosInstance.get('/api/products/featured/')

export const getProductReviews = (productSlug) =>
  axiosInstance.get(`/api/products/${productSlug}/reviews/`)

export const addReview = (productSlug, data) =>
  axiosInstance.post(`/api/products/${productSlug}/reviews/`, data)

export const getWishlist = () =>
  axiosInstance.get('/api/products/wishlist/')

export const toggleWishlist = (productId) =>
  axiosInstance.post(`/api/products/wishlist/${productId}/toggle/`)
