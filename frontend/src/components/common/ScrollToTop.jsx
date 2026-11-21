import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Automatically resets window scroll to the top on every route change.
 * Prevents pages from opening scrolled down to the footer.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname])

  return null
}
