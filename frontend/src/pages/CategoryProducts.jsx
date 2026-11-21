import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiArrowLeft } from 'react-icons/fi'
import { getProducts, getCategories } from '../api/products'
import { setProducts, setCategories } from '../store/slices/productSlice'
import ProductCard from '../components/common/ProductCard'

export default function CategoryProducts() {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const { products, categories, isLoading } = useSelector((s) => s.products)
  const [currentCat, setCurrentCat] = useState(null)

  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then((r) => dispatch(setCategories(r.data))).catch(() => {})
    }
  }, [dispatch, categories.length])

  useEffect(() => {
    if (categories.length > 0) {
      const cat = categories.find((c) => c.slug === slug)
      setCurrentCat(cat)
    }
  }, [categories, slug])

  useEffect(() => {
    getProducts({ category: slug })
      .then((r) => dispatch(setProducts(r.data)))
      .catch(() => {})
  }, [slug, dispatch])

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-brand-red">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand-red">Products</Link>
          <span>/</span>
          <span className="text-brand-charcoal font-medium">{currentCat?.name || slug}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-brand-red text-sm font-medium hover:underline mb-3">
            <FiArrowLeft /> All Products
          </Link>
          <h1 className="font-heading text-3xl font-bold text-brand-charcoal">{currentCat?.name || slug}</h1>
          {currentCat?.description && <p className="text-gray-500 mt-1">{currentCat.description}</p>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card">
                <div className="skeleton h-64" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">👗</div>
            <h3 className="font-heading text-xl font-bold text-gray-700 mb-2">No products in this category</h3>
            <Link to="/products" className="btn-primary inline-block mt-4">Browse All Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
