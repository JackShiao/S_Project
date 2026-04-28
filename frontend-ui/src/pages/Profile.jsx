import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateDisplayNameAPI, deleteAccountAPI } from '../api/memberApi'
import { useAuthStore } from '../store/authStore'

function Profile() {
  const { isLoggedIn, userInfo, loginSuccess, updateDisplayName, logout } = useAuthStore()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // 未登入時 redirect 首頁
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, navigate])

  // 初始化表單值
  useEffect(() => {
    if (userInfo?.displayName) {
      setDisplayName(userInfo.displayName)
    }
  }, [userInfo])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!displayName.trim()) return

    setSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await updateDisplayNameAPI(displayName.trim())
      const newName = res?.data?.displayName ?? displayName.trim()
      const newToken = res?.data?.token
      if (newToken) {
        loginSuccess({ ...userInfo, displayName: newName }, newToken)
      } else {
        updateDisplayName(newName)
      }
      setDisplayName(newName)
      setSuccessMsg('顯示名稱已更新成功！')
    } catch (err) {
      const msg = err?.response?.data?.message ?? '更新失敗，請稍後再試'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccountAPI()
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message ?? '刪除失敗，請稍後再試'
      setDeleteError(msg)
      setDeleting(false)
    }
  }

  if (!isLoggedIn) return null

  return (
    <main className="container py-4" style={{ maxWidth: '640px' }}>
      <h1 className="h3 mb-4">個人設定</h1>

      {/* 帳號資訊 */}
      <div className="card mb-4">
        <div className="card-header">帳號資訊</div>
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">Email</dt>
            <dd className="col-sm-9 text-muted">{userInfo?.email}</dd>
          </dl>
        </div>
      </div>

      {/* 修改顯示名稱 */}
      <div className="card">
        <div className="card-header">修改顯示名稱</div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="displayName" className="form-label">
                顯示名稱
              </label>
              <input
                id="displayName"
                type="text"
                className="form-control"
                maxLength={50}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  setSuccessMsg('')
                  setErrorMsg('')
                }}
                disabled={submitting}
              />
              <div className="form-text text-muted">最多 50 個字元</div>
            </div>

            {successMsg && (
              <div className="alert alert-success py-2" role="alert">
                <i className="bi bi-check-circle me-2" aria-hidden="true" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="alert alert-danger py-2" role="alert">
                <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !displayName.trim()}
            >
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />儲存中…</>
                : '儲存變更'}
            </button>
          </form>
        </div>
      </div>

      {/* 刪除帳號 */}
      <div className="card border-danger mt-4">
        <div className="card-header text-danger">危險區域</div>
        <div className="card-body">
          <p className="text-muted mb-3">
            刪除帳號後，所有資料（包含追蹤清單）將永久移除，且<strong>無法復原</strong>。
            請輸入您的 Email 確認後再刪除。
          </p>
          <div className="mb-3">
            <label htmlFor="deleteConfirm" className="form-label">
              輸入 Email 確認：<code>{userInfo?.email}</code>
            </label>
            <input
              id="deleteConfirm"
              type="email"
              className="form-control"
              placeholder={userInfo?.email}
              value={deleteConfirm}
              onChange={(e) => {
                setDeleteConfirm(e.target.value)
                setDeleteError('')
              }}
              disabled={deleting}
            />
          </div>
          {deleteError && (
            <div className="alert alert-danger py-2" role="alert">
              <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
              {deleteError}
            </div>
          )}
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleting || deleteConfirm !== userInfo?.email}
            onClick={handleDeleteAccount}
          >
            {deleting
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />刪除中…</>
              : <><i className="bi bi-trash me-2" aria-hidden="true" />永久刪除帳號</>}
          </button>
        </div>
      </div>
    </main>
  )
}

export default Profile
