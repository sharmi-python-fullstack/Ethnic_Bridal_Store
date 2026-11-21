import axiosInstance from './axios'

export const createRazorpayOrder = (data) =>
  axiosInstance.post('/api/payments/create-order/', data)

export const verifyPayment = (data) =>
  axiosInstance.post('/api/payments/verify/', data)
