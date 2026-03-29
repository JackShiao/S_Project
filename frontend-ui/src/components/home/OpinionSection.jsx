import './OpinionSection.css'

function OpinionSection() {
  return (
    <section className="opinion-section container" aria-label="觀點摘要區塊">
      <div className="card opinion-card p-3 mb-4">
        <h3>觀點摘要</h3>
        <div className="card-body">
          <div className="d-flex align-items-center mb-2">
            <i className="bi bi-chat-right-quote fs-2 me-2 mb-1" aria-hidden="true" />
            <div>
              <div className="fw-bold">Joe's 華爾街脈動</div>
              <div className="text-muted small">來源：鉅亨網</div>
            </div>
          </div>

          <h5 className="card-title">分析師簡介</h5>
          <p className="card-text">
            Joe 是知名財經專欄作家與市場分析師，擁有國際特許金融分析師（CFA）資格，長期關注市場並以深入淺出的分析、專業的總經與技術面觀察，為投資人提供即時且具前瞻性的市場評論，協助讀者掌握最新趨勢與投資機會。
          </p>

          <a
            href="https://hao.cnyes.com/ch/361680"
            className="btn btn-outline-secondary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看完整內容 <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default OpinionSection