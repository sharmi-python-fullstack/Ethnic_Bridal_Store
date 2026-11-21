import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiFilter, FiX, FiGrid, FiList, FiChevronDown } from 'react-icons/fi'
import { getProducts, getCategories } from '../api/products'
import { setProducts, setCategories } from '../store/slices/productSlice'
import ProductCard from '../components/common/ProductCard'
import { useDebounce } from '../hooks/useDebounce'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [gridView, setGridView] = useState(true)

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    occasion: searchParams.get('occasion') || '',
    color: searchParams.get('color') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    in_stock: searchParams.get('in_stock') === 'true',
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
        ordering: urlOrdering,
        page: urlPage,
      }
    })
  }, [searchParams])

  const debouncedSearch = useDebounce(filters.search, 400)

  const fetchProducts = useCallback(async (f) => {
    const params = {}
    if (f.search) params.search = f.search
    if (f.category) params.category = f.category
    if (f.occasion) params.occasion = f.occasion
    if (f.color) params.color = f.color
    if (f.min_price) params.min_price = f.min_price
    if (f.max_price) params.max_price = f.max_price
    if (f.in_stock) params.in_stock = 'true'
    params.ordering = f.ordering
    params.page = f.page

    try {
      const res = await getProducts(params)
      dispatch(setProducts(res.data))
    } catch {}
  }, [dispatch])

  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then((r) => dispatch(setCategories(r.data))).catch(() => {})
    }
  }, [dispatch, categories.length])

  useEffect(() => {
    fetchProducts({ ...filters, search: debouncedSearch })
    // Sync URL without wiping out other search params
    const params = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (filters.category) params.category = filters.category
    if (filters.occasion) params.occasion = filters.occasion
    if (filters.color) params.color = filters.color
    if (filters.min_price) params.min_price = filters.min_price
    if (filters.max_price) params.max_price = filters.max_price
    if (filters.in_stock) params.in_stock = 'true'
    params.ordering = filters.ordering
    if (filters.page > 1) params.page = filters.page
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, filters.category, filters.occasion, filters.color, filters.min_price, filters.max_price, filters.in_stock, filters.ordering, filters.page, fetchProducts, setSearchParams])

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }))
  const clearFilters = () => setFilters({ search: '', category: '', occasion: '', color: '', min_price: '', max_price: '', in_stock: false, ordering: '-created_at', page: 1 })

  const activeFilterCount = [filters.search, filters.category, filters.occasion, filters.color, filters.min_price, filters.in_stock].filter(Boolean).length

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-charcoal">All Products</h1>
            <p className="text-gray-500 text-sm mt-1">
              {pagination.count > 0 ? `${pagination.count} products found` : 'Loading products…'}
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
