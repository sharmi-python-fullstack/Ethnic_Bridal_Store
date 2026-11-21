import axiosInstance from './axios'

// Cart APIs
export const getCart = () =>
  axiosInstance.get('/api/orders/cart/')

export const addToCart = (data) =>
  axiosInstance.post('/api/orders/cart/add/', data)

export const updateCartItem = (itemId, data) =>
  axiosInstance.patch(`/api/orders/cart/items/${itemId}/`, data)

export const removeFromCart = (itemId) =>
  axiosInstance.delete(`/api/orders/cart/items/${itemId}/`)

export const clearCart = () =>
  axiosInstance.delete('/api/orders/cart/')

// Orders APIs
export const getOrders = () =>
  axiosInstance.get('/api/orders/')

export const getOrderDetail = (orderId) =>
  axiosInstance.get(`/api/orders/${orderId}/`)

export const createOrder = (data) =>
  axiosInstance.post('/api/orders/create/', data)

export const cancelOrder = (orderId) =>
  axiosInstance.post(`/api/orders/${orderId}/cancel/`)
