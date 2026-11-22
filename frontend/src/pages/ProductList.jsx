import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiFilter, FiX, FiGrid, FiList, FiChevronDown } from 'react-icons/fi'
import { getProducts, getCategories } from '../api/products'
import { setProducts, setCategories, setProductLoading } from '../store/slices/productSlice'
import ProductCard from '../components/common/ProductCard'
import { useDebounce } from '../hooks/useDebounce'
import { useCart } from '../hooks/useCart'
import { formatPrice, getImageUrl } from '../utils/helpers'
import toast from 'react-hot-toast'

const COLORS = ['red','pink','blue','green','yellow','orange','purple','gold','maroon','white','black','multicolor']
const OCCASIONS = ['bridal','wedding','festive','party','casual','office']
const SORT_OPTIONS = [
  { label: 'Newest First', value: '-created_at' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Name A-Z', value: 'name' },
  { label: 'Top Rated', value: '-average_rating' },
]

/**
 * Filter panel defined OUTSIDE ProductList so its component identity
 * remains constant across re-renders, preventing input focus loss when typing.
 */
function FilterPanel({ filters, updateFilter, clearFilters, categories, setFilters }) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
        <div className="relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            placeholder="Search products…"
            className="input-field text-sm pr-8"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, search: '', page: 1 }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
        <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="input-field text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {/* Occasion */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Occasion</label>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => updateFilter('occasion', filters.occasion === o ? '' : o)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filters.occasion === o
                  ? 'bg-brand-deep-red text-white border-brand-deep-red'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-deep-red'
              }`}
            >
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range (₹)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => updateFilter('min_price', e.target.value)}
            placeholder="Min ₹"
            className="input-field text-sm w-1/2"
          />
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            placeholder="Max ₹"
            className="input-field text-sm w-1/2"
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateFilter('color', filters.color === c ? '' : c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                filters.color === c
                  ? 'bg-brand-deep-red text-white border-brand-deep-red'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-deep-red'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={filters.in_stock} onChange={(e) => updateFilter('in_stock', e.target.checked)} className="accent-brand-deep-red w-4 h-4" />
        <span className="text-sm font-medium text-gray-700">In Stock Only</span>
      </label>

      {/* Clear */}
      <button
        type="button"
        onClick={clearFilters}
        className="w-full py-2.5 border-2 border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:border-brand-deep-red hover:text-brand-deep-red transition-all"
      >
        Clear All Filters
      </button>
    </div>
  )
}

export default function ProductList() {
  const dispatch = useDispatch()
  const { products, pagination, isLoading, categories } = useSelector((s) => s.products)
  const { token } = useSelector((s) => s.auth)
  const { addItemToCart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [gridView, setGridView] = useState(true)
  const [bundleAdding, setBundleAdding] = useState(false)
  const [bundleChecked, setBundleChecked] = useState({})
  const [fetchError, setFetchError] = useState('')
  const requestSequence = useRef(0)

  // Initialize bundleChecked whenever products change
  useEffect(() => {
    if (products?.length >= 2) {
      const initial = {}
      products.slice(0, 3).forEach((p) => {
        initial[p.id] = true
      })
      setBundleChecked(initial)
    }
  }, [products])

  const bundleItems = products?.slice(0, 3) || []
  const activeBundleItems = bundleItems.filter((p) => bundleChecked[p.id])
  const bundleTotal = activeBundleItems.reduce(
    (acc, p) => acc + parseFloat(p.effective_price || p.price || 0),
    0
  )

  const handleAddBundleToCart = async () => {
    if (activeBundleItems.length === 0) {
      toast.error('Please select at least one item from the bundle')
      return
    }
    setBundleAdding(true)
    let addedCount = 0
    for (const item of activeBundleItems) {
      const success = await addItemToCart(
        item.id,
        1,
        item.sizes?.[0] || '',
        item.colors?.[0] || ''
      )
      if (success) addedCount++
    }
    setBundleAdding(false)
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} bundle item${addedCount > 1 ? 's' : ''} to cart!`)
    }
  }

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    occasion: searchParams.get('occasion') || '',
    color: searchParams.get('color') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    in_stock: searchParams.get('in_stock') === 'true',
    is_featured: searchParams.get('is_featured') === 'true',
    has_discount: searchParams.get('has_discount') === 'true',
    ordering: searchParams.get('ordering') || '-created_at',
    page: parseInt(searchParams.get('page') || '1', 10),
  })

  // Keep filters in sync when URL changes (e.g., from top Navbar search or category links)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    const urlCategory = searchParams.get('category') || ''
    const urlOccasion = searchParams.get('occasion') || ''
    const urlColor = searchParams.get('color') || ''
    const urlMinPrice = searchParams.get('min_price') || ''
    const urlMaxPrice = searchParams.get('max_price') || ''
    const urlInStock = searchParams.get('in_stock') === 'true'
    const urlFeatured = searchParams.get('is_featured') === 'true'
    const urlDiscount = searchParams.get('has_discount') === 'true'
    const urlOrdering = searchParams.get('ordering') || '-created_at'
    const urlPage = parseInt(searchParams.get('page') || '1', 10)

    setFilters((prev) => {
      if (
        prev.search === urlSearch &&
        prev.category === urlCategory &&
        prev.occasion === urlOccasion &&
        prev.color === urlColor &&
        prev.min_price === urlMinPrice &&
        prev.max_price === urlMaxPrice &&
        prev.in_stock === urlInStock &&
        prev.is_featured === urlFeatured &&
        prev.has_discount === urlDiscount &&
        prev.ordering === urlOrdering &&
        prev.page === urlPage
      ) {
        return prev
      }
      return {
        search: urlSearch,
        category: urlCategory,
        occasion: urlOccasion,
        color: urlColor,
        min_price: urlMinPrice,
        max_price: urlMaxPrice,
        in_stock: urlInStock,
        is_featured: urlFeatured,
        has_discount: urlDiscount,
        ordering: urlOrdering,
        page: urlPage,
      }
    })
  }, [searchParams])

  const debouncedSearch = useDebounce(filters.search, 400)

  const fetchProducts = useCallback(async (f) => {
    const requestId = ++requestSequence.current
    const params = {}
    if (f.search) params.search = f.search
    if (f.category) params.category = f.category
    if (f.occasion) params.occasion = f.occasion
    if (f.color) params.color = f.color
    if (f.min_price) params.min_price = f.min_price
    if (f.max_price) params.max_price = f.max_price
    if (f.in_stock) params.in_stock = 'true'
    if (f.is_featured) params.is_featured = 'true'
    if (f.has_discount) params.has_discount = 'true'
    params.ordering = f.ordering
    params.page = f.page

    dispatch(setProductLoading(true))
    setFetchError('')
    try {
      const res = await getProducts(params)
      if (requestId === requestSequence.current) {
        dispatch(setProducts(res.data))
      }
    } catch {
      if (requestId === requestSequence.current) {
        dispatch(setProducts({ results: [], count: 0, page: f.page || 1, total_pages: 1 }))
        setFetchError('Search is temporarily unavailable. Please make sure the backend server is running, then try again.')
      }
    }
  }, [dispatch])

  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then((r) => dispatch(setCategories(r.data))).catch(() => {})
    }
  }, [dispatch, categories.length])

  useEffect(() => {
    fetchProducts({ ...filters, search: debouncedSearch })
    // Sync URL without wiping out other search params
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filters.category) params.set('category', filters.category)
    if (filters.occasion) params.set('occasion', filters.occasion)
    if (filters.color) params.set('color', filters.color)
    if (filters.min_price) params.set('min_price', filters.min_price)
    if (filters.max_price) params.set('max_price', filters.max_price)
    if (filters.in_stock) params.set('in_stock', 'true')
    if (filters.is_featured) params.set('is_featured', 'true')
    if (filters.has_discount) params.set('has_discount', 'true')
    params.set('ordering', filters.ordering)
    if (filters.page > 1) params.set('page', String(filters.page))
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [debouncedSearch, filters.category, filters.occasion, filters.color, filters.min_price, filters.max_price, filters.in_stock, filters.is_featured, filters.has_discount, filters.ordering, filters.page, fetchProducts, setSearchParams])

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }))
  const clearFilters = () => setFilters({ search: '', category: '', occasion: '', color: '', min_price: '', max_price: '', in_stock: false, is_featured: false, has_discount: false, ordering: '-created_at', page: 1 })

  const activeFilterCount = [filters.search, filters.category, filters.occasion, filters.color, filters.min_price, filters.in_stock].filter(Boolean).length
  const productStatus = fetchError
    ? fetchError
    : pagination.count > 0
      ? String(pagination.count) + ' product' + (pagination.count === 1 ? '' : 's') + ' found' + (filters.search ? ' for "' + filters.search + '"' : '')
      : isLoading
        ? 'Searching products…'
        : filters.search
          ? 'No products found for "' + filters.search + '"'
          : 'No products found'

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-charcoal">All Products</h1>
            <p className={'text-sm mt-1 ' + (fetchError ? 'text-red-600' : 'text-gray-500')} role="status" aria-live="polite">
              {productStatus}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              value={filters.ordering}
              onChange={(e) => updateFilter('ordering', e.target.value)}
              className="input-field text-sm w-auto"
            >
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {/* Grid/List */}
            <div className="hidden sm:flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
              <button onClick={() => setGridView(true)} className={`p-1.5 rounded ${gridView ? 'bg-brand-deep-red text-white' : 'text-gray-500'}`}><FiGrid /></button>
              <button onClick={() => setGridView(false)} className={`p-1.5 rounded ${!gridView ? 'bg-brand-deep-red text-white' : 'text-gray-500'}`}><FiList /></button>
            </div>
            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 bg-brand-deep-red text-white px-4 py-2 rounded-lg text-sm font-medium relative"
            >
              <FiFilter /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-gold text-brand-charcoal text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-brand-charcoal text-lg">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-brand-red flex items-center gap-1">
                    <FiX size={12} /> Clear
                  </button>
                )}
              </div>
              <FilterPanel
                filters={filters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
                categories={categories}
                setFilters={setFilters}
              />
            </div>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="relative ml-auto w-80 bg-white h-full overflow-y-auto p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-bold text-xl">Filters</h3>
                  <button onClick={() => setSidebarOpen(false)}><FiX size={22} /></button>
                </div>
                <FilterPanel
                filters={filters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
                categories={categories}
                setFilters={setFilters}
              />
                <button onClick={() => setSidebarOpen(false)} className="btn-primary w-full mt-4">Apply Filters</button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className={`grid gap-5 ${gridView ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {Array(9).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-card">
                    <div className="skeleton h-64" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">👗</div>
                <h3 className="font-heading text-xl font-bold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your filters or search term</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className={`grid gap-5 ${gridView ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Frequently Bought Together Bundle */}
                {bundleItems.length >= 2 && (
                  <div className="mt-12 bg-white rounded-3xl shadow-card p-6 md:p-8 border border-brand-gold/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✨</span>
                      <div>
                        <h3 className="font-heading text-xl md:text-2xl font-bold text-brand-charcoal">
                          Frequently Bought Together
                        </h3>
                        <p className="text-gray-500 text-xs sm:text-sm">
                          {filters.search
                            ? `Curated matching sets for your search "${filters.search}"`
                            : 'Handpicked bridal ensembles and matching accessory sets'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-6 mt-6">
                      {/* Products list with plus signs */}
                      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 flex-1">
                        {bundleItems.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-3 sm:gap-4">
                            {idx > 0 && (
                              <span className="text-xl sm:text-2xl font-bold text-brand-gold select-none">+</span>
                            )}
                            <div
                              onClick={() => setBundleChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className={`w-32 sm:w-40 rounded-2xl p-2.5 sm:p-3 border cursor-pointer transition-all text-center flex-shrink-0 ${
                                bundleChecked[item.id]
                                  ? 'border-brand-gold bg-amber-50/70 shadow-sm'
                                  : 'border-gray-200 bg-gray-50 opacity-50'
                              }`}
                            >
                              <div className="w-24 sm:w-32 h-32 sm:h-40 mx-auto rounded-xl overflow-hidden mb-2 shadow-sm relative">
                                <img
                                  src={item.primary_image?.image_url ? getImageUrl(item.primary_image.image_url) : '/placeholder-bridal.svg'}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1.5 left-1.5 bg-white/90 rounded p-0.5">
                                  <input
                                    type="checkbox"
                                    checked={!!bundleChecked[item.id]}
                                    onChange={() => {}}
                                    className="w-4 h-4 accent-brand-deep-red rounded cursor-pointer"
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">
                                {item.category_name}
                              </span>
                              <p className="text-xs font-semibold text-brand-charcoal line-clamp-1">{item.name}</p>
                              <p className="text-xs font-bold text-brand-deep-red mt-1">{formatPrice(item.effective_price || item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action / Buy bundle */}
                      <div className="w-full lg:w-64 bg-gradient-to-br from-brand-cream to-amber-50 p-5 rounded-2xl border border-brand-gold/40 flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Bundle Price ({activeBundleItems.length} items)
                        </span>
                        <span className="font-heading text-2xl sm:text-3xl font-bold text-brand-deep-red my-1.5">
                          {formatPrice(bundleTotal)}
                        </span>
                        <p className="text-[11px] text-green-700 font-semibold mb-3">
                          ✨ Handpicked Bridal Match
                        </p>
                        <button
                          type="button"
                          onClick={handleAddBundleToCart}
                          disabled={bundleAdding || activeBundleItems.length === 0}
                          className="w-full bg-brand-deep-red hover:bg-red-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                        >
                          {bundleAdding ? 'Adding Items…' : `Add ${activeBundleItems.length} Items to Cart`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => updateFilter('page', filters.page - 1)}
                      disabled={filters.page === 1}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-brand-deep-red hover:text-brand-deep-red transition-all"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - filters.page) <= 2)
                      .map((p, idx, arr) => (
                        <span key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 text-gray-400">…</span>}
                          <button
                            onClick={() => updateFilter('page', p)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                              p === filters.page
                                ? 'bg-brand-deep-red text-white'
                                : 'border border-gray-200 hover:border-brand-deep-red hover:text-brand-deep-red'
                            }`}
                          >
                            {p}
                          </button>
                        </span>
                      ))
                    }
                    <button
                      onClick={() => updateFilter('page', filters.page + 1)}
                      disabled={filters.page === pagination.totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-brand-deep-red hover:text-brand-deep-red transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
