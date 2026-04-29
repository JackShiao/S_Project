import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateDisplayNameAPI, deleteAccountAPI, changePasswordAPI } from '../api/memberApi'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

function Profile() {
  const { isLoggedIn, userInfo, loginSuccess, updateDisplayName, logout } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)

  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwInvalidFields, setPwInvalidFields] = useState(new Set())

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
      addToast('顯示名稱已更新成功！', 'success')
    } catch (err) {
      const msg = err?.response?.data?.message ?? '更新失敗，請稍後再試'
      addToast(msg, 'danger')
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

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    const invalid = new Set()
    if (!pwForm.current) invalid.add('current')
    if (!pwForm.next) invalid.add('next')
    if (!pwForm.confirm) invalid.add('confirm')
    if (invalid.size > 0) {
      setPwInvalidFields(invalid)
      setPwError('請填寫所有欄位')
      return
    }
    if (pwForm.next.length < 8) {
      setPwInvalidFields(new Set(['next']))
      setPwError('新密碼長度至少 8 個字元')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwInvalidFields(new Set(['confirm']))
      setPwError('新密碼與確認密碼不一致')
      return
    }
    setPwInvalidFields(new Set())
    setPwSubmitting(true)
    try {
      await changePasswordAPI(pwForm.current, pwForm.next)
      setPwForm({ current: '', next: '', confirm: '' })
      addToast('密碼已成功更新！', 'success')
    } catch (err) {
      setPwError(err?.response?.data?.message ?? '更新失敗，請稍後再試')
    } finally {
      setPwSubmitting(false)
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
                }}
                disabled={submitting}
              />
              <div className="form-text text-muted">最多 50 個字元</div>
            </div>

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

      {/* 修改密碼 */}
      <div className="card mt-4">
        <div className="card-header">修改密碼</div>
        <div className="card-body">
          <form onSubmit={handleChangePassword} noValidate>
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label">目前密碼</label>
              <input
                id="currentPassword"
                type="password"
                className={`form-control${pwInvalidFields.has('current') ? ' is-invalid' : ''}`}
                autoComplete="current-password"
                value={pwForm.current}
                onChange={(e) => { setPwForm({ ...pwForm, current: e.target.value }); setPwInvalidFields((p) => { const n = new Set(p); n.delete('current'); return n }) }}
                disabled={pwSubmitting}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">新密碼</label>
              <input
                id="newPassword"
                type="password"
                className={`form-control${pwInvalidFields.has('next') ? ' is-invalid' : ''}`}
                autoComplete="new-password"
                minLength={8}
                value={pwForm.next}
                onChange={(e) => { setPwForm({ ...pwForm, next: e.target.value }); setPwInvalidFields((p) => { const n = new Set(p); n.delete('next'); return n }) }}
                disabled={pwSubmitting}
              />
              <div className="form-text text-muted">至少 8 個字元</div>
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">確認新密碼</label>
              <input
                id="confirmPassword"
                type="password"
                className={`form-control${pwInvalidFields.has('confirm') ? ' is-invalid' : ''}`}
                autoComplete="new-password"
                value={pwForm.confirm}
                onChange={(e) => { setPwForm({ ...pwForm, confirm: e.target.value }); setPwInvalidFields((p) => { const n = new Set(p); n.delete('confirm'); return n }) }}
                disabled={pwSubmitting}
              />
            </div>
            {pwError && (
              <div className="alert alert-danger py-2" role="alert">
                <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />{pwError}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={pwSubmitting}>
              {pwSubmitting
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />更新中…</>
                : '更新密碼'}
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
