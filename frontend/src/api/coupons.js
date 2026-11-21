import axiosInstance from './axios'

export const getActiveCoupons = () =>
  axiosInstance.get('/api/coupons/active/')

export const applyCoupon = (code, orderAmount) =>
  axiosInstance.post('/api/coupons/apply/', { code, order_amount: orderAmount })
