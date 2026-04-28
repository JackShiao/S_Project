import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addHoldingAPI, deleteHoldingAPI, getHoldingsAPI } from '../api/portfolioApi'
import { useAuthStore } from '../store/authStore'

const EMPTY_FORM = {
  symbol: '',
  quantity: '',
  buyPrice: '',
  buyDate: '',
  note: '',
}

function fmt(val, digits = 2) {
  if (val == null) return <span className="text-muted">N/A</span>
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function PnlCell({ value }) {
  if (value == null) return <span className="text-muted">N/A</span>
  const n = Number(value)
  const cls = n > 0 ? 'text-danger' : n < 0 ? 'text-success' : 'text-muted'
  const prefix = n > 0 ? '+' : ''
  return <span className={cls}>{prefix}{Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
}

function Portfolio() {
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()

  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(new Set())

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) navigate('/', { replace: true })
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (!isLoggedIn) return
    fetchHoldings()
  }, [isLoggedIn])

  function fetchHoldings() {
    setLoading(true)
    getHoldingsAPI()
      .then((res) => setHoldings(res?.data ?? []))
      .catch(() => setError('載入持倉失敗，請稍後再試'))
      .finally(() => setLoading(false))
  }

  async function handleDelete(id) {
    setRemoving((prev) => new Set(prev).add(id))
    try {
      await deleteHoldingAPI(id)
      setHoldings((prev) => prev.filter((h) => h.id !== id))
    } catch {
      setError('刪除失敗，請稍後再試')
    } finally {
      setRemoving((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.symbol.trim() || !form.quantity || !form.buyPrice || !form.buyDate) {
      setFormError('請填寫所有必填欄位')
      return
    }
    setSubmitting(true)
    try {
      const res = await addHoldingAPI({
        symbol: form.symbol.trim().toUpperCase(),
        quantity: parseFloat(form.quantity),
        buyPrice: parseFloat(form.buyPrice),
        buyDate: form.buyDate,
        note: form.note.trim() || null,
      })
      setHoldings((prev) => [res.data, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      setFormError(err?.response?.data?.message ?? '新增失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  // 計算彙總統計
  const totalCost = holdings.reduce((sum, h) => sum + (h.cost ? Number(h.cost) : 0), 0)
  const totalValue = holdings.every((h) => h.currentValue != null)
    ? holdings.reduce((sum, h) => sum + Number(h.currentValue), 0)
    : null
  const totalPnl = totalValue != null ? totalValue - totalCost : null

  if (!isLoggedIn) return null

  return (
    <main className="container py-4" style={{ maxWidth: '960px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-briefcase me-2" aria-hidden="true" />
          投資組合
        </h1>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => { setShowForm((v) => !v); setFormError('') }}
        >
          <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`} aria-hidden="true" />
          {showForm ? '取消' : '新增持倉'}
        </button>
      </div>

      {/* 新增持倉表單 */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">新增持倉</div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-sm-6 col-lg-3">
                  <label className="form-label">指數代號 <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" placeholder="例：TWII" maxLength={20}
                    value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                    disabled={submitting} />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <label className="form-label">數量 <span className="text-danger">*</span></label>
                  <input type="number" className="form-control" placeholder="例：100" min="0.0001" step="0.0001"
                    value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    disabled={submitting} />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <label className="form-label">買入價格 <span className="text-danger">*</span></label>
                  <input type="number" className="form-control" placeholder="例：20000" min="0.0001" step="0.0001"
                    value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                    disabled={submitting} />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <label className="form-label">買入日期 <span className="text-danger">*</span></label>
                  <input type="date" className="form-control" max={new Date().toISOString().slice(0, 10)}
                    value={form.buyDate} onChange={(e) => setForm({ ...form, buyDate: e.target.value })}
                    disabled={submitting} />
                </div>
                <div className="col-12">
                  <label className="form-label">備註</label>
                  <input type="text" className="form-control" placeholder="選填" maxLength={200}
                    value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                    disabled={submitting} />
                </div>
              </div>
              {formError && (
                <div className="alert alert-danger py-2 mt-3" role="alert">
                  <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />{formError}
                </div>
              )}
              <button type="submit" className="btn btn-primary mt-3" disabled={submitting}>
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />儲存中…</>
                  : '確認新增'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 彙總統計 */}
      {holdings.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-sm-4">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="text-muted small">持倉成本</div>
                <div className="fw-bold font-monospace">{fmt(totalCost)}</div>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="text-muted small">現值</div>
                <div className="fw-bold font-monospace">{fmt(totalValue)}</div>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="text-muted small">總損益</div>
                <div className="fw-bold font-monospace"><PnlCell value={totalPnl} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />{error}
        </div>
      )}

      {/* 持倉列表 */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">載入中…</span>
          </div>
        </div>
      ) : holdings.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-briefcase fs-1 d-block mb-3" aria-hidden="true" />
          <p className="mb-3">尚未建立任何持倉紀錄</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            立即新增第一筆持倉
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>代號</th>
                <th>名稱</th>
                <th className="text-end">數量</th>
                <th className="text-end">買入均價</th>
                <th className="text-end">成本</th>
                <th className="text-end">現價</th>
                <th className="text-end">現值</th>
                <th className="text-end">損益</th>
                <th className="text-end">損益%</th>
                <th>備註</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.id}>
                  <td><span className="badge bg-secondary">{h.symbol}</span></td>
                  <td className="text-muted small">{h.name ?? '—'}</td>
                  <td className="text-end font-monospace">{fmt(h.quantity, 4)}</td>
                  <td className="text-end font-monospace">{fmt(h.buyPrice, 4)}</td>
                  <td className="text-end font-monospace">{fmt(h.cost)}</td>
                  <td className="text-end font-monospace">{fmt(h.currentPrice)}</td>
                  <td className="text-end font-monospace">{fmt(h.currentValue)}</td>
                  <td className="text-end font-monospace"><PnlCell value={h.profitLoss} /></td>
                  <td className="text-end font-monospace">
                    {h.profitLossPct != null
                      ? <PnlCell value={h.profitLossPct} />
                      : <span className="text-muted">N/A</span>}
                    {h.profitLossPct != null ? '%' : ''}
                  </td>
                  <td className="text-muted small">{h.note ?? '—'}</td>
                  <td className="text-end">
                    <button type="button" className="btn btn-sm btn-outline-danger"
                      disabled={removing.has(h.id)} onClick={() => handleDelete(h.id)}
                      aria-label={`刪除 ${h.symbol}`}>
                      {removing.has(h.id)
                        ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        : <i className="bi bi-trash" aria-hidden="true" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted small text-end mb-0">
            損益計算依據後端排程即時價格（每 30 分鐘更新）
          </p>
        </div>
      )}
    </main>
  )
}

export default Portfolio
