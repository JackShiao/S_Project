import { useEffect, useMemo, useState } from 'react'
import { getMarketIndices } from '../../api/marketApi'
import { Link } from 'react-router-dom'
import './MarketSection.css'

const fallbackIndices = [
  { name: '台灣加權指數', value: '28080.31', change: '+1.37%' },
  { name: 'S&P500', value: '6,834.50', change: '+0.88%' },
  { name: '納斯達克指數', value: '23,307.62', change: '+1.31%' },
  { name: '道瓊工業指數', value: '48,134.89', change: '+0.38%' },
  { name: '日經225', value: '50,461.00', change: '+1.93%' },
]

function normalizeItems(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => ({
        name: item?.name ?? item?.indexName ?? item?.symbol ?? `指數 ${index + 1}`,
        value: item?.value ?? item?.close ?? item?.price ?? item?.last ?? '--',
        change:
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
  const text = String(changeValue ?? '').trim()
  if (text.startsWith('-')) {
    return { icon: 'bi bi-caret-down-fill', className: 'text-success' }
  }

  if (text.startsWith('+')) {
    return { icon: 'bi bi-caret-up-fill', className: 'text-danger' }
  }

  return { icon: 'bi bi-dash', className: 'text-secondary' }
}

function MarketSection() {
  const [indices, setIndices] = useState(fallbackIndices)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchMarketData() {
      try {
        const payload = await getMarketIndices()
        const normalized = normalizeItems(payload)

        if (!isMounted) {
          return
        }

        if (normalized.length > 0) {
          setIndices(normalized)
          setNote('')
          return
        }

        setIndices(fallbackIndices)
        if (payload?.title) {
          setNote(`目前後端回傳測試資料：${payload.title}，先顯示模擬指數。`)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setIndices(fallbackIndices)
        setErrorMessage(error?.message || '無法取得市場指數資料，先顯示模擬資料。')
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

  const rows = useMemo(() => indices, [indices])

  return (
    <main className="container">
      <section className="market-section">
        <div className="market-card">
          <h3 className="mb-3">市場指數快覽</h3>

          {isLoading && <div className="alert alert-light mb-3">市場指數載入中...</div>}
          {!isLoading && note && <div className="alert alert-warning market-note">{note}</div>}
          {!isLoading && errorMessage && (
            <div className="alert alert-secondary market-note">{errorMessage}</div>
          )}

          <div className="table-responsive">
            <table className="table table-hover mb-0" aria-label="市場指數資料表">
              <thead>
                <tr>
                  <th scope="col">指數名稱</th>
                  <th scope="col">收盤指數</th>
                  <th scope="col">昨日漲跌幅</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, index) => {
                  const trend = getTrendStyle(item.change)
                  const cleanChange = String(item.change ?? '--').replace(/^[+-]/, '')

                  return (
                    <tr key={`${item.name}-${index}`}>
                      <td>{item.name}</td>
                      <td>{item.value}</td>
                      <td className={trend.className}>
                        <i className={trend.icon} aria-hidden="true" /> {cleanChange}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2">
            <Link to="/market" className="btn btn-warning w-100">
              查看更多
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default MarketSection