import { useEffect } from 'react'
import Footer from './components/layout/Footer'
import AuthModals from './components/auth/AuthModals'
import Navbar from './components/layout/Navbar'
import ToastContainer from './components/layout/ToastContainer'
import Home from './pages/Home'
import Market from './pages/Market'
import News from './pages/News'
import About from './pages/About'
import Profile from './pages/Profile'
import Watchlist from './pages/Watchlist'
import Portfolio from './pages/Portfolio'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const initAuth = useAuthStore((state) => state.initAuth)

  // 頁面載入時從 localStorage 恢復登入狀態
  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market" element={<Market />} />
        <Route path="/news" element={<News />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
      <Footer />
      <AuthModals />
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
