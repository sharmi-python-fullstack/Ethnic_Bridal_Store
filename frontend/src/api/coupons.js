import axiosInstance from './axios'

export const applyCoupon = (code, orderAmount) =>
  axiosInstance.post('/api/coupons/apply/', { code, order_amount: orderAmount })
