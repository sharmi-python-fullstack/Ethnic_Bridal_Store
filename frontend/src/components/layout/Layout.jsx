import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import StoreChatbot from '../common/StoreChatbot'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <StoreChatbot />
    </div>
  )
}

export default Layout
