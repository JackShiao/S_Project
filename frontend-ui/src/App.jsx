import Footer from './components/layout/Footer'
import AuthModals from './components/auth/AuthModals'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Market from './pages/Market'
import News from './pages/News'
import About from './pages/About'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market" element={<Market />} />
        <Route path="/news" element={<News />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <Footer />
      <AuthModals />
    </BrowserRouter>
  )
}

export default App
