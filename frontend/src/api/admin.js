import axiosInstance from './axios'

// Dashboard
export const getDashboardStats = () =>
  axiosInstance.get('/api/admin/dashboard/')

// Products
export const getAdminProducts = (params = {}) =>
  axiosInstance.get('/api/admin/products/', { params })

export const createProduct = (data) =>
  axiosInstance.post('/api/admin/products/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateProduct = (id, data) =>
  axiosInstance.patch(`/api/admin/products/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteProduct = (id) =>
  axiosInstance.delete(`/api/admin/products/${id}/`)

// Categories
export const getAdminCategories = () =>
  axiosInstance.get('/api/admin/categories/')

export const createCategory = (data) =>
  axiosInstance.post('/api/admin/categories/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateCategory = (id, data) =>
  axiosInstance.patch(`/api/admin/categories/${id}/`, data)

export const deleteCategory = (id) =>
  axiosInstance.delete(`/api/admin/categories/${id}/`)

// Orders
export const getAdminOrders = (params = {}) =>
  axiosInstance.get('/api/admin/orders/', { params })

export const updateOrderStatus = (orderId, status) =>
  axiosInstance.patch(`/api/admin/orders/${orderId}/`, { status })

export const createOrderTracking = (orderId, data) =>
  axiosInstance.post(`/api/admin/orders/${orderId}/tracking/`, data)

export const updateOrderTracking = (orderId, trackingId, data) =>
  axiosInstance.patch(`/api/admin/orders/${orderId}/tracking/${trackingId}/`, data)

export const deleteOrderTracking = (orderId, trackingId) =>
  axiosInstance.delete(`/api/admin/orders/${orderId}/tracking/${trackingId}/`)

// Users
export const getAdminUsers = (params = {}) =>
  axiosInstance.get('/api/admin/users/', { params })

export const updateUserStatus = (userId, is_active) =>
  axiosInstance.patch(`/api/admin/users/${userId}/`, { is_active })

// Coupons
export const getCoupons = () =>
  axiosInstance.get('/api/admin/coupons/')

export const createCoupon = (data) =>
  axiosInstance.post('/api/admin/coupons/', data)

export const updateCoupon = (id, data) =>
  axiosInstance.patch(`/api/admin/coupons/${id}/`, data)

export const deleteCoupon = (id) =>
  axiosInstance.delete(`/api/admin/coupons/${id}/`)
