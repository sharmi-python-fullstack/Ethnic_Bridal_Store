// Base URL of the Django API. In development (VITE_API_URL not set) it's
// empty so Vite's proxy handles /api and /media automatically.
// In production (Render), VITE_API_BASE = https://your-backend.onrender.com
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
export const API_BASE = rawApiUrl

// Format price to Indian Rupee format
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '₹0'
  const num = parseFloat(price)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// Format date to readable format
export const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

// Format date with time
export const formatDateTime = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Get status color class (Tailwind)
export const getStatusColor = (status) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
    SHIPPED: 'bg-orange-100 text-orange-800 border-orange-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Get status dot color
export const getStatusDotColor = (status) => {
  const colors = {
    PENDING: 'bg-yellow-500',
    CONFIRMED: 'bg-blue-500',
    PROCESSING: 'bg-purple-500',
    SHIPPED: 'bg-orange-500',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
  }
  return colors[status] || 'bg-gray-500'
}

// Calculate discount percentage
export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice) return 0
  const original = parseFloat(originalPrice)
  const discounted = parseFloat(discountedPrice)
  if (original <= discounted) return 0
  return Math.round(((original - discounted) / original) * 100)
}

// Get image URL - handles absolute URLs, media paths, and falls back to SVG placeholder
export const getImageUrl = (image) => {
  if (!image) return '/placeholder-bridal.svg'
  // Already an absolute URL (served from backend in production)
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  // Relative media path like /media/products/xxx.jpg or media/products/xxx.jpg
  // In dev this goes via Vite proxy → localhost:8000; in prod API_BASE is set
  if (image.startsWith('/media/')) return `${API_BASE}${image}`
  if (image.startsWith('media/')) return `${API_BASE}/${image}`
  // Plain filename
  return `${API_BASE}/media/${image}`
}

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Extract error message from API response
export const getErrorMessage = (error) => {
  if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    if (data.message) return data.message
    if (data.error) return data.error
    // Check for field errors
    const firstKey = Object.keys(data)[0]
    if (firstKey && Array.isArray(data[firstKey])) {
      return `${firstKey}: ${data[firstKey][0]}`
    }
  }
  return error?.message || 'Something went wrong. Please try again.'
}

// Format order status label
export const formatStatus = (status) => {
  const labels = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }
  return labels[status] || status
}
