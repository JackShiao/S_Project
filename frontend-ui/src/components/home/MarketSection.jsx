import { useEffect, useState } from 'react'
import { fetchMarketIndices } from '../../api/marketApi'
import { Link } from 'react-router-dom'
import './MarketSection.css'

function normalizeItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => ({
        id: item?.id,
        name: item?.name ?? item?.indexName ?? item?.symbol ?? `指數 ${index + 1}`,
        value: item?.currentPrice ?? item?.value ?? item?.close ?? item?.price ?? item?.last ?? '--',
        change:
          item?.changePoint ??
          item?.change ??
          item?.changePercent ??
          item?.pctChange ??
          item?.change_rate ??
          '--',
      }))
      .filter((item) => item.name)
  }

  if (Array.isArray(payload?.indices)) {
    return normalizeItems(payload.indices)
  }

  if (Array.isArray(payload?.marketData)) {
    return normalizeItems(payload.marketData)
  }

  if (payload?.name || payload?.indexName || payload?.symbol) {
    return normalizeItems([payload])
  }

  return []
}

function getTrendStyle(changeValue) {
  const num = typeof changeValue === 'number' ? changeValue : parseFloat(changeValue)
  if (!isNaN(num)) {
    if (num < 0) return { icon: 'bi bi-caret-down-fill', className: 'text-success' }
    if (num > 0) return { icon: 'bi bi-caret-up-fill', className: 'text-danger' }
    return { icon: 'bi bi-dash', className: 'text-secondary' }
  }
  const text = String(changeValue ?? '').trim()
  if (text.startsWith('-')) return { icon: 'bi bi-caret-down-fill', className: 'text-success' }
  if (text.startsWith('+')) return { icon: 'bi bi-caret-up-fill', className: 'text-danger' }
  return { icon: 'bi bi-dash', className: 'text-secondary' }
}

function MarketSection() {
  // marketData: 儲存 API 正規化後的市場指數陣列，成功取得資料後由此驅動畫面。
  const [marketData, setMarketData] = useState([])

  // isLoading: 控制首次載入中的 UI，在請求開始到結束前都維持 true。
  const [isLoading, setIsLoading] = useState(true)

  // error: 記錄 API 失敗時的友善訊息，讓畫面能改顯示錯誤提醒而不是空白。
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchMarketData() {
      try {
        const payload = await fetchMarketIndices()
        const normalized = normalizeItems(payload)

        if (!isMounted) {
          return
        }

        setMarketData(normalized)
        setError(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setError(error?.message || '目前無法取得市場指數資料，請稍後再試。')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchMarketData()

    return () => {
      isMounted = false
    }
  }, [])

  // 條件渲染邏輯：載入中優先顯示 Spinner，其次處理錯誤訊息，最後才顯示成功取得的資料內容。
  if (isLoading) {
    return (
      <section className="market-section py-5" aria-label="市場指數區塊載入中">
        <div className="container">
          <div className="market-card text-center py-5">
            <div className="spinner-border text-warning mb-3" role="status" aria-hidden="true" />
            <p className="mb-0 text-muted">市場指數載入中，請稍候...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="market-section py-5" aria-label="市場指數區塊錯誤狀態">
        <div className="container">
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="market-section py-5">
      <div className="container">
        <div className="market-card">
          <h3 className="mb-3">市場指數快覽</h3>

          {marketData.length === 0 ? (
            <div className="alert alert-light mb-0" role="status">
              目前沒有可顯示的市場指數資料。
            </div>
          ) : (
            <div className="row g-3">
              {marketData.map((item, index) => {
                const trend = getTrendStyle(item.change)
                const cleanChange = String(item.change ?? '--').replace(/^[+-]/, '')

                return (
                  <div key={item.id ?? `${item.name}-${index}`} className="col-12 col-md-6 col-xl-4">
                    <article className="border rounded-3 h-100 p-3 bg-white">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <p className="text-muted small mb-2">市場指數</p>
                          <h4 className="h5 mb-2">{item.name}</h4>
                        </div>
                        <span className={`badge bg-light border ${trend.className}`}>
                          <i className={trend.icon} aria-hidden="true" /> {cleanChange}
                        </span>
                      </div>
                      <p className="display-6 mb-0">{item.value}</p>
                    </article>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-3">
            <Link to="/market" className="btn btn-warning w-100">
              查看更多
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MarketSection