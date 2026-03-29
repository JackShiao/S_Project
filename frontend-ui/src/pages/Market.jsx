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
import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import './Market.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const dateLabels = ['03/24', '03/25', '03/26', '03/27', '03/28', '03/29']

const marketConfigs = {
  twii: {
    title: '台灣加權指數',
    chartLabel: '加權指數',
    chartData: [27980, 28303, 28182, 28400, 28024, 28198],
    color: '#0d6efd',
    type: 'stock',
    tableKey: 'twii',
  },
  spx: {
    title: 'S&P 500 指數',
    chartLabel: 'S&P 500',
    chartData: [6870, 6846, 6840, 6886, 6901, 6827],
    color: '#dc3545',
    type: 'stock',
    tableKey: 'spx',
  },
  ixic: {
    title: '納斯達克指數',
    chartLabel: 'NASDAQ',
    chartData: [23578, 23545, 23576, 23654, 23593, 23195],
    color: '#fd7e14',
    type: 'stock',
    tableKey: 'ixic',
  },
  dji: {
    title: '道瓊工業指數',
    chartLabel: 'Dow Jones',
    chartData: [47954, 47739, 47560, 48057, 48704, 48458],
    color: '#198754',
    type: 'stock',
    tableKey: 'dji',
  },
  eur: {
    title: '歐洲市場',
    chartLabel: 'Euro Stoxx 50',
    chartData: [5723, 5725, 5718, 5708, 5753, 5720],
    color: '#20c997',
    type: 'stock',
    tableKey: 'eur',
  },
  n225: {
    title: '日本市場',
    chartLabel: 'Nikkei 225',
    chartData: [50491, 50581, 50655, 50602, 50148, 50836],
    color: '#6f42c1',
    type: 'stock',
    tableKey: 'n225',
  },
  twb20: {
    title: '台灣-20年期公債殖利率',
    chartLabel: '20年期殖利率',
    chartData: [1.35, 1.36, 1.37, 1.38, 1.36, 1.37],
    color: '#0d6efd',
    type: 'bond',
    tableKey: 'twb',
  },
  usb10: {
    title: '美國-10年期公債殖利率',
    chartLabel: '10年期殖利率',
    chartData: [4.12, 4.13, 4.14, 4.13, 4.12, 4.13],
    color: '#dc3545',
    type: 'bond',
    tableKey: 'usb',
  },
  jpb10: {
    title: '日本-10年期公債殖利率',
    chartLabel: '10年期殖利率',
    chartData: [1.9, 1.91, 1.92, 1.93, 1.91, 1.92],
    color: '#ffc107',
    type: 'bond',
    tableKey: 'jpb',
  },
  usd_twd: {
    title: '美元/台幣即期匯率',
    chartLabel: 'USD/TWD',
    chartData: [31.142, 31.158, 31.148, 31.223, 31.138, 31.138],
    color: '#e63946',
    type: 'fx',
    tableKey: 'usd_twd',
  },
  jpy_twd: {
    title: '日圓/台幣即期匯率',
    chartLabel: 'JPY/TWD',
    chartData: [0.1987, 0.1978, 0.1972, 0.1984, 0.1983, 0.1983],
    color: '#ff6b6b',
    type: 'fx',
    tableKey: 'jpy_twd',
  },
  cny_twd: {
    title: '人民幣/台幣即期匯率',
    chartLabel: 'CNY/TWD',
    chartData: [4.3877, 4.3897, 4.3943, 4.4054, 4.3966, 4.3966],
    color: '#f72585',
    type: 'fx',
    tableKey: 'cny_twd',
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

const bondTableData = {
  twb: [
    ['20年期', '台灣-20年期公債殖利率', 1.37, 0.01],
    ['10年期', '台灣-10年期公債殖利率', 1.13, -0.02],
    ['5年期', '台灣-5年期公債殖利率', 0.99, 0.0],
  ],
  usb: [
    ['20年期', '美國-20年期公債殖利率', 4.82, 0.06],
    ['10年期', '美國-10年期公債殖利率', 4.2, 0.06],
    ['2年期', '美國-2年期公債殖利率', 3.53, 0.0],
  ],
  jpb: [
    ['30年期', '日本-30年期公債殖利率', 3.36, 0.0],
    ['10年期', '日本-10年期公債殖利率', 1.95, 0.02],
    ['2年期', '日本-2年期公債殖利率', 1.07, 0.01],
  ],
}

const fxTableData = {
  usd_twd: [
    ['2026-03-29', 'USD/TWD', 31.138, 31.238, 31.01, 30.91],
    ['2026-03-28', 'USD/TWD', 31.138, 31.238, 30.98, 30.88],
    ['2026-03-27', 'USD/TWD', 31.223, 31.323, 30.95, 30.85],
  ],
  jpy_twd: [
    ['2026-03-29', 'JPY/TWD', 0.1983, 0.2023, 0.232, 0.238],
    ['2026-03-28', 'JPY/TWD', 0.1983, 0.2023, 0.231, 0.237],
    ['2026-03-27', 'JPY/TWD', 0.1984, 0.2024, 0.23, 0.236],
  ],
  cny_twd: [
    ['2026-03-29', 'CNY/TWD', 4.3966, 4.4446, 4.33, 4.39],
    ['2026-03-28', 'CNY/TWD', 4.3966, 4.4446, 4.32, 4.38],
    ['2026-03-27', 'CNY/TWD', 4.4054, 4.4534, 4.31, 4.37],
  ],
}

function Market() {
  const [activeKey, setActiveKey] = useState('twii')
  const current = marketConfigs[activeKey]

  const lineData = useMemo(
    () => ({
      labels: dateLabels,
      datasets: [
        {
          label: current.chartLabel,
          data: current.chartData,
          borderColor: current.color,
          backgroundColor: `${current.color}22`,
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [current]
  )

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
            <div className="d-grid gap-2 mb-3">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('twii')}>台灣市場</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('spx')}>S&P 500</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('ixic')}>納斯達克</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('dji')}>道瓊工業</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('eur')}>歐洲市場</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('n225')}>日本市場</button>
            </div>

            <h3 className="fs-6 text-muted">債券市場</h3>
            <div className="d-grid gap-2 mb-3">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('twb20')}>台灣公債</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('usb10')}>美國公債</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('jpb10')}>日本公債</button>
            </div>

            <h3 className="fs-6 text-muted">匯市</h3>
            <div className="d-grid gap-2">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('usd_twd')}>美元/台幣</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('jpy_twd')}>日圓/台幣</button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveKey('cny_twd')}>人民幣/台幣</button>
            </div>
          </div>
        </aside>

        <section className="col-lg-9">
          <div className="d-flex justify-content-between flex-wrap align-items-center pb-2 mb-3 border-bottom">
            <h1 className="h2 mb-0">市場指數(模擬資料)</h1>
          </div>

          <h2 className="h4 mb-3">{current.title}</h2>
          <div className="market-chart-wrap mb-4">
            <Line data={lineData} options={lineOptions} />
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

          {current.type === 'bond' && (
            <div className="table-responsive mb-4">
              <table className="table table-striped align-middle" aria-label="債券表格">
                <thead>
                  <tr>
                    <th scope="col">年期</th>
                    <th scope="col">名稱</th>
                    <th scope="col">殖利率</th>
                    <th scope="col">漲跌幅</th>
                  </tr>
                </thead>
                <tbody>
                  {(bondTableData[current.tableKey] || []).map((row) => {
                    const isUp = row[3] > 0
                    const isFlat = row[3] === 0
                    return (
                      <tr key={row[1]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}%</td>
                        <td className={isFlat ? '' : isUp ? 'text-danger' : 'text-success'}>
                          {!isFlat && (
                            <i className={`bi ${isUp ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} />
                          )}{' '}
                          {isUp ? '+' : ''}
                          {row[3]}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {current.type === 'fx' && (
            <div className="table-responsive mb-4">
              <table className="table table-striped align-middle" aria-label="匯市表格">
                <thead>
                  <tr>
                    <th scope="col">日期</th>
                    <th scope="col">幣別</th>
                    <th scope="col">即期匯率(買入)</th>
                    <th scope="col">即期匯率(賣出)</th>
                    <th scope="col">現金匯率(買入)</th>
                    <th scope="col">現金匯率(賣出)</th>
                  </tr>
                </thead>
                <tbody>
                  {(fxTableData[current.tableKey] || []).map((row) => (
                    <tr key={row[0]}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                      <td>{row[3]}</td>
                      <td>{row[4]}</td>
                      <td>{row[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Market
