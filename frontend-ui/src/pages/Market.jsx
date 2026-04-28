import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { fetchMarketHistory, fetchMarketIndices } from '../api/marketApi'
import { addToWatchlistAPI, getWatchlistAPI, removeFromWatchlistAPI } from '../api/watchlistApi'
import { useAuthStore } from '../store/authStore'
import './Market.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// 前端顯示 key → 後端 symbol 的對應表（null 表示目前無後端資料來源）
const marketConfigs = {
  twii: {
    title: '台灣加權指數',
    chartLabel: '加權指數',
    color: '#0d6efd',
    type: 'stock',
    tableKey: 'twii',
    symbol: 'TWII',
  },
  spx: {
    title: 'S&P 500 指數',
    chartLabel: 'S&P 500',
    color: '#dc3545',
    type: 'stock',
    tableKey: 'spx',
    symbol: 'SPX',
  },
  ixic: {
    title: '納斯達克指數',
    chartLabel: 'NASDAQ',
    color: '#fd7e14',
    type: 'stock',
    tableKey: 'ixic',
    symbol: 'IXIC',
  },
  dji: {
    title: '道瓊工業指數',
    chartLabel: 'Dow Jones',
    color: '#198754',
    type: 'stock',
    tableKey: 'dji',
    symbol: 'DJI',
  },
  eur: {
    title: '歐洲市場',
    chartLabel: 'Euro Stoxx 50',
    color: '#20c997',
    type: 'stock',
    tableKey: 'eur',
    symbol: null, // 暫無免費 API 來源
  },
  n225: {
    title: '日本市場',
    chartLabel: 'Nikkei 225',
    color: '#6f42c1',
    type: 'stock',
    tableKey: 'n225',
    symbol: 'N225',
  },
  twb20: {
    title: '台灣-20年期公債殖利率',
    chartLabel: '20年期殖利率',
    color: '#0d6efd',
    type: 'bond',
    tableKey: 'twb',
    symbol: null, // 暫無免費 API 來源
  },
  usb10: {
    title: '美國-10年期公債殖利率',
    chartLabel: '10年期殖利率',
    color: '#dc3545',
    type: 'bond',
    tableKey: 'usb',
    symbol: 'US10Y',
  },
  jpb10: {
    title: '日本-10年期公債殖利率',
    chartLabel: '10年期殖利率',
    color: '#ffc107',
    type: 'bond',
    tableKey: 'jpb',
    symbol: 'JP10Y',
  },
  usd_twd: {
    title: '美元/台幣即期匯率',
    chartLabel: 'USD/TWD',
    color: '#e63946',
    type: 'fx',
    tableKey: 'usd_twd',
    symbol: 'USDTWD',
  },
  jpy_twd: {
    title: '日圓/台幣即期匯率',
    chartLabel: 'JPY/TWD',
    color: '#ff6b6b',
    type: 'fx',
    tableKey: 'jpy_twd',
    symbol: 'JPYTWD',
  },
  cny_twd: {
    title: '人民幣/台幣即期匯率',
    chartLabel: 'CNY/TWD',
    color: '#f72585',
    type: 'fx',
    tableKey: 'cny_twd',
    symbol: 'CNYTWD',
  },
}

const stockTableData = {
  twii: [
    ['2330', '台積電', 620.0, 1.2],
    ['2317', '鴻海', 110.5, -0.8],
    ['2454', '聯發科', 1100.0, 2.1],
    ['2881', '富邦金', 70.2, -0.3],
    ['2382', '廣達', 220.0, 0.9],
  ],
  spx: [
    ['AAPL', 'Apple', 195.0, 1.5],
    ['MSFT', 'Microsoft', 410.0, 0.8],
    ['NVDA', 'NVIDIA', 650.0, 3.0],
    ['AMZN', 'Amazon', 170.0, -0.6],
    ['GOOGL', 'Alphabet', 135.0, 2.2],
  ],
  ixic: [
    ['AAPL', 'Apple', 195.0, 1.5],
    ['MSFT', 'Microsoft', 410.0, 0.8],
    ['TSLA', 'Tesla', 250.0, -1.3],
    ['AVGO', 'Broadcom', 1200.0, 0.9],
    ['ADBE', 'Adobe', 600.0, 0.5],
  ],
  dji: [
    ['UNH', 'UnitedHealth', 520.0, 0.9],
    ['GS', 'Goldman Sachs', 390.0, -0.4],
    ['HD', 'Home Depot', 350.0, 1.2],
    ['JNJ', 'Johnson & Johnson', 160.0, -0.2],
    ['V', 'Visa', 250.0, 0.7],
  ],
  eur: [
    ['SAP', 'SAP SE', 130.0, 1.0],
    ['ASML', 'ASML Holding', 700.0, -0.7],
    ['OR', "L'Oreal", 400.0, 1.8],
    ['SIE', 'Siemens', 140.0, 0.6],
    ['ALV', 'Allianz', 220.0, -0.4],
  ],
  n225: [
    ['7203', '豐田汽車', 2700.0, 1.1],
    ['6758', '索尼', 13000.0, -0.5],
    ['9984', '軟銀集團', 6500.0, 2.3],
    ['8306', '三菱UFJ', 1200.0, 0.7],
    ['8035', '東京電子', 25000.0, 1.8],
  ],
}

// 台灣公債暫無免費 API 來源，維持靜態參考數據
const twBondRows = [
  { term: '20年期', name: '台灣-20年期公債殖利率', yield: 1.37, change: 0.01 },
  { term: '10年期', name: '台灣-10年期公債殖利率', yield: 1.13, change: -0.02 },
  { term: '5年期',  name: '台灣-5年期公債殖利率',  yield: 0.99, change: 0.0 },
]

// 美國公債：US20Y / US10Y / US2Y 由 liveData 提供
const usBondRows = [
  { term: '20年期', name: '美國-20年期公債殖利率', symbol: 'US20Y' },
  { term: '10年期', name: '美國-10年期公債殖利率', symbol: 'US10Y' },
  { term: '2年期',  name: '美國-2年期公債殖利率',  symbol: 'US2Y' },
]

// 日本公債：JP10Y 由 liveData 提供，其餘暫無免費 API
const jpBondRows = [
  { term: '30年期', name: '日本-30年期公債殖利率', symbol: null },
  { term: '10年期', name: '日本-10年期公債殖利率', symbol: 'JP10Y' },
  { term: '2年期',  name: '日本-2年期公債殖利率',  symbol: null },
]

// 匯率：USDTWD / JPYTWD / CNYTWD 由 liveData 提供（Frankfurter 僅提供即期匯率，無 OHLC）
const fxRows = [
  { label: 'USD/TWD', symbol: 'USDTWD' },
  { label: 'JPY/TWD', symbol: 'JPYTWD' },
  { label: 'CNY/TWD', symbol: 'CNYTWD' },
]

function Market() {
  const [activeKey, setActiveKey] = useState('twii')
  // 所有市場的即時價格（keyed by symbol）
  const [liveData, setLiveData] = useState({})
  // 當前選取市場的折線圖歷史資料
  // chartData.key 記錄「目前圖表對應的 activeKey」，key 不符即視為 loading
  const [chartData, setChartData] = useState({ key: '', labels: [], prices: [] })
  const [loadingPrices, setLoadingPrices] = useState(true)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const [watchlist, setWatchlist] = useState(new Set())
  const [watchlistLoading, setWatchlistLoading] = useState(new Set())

  const current = marketConfigs[activeKey]
  const hasSymbol = !!current.symbol
  const loadingChart = hasSymbol && chartData.key !== activeKey

  // 元件載入時，一次性取回所有指數的即時價格
  useEffect(() => {
    fetchMarketIndices()
      .then((list) => {
        if (!list) return
        const map = {}
        list.forEach((item) => {
          map[item.symbol] = item
        })
        setLiveData(map)
      })
      .catch(() => {})
      .finally(() => setLoadingPrices(false))
  }, [])

  // 切換市場時，載入對應的歷史價格折線數據
  useEffect(() => {
    const symbol = marketConfigs[activeKey]?.symbol
    if (!symbol) return

    let cancelled = false

    fetchMarketHistory(symbol, 30)
      .then((data) => {
        if (cancelled) return
        setChartData({
          key: activeKey,
          labels: data?.length ? data.map((d) => d.priceDate) : [],
          prices: data?.length ? data.map((d) => parseFloat(d.price)) : [],
        })
      })
      .catch(() => {
        if (!cancelled) setChartData({ key: activeKey, labels: [], prices: [] })
      })

    return () => { cancelled = true }
  }, [activeKey])

  // 登入狀態變更時重新載入追蹤清單
  useEffect(() => {
    if (!isLoggedIn) {
      setWatchlist(new Set())
      return
    }
    getWatchlistAPI()
      .then((res) => {
        const symbols = new Set((res?.data ?? []).map((item) => item.symbol))
        setWatchlist(symbols)
      })
      .catch(() => {})
  }, [isLoggedIn])

  async function toggleWatchlist(symbol) {
    if (!symbol) return
    setWatchlistLoading((prev) => new Set(prev).add(symbol))
    try {
      if (watchlist.has(symbol)) {
        await removeFromWatchlistAPI(symbol)
        setWatchlist((prev) => {
          const next = new Set(prev)
          next.delete(symbol)
          return next
        })
      } else {
        await addToWatchlistAPI(symbol)
        setWatchlist((prev) => new Set(prev).add(symbol))
      }
    } catch {
      // 靜默失敗
    } finally {
      setWatchlistLoading((prev) => {
        const next = new Set(prev)
        next.delete(symbol)
        return next
      })
    }
  }

  const liveEntry = current.symbol ? liveData[current.symbol] : null

  const lineData = useMemo(() => {
    const prices = [...chartData.prices]
    const labels = [...chartData.labels]

    // 用即時價格取代（或補上）圖表最後一個點，確保終點與側欄數字一致
    if (liveEntry) {
      const livePrice = parseFloat(liveEntry.currentPrice)
      if (prices.length > 0) {
        prices[prices.length - 1] = livePrice
      } else {
        prices.push(livePrice)
        labels.push('今日')
      }
    }

    return {
      labels,
      datasets: [
        {
          label: current.chartLabel,
          data: prices,
          borderColor: current.color,
          backgroundColor: `${current.color}22`,
          tension: 0.3,
          fill: true,
        },
      ],
    }
  }, [chartData, current, liveEntry])

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: false } },
    }),
    []
  )

  return (
    <main className="market-page container py-3">
      <div className="row g-3">
        <aside className="col-lg-3">
          <div className="market-sidebar border rounded bg-body-tertiary p-3">
            <h2 className="fs-5 mb-3">功能選單</h2>

            <h3 className="fs-6 text-muted">全球股市</h3>
            <div className="d-flex flex-column gap-1 mb-3">
              {[
                { key: 'twii', label: '台灣市場' },
                { key: 'spx', label: 'S&P 500' },
                { key: 'ixic', label: '納斯達克' },
                { key: 'dji', label: '道瓊工業' },
                { key: 'eur', label: '歐洲市場' },
                { key: 'n225', label: '日本市場' },
              ].map(({ key, label }) => (
                <div key={key} className="d-flex align-items-center gap-1">
                  <button type="button" className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => setActiveKey(key)}>{label}</button>
                  {isLoggedIn && marketConfigs[key].symbol && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 border-0"
                      title={watchlist.has(marketConfigs[key].symbol) ? '移除追蹤' : '加入追蹤'}
                      disabled={watchlistLoading.has(marketConfigs[key].symbol)}
                      onClick={() => toggleWatchlist(marketConfigs[key].symbol)}
                    >
                      <i className={`bi ${watchlist.has(marketConfigs[key].symbol) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <h3 className="fs-6 text-muted">債券市場</h3>
            <div className="d-flex flex-column gap-1 mb-3">
              {[
                { key: 'twb20', label: '台灣公債' },
                { key: 'usb10', label: '美國公債' },
                { key: 'jpb10', label: '日本公債' },
              ].map(({ key, label }) => (
                <div key={key} className="d-flex align-items-center gap-1">
                  <button type="button" className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => setActiveKey(key)}>{label}</button>
                  {isLoggedIn && marketConfigs[key].symbol && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 border-0"
                      title={watchlist.has(marketConfigs[key].symbol) ? '移除追蹤' : '加入追蹤'}
                      disabled={watchlistLoading.has(marketConfigs[key].symbol)}
                      onClick={() => toggleWatchlist(marketConfigs[key].symbol)}
                    >
                      <i className={`bi ${watchlist.has(marketConfigs[key].symbol) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <h3 className="fs-6 text-muted">匯市</h3>
            <div className="d-flex flex-column gap-1">
              {[
                { key: 'usd_twd', label: '美元/台幣' },
                { key: 'jpy_twd', label: '日圓/台幣' },
                { key: 'cny_twd', label: '人民幣/台幣' },
              ].map(({ key, label }) => (
                <div key={key} className="d-flex align-items-center gap-1">
                  <button type="button" className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => setActiveKey(key)}>{label}</button>
                  {isLoggedIn && marketConfigs[key].symbol && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 border-0"
                      title={watchlist.has(marketConfigs[key].symbol) ? '移除追蹤' : '加入追蹤'}
                      disabled={watchlistLoading.has(marketConfigs[key].symbol)}
                      onClick={() => toggleWatchlist(marketConfigs[key].symbol)}
                    >
                      <i className={`bi ${watchlist.has(marketConfigs[key].symbol) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="col-lg-9">
          <div className="d-flex justify-content-between flex-wrap align-items-center pb-2 mb-3 border-bottom">
            <h1 className="h2 mb-0">市場指數</h1>
            {!loadingPrices && liveEntry && (
              <div className="text-end">
                <span className="fs-5 fw-bold me-2">
                  {Number(liveEntry.currentPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className={parseFloat(liveEntry.changePoint) >= 0 ? 'text-danger' : 'text-success'}>
                  <i
                    className={`bi bi-caret-${parseFloat(liveEntry.changePoint) >= 0 ? 'up' : 'down'}-fill`}
                  />{' '}
                  {parseFloat(liveEntry.changePoint) >= 0 ? '+' : ''}
                  {Number(liveEntry.changePoint).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <h2 className="h4 mb-3">{current.title}</h2>
          <div className="market-chart-wrap mb-4">
            {loadingChart ? (
              <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                載入中…
              </div>
            ) : chartData.labels.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                <i className="bi bi-bar-chart me-2" />暫無歷史數據
              </div>
            ) : (
              <Line data={lineData} options={lineOptions} />
            )}
          </div>

          {current.type === 'stock' && (
            <div className="table-responsive mb-4">
              <table className="table table-striped align-middle" aria-label="股票表格">
                <thead>
                  <tr>
                    <th scope="col">證券代碼</th>
                    <th scope="col">證券名稱</th>
                    <th scope="col">收盤指數</th>
                    <th scope="col">漲跌幅</th>
                  </tr>
                </thead>
                <tbody>
                  {(stockTableData[current.tableKey] || []).map((row) => {
                    const isUp = row[3] > 0
                    return (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{Number(row[2]).toLocaleString()}</td>
                        <td className={isUp ? 'text-danger' : 'text-success'}>
                          <i className={`bi ${isUp ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} /> {isUp ? '+' : ''}
                          {row[3]}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {current.type === 'bond' && (() => {
            const rows = current.tableKey === 'usb' ? usBondRows
              : current.tableKey === 'jpb' ? jpBondRows
              : twBondRows
            const isLive = current.tableKey === 'usb' || current.tableKey === 'jpb'
            return (
              <div className="table-responsive mb-4">
                <table className="table table-striped align-middle" aria-label="債券表格">
                  <thead>
                    <tr>
                      <th scope="col">年期</th>
                      <th scope="col">名稱</th>
                      <th scope="col">殖利率</th>
                      <th scope="col">漲跌點</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const entry = isLive && row.symbol ? liveData[row.symbol] : null
                      const yieldVal = entry ? parseFloat(entry.currentPrice) : (row.yield ?? null)
                      const changeVal = entry ? parseFloat(entry.changePoint) : (row.change ?? null)
                      const isFlat = changeVal === 0
                      const isUp = changeVal > 0
                      return (
                        <tr key={row.name}>
                          <td>{row.term}</td>
                          <td>{row.name}</td>
                          <td>{yieldVal != null ? `${yieldVal}%` : <span className="text-muted">N/A</span>}</td>
                          <td className={changeVal == null || isFlat ? '' : isUp ? 'text-danger' : 'text-success'}>
                            {changeVal == null ? (
                              <span className="text-muted">N/A</span>
                            ) : (
                              <>{!isFlat && <i className={`bi ${isUp ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} />}{' '}{isUp ? '+' : ''}{changeVal}%</>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })()}

          {current.type === 'fx' && (
            <div className="table-responsive mb-4">
              <table className="table table-striped align-middle" aria-label="匯市表格">
                <thead>
                  <tr>
                    <th scope="col">幣別</th>
                    <th scope="col">即期匯率</th>
                    <th scope="col">漲跌點</th>
                  </tr>
                </thead>
                <tbody>
                  {fxRows.map((row) => {
                    const entry = liveData[row.symbol]
                    const rate = entry ? Number(entry.currentPrice) : null
                    const change = entry ? parseFloat(entry.changePoint) : null
                    const isUp = change > 0
                    const isFlat = change === 0
                    return (
                      <tr key={row.symbol}>
                        <td>{row.label}</td>
                        <td>
                          {rate != null
                            ? rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                            : <span className="text-muted">載入中…</span>}
                        </td>
                        <td className={change == null || isFlat ? '' : isUp ? 'text-danger' : 'text-success'}>
                          {change == null ? (
                            <span className="text-muted">載入中…</span>
                          ) : (
                            <>{!isFlat && <i className={`bi ${isUp ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} />}{' '}{isUp ? '+' : ''}{change.toFixed(4)}</>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-muted small mb-0">資料來源：Frankfurter API（即期中間價）</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Market
