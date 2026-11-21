import axiosInstance from './axios'

export const registerApi = (data) =>
  axiosInstance.post('/api/auth/register/', data)

export const loginApi = (data) =>
  axiosInstance.post('/api/auth/login/', data)

export const logoutApi = (refreshToken) =>
  axiosInstance.post('/api/auth/logout/', { refresh: refreshToken })

export const getProfile = () =>
  axiosInstance.get('/api/auth/profile/')

export const updateProfile = (data) =>
  axiosInstance.patch('/api/auth/profile/', data)

export const changePassword = (data) =>
  axiosInstance.post('/api/auth/change-password/', data)

export const forgotPasswordApi = (data) =>
  axiosInstance.post('/api/auth/forgot-password/', data)

export const resetPasswordApi = (data) =>
  axiosInstance.post('/api/auth/reset-password/', data)

export const getAddresses = () =>
  axiosInstance.get('/api/auth/addresses/')

export const addAddress = (data) =>
  axiosInstance.post('/api/auth/addresses/', data)

export const updateAddress = (id, data) =>
  axiosInstance.patch(`/api/auth/addresses/${id}/`, data)

export const deleteAddress = (id) =>
  axiosInstance.delete(`/api/auth/addresses/${id}/`)

export const setDefaultAddress = (id) =>
  axiosInstance.post(`/api/auth/addresses/${id}/set-default/`)

// legacy aliases
export const register = registerApi
export const login = loginApi
export const logout = logoutApi
export const forgotPassword = (data) => forgotPasswordApi(data)
export const resetPassword = (data) => resetPasswordApi(data)
