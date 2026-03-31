import './Navbar.css'
import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { label: '首頁', to: '/', end: true },
  { label: '市場指數', to: '/market' },
  { label: '新聞專區', to: '/news' },
  { label: '關於', to: '/about' },
]

function Navbar() {
  const { isLoggedIn, userInfo, openModal, logout } = useAuthStore()

  return (
    <header className="sticky-top">
      <nav
        className="p-2 navbar navbar-expand-lg navbar-dark bg-dark"
        aria-label="主導覽列"
      >
        <div className="container">
          <Link
            to="/"
            className="navbar-brand fs-5 mx-lg-0 me-lg-4 text-decoration-none text-white d-flex align-items-center gap-3"
          >
            <img
              className="brand-logo"
              src="/img/Jlogo.png"
              alt="J 財經網 Logo"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="切換選單"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {navItems.map((item) => (
                <li key={item.label} className="nav-item">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `nav-link px-2 ${isActive ? 'text-secondary active' : 'text-white'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="navbar-search-placeholder" aria-label="google全站搜尋佔位">
              <i className="bi bi-search" aria-hidden="true" />
              <span>全站搜尋功能建置中</span>
            </div>

            <div className="d-flex flex-lg-row flex-column align-items-center gap-2">
              {isLoggedIn ? (
                <>
                  <span className="text-white text-nowrap">
                    歡迎，{userInfo?.name || '會員'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-light w-100 w-lg-auto"
                    onClick={logout}
                  >
                    登出
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-light w-100 w-lg-auto"
                    onClick={() => openModal('login')}
                  >
                    登入
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning w-100 w-lg-auto text-nowrap"
                    onClick={() => openModal('register')}
                  >
                    註冊會員
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar