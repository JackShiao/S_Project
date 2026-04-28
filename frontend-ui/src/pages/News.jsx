import { useEffect, useMemo, useRef, useState } from 'react'
import { getGoogleNewsByTopic } from '../api/newsApi'
import '../components/home/NewsSection.css'
import './News.css'

function stripHtml(html) {
  if (!html) return ''
  try {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  } catch {
    return html.replace(/<[^>]*>/g, '')
  }
}

// 解析 RSS description 中的 <a> 連結，回傳 [{text, href}] 陣列
function parseDescriptionLinks(html) {
  if (!html) return []
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return Array.from(doc.querySelectorAll('a[href]'))
      .map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))
      // 過濾太短的導覽連結（「新聞」「政治」等分類標籤，通常 < 10 字）
      .filter((item) => item.text.length >= 10 && item.href)
  } catch {
    return []
  }
}

function parseNewsTitle(rawTitle) {
  const title = String(rawTitle ?? '').trim()
  if (!title) return { headline: '', source: '' }
  const match = title.match(/^(.*?)(?:\s[-｜|]\s?)([^-｜|]+)$/)
  if (match) return { headline: match[1].trim(), source: match[2].trim() }
  return { headline: title, source: '' }
}

// 不顯示為 source badge 的泛用分類詞
const GENERIC_SOURCES = new Set([
  '新聞', '政治', '財經', '娛樂', '體育', '科技', '社會', '國際', '台灣',
  '生活', '健康', '地方', '氣候', '環境', '文化', '教育', '法律',
])

function NewsModal({ article, onClose }) {
  const modalRef = useRef(null)

  // 點擊 backdrop 關閉
  function handleBackdropClick(e) {
    if (e.target === modalRef.current) onClose()
  }

  if (!article) return null

  const image = pickImageUrl(article)
  const descLinks = parseDescriptionLinks(article.description)
  const descText = descLinks.length === 0 ? stripHtml(article.description) : ''
  const parsed = parseNewsTitle(article.title ?? '')

  return (
    <div
      ref={modalRef}
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsModalTitle"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-bottom">
            <h5 className="modal-title" id="newsModalTitle">
              {parsed.source && (
                <span className="badge bg-secondary me-2 fw-normal">{parsed.source}</span>
              )}
              {parsed.headline || article.title}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="關閉"
              onClick={onClose}
            />
          </div>
          <div className="modal-body">
            {image && (
              <img
                src={image}
                alt="新聞圖片"
                className="w-100 rounded mb-3"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
            {article.pubDate && (
              <p className="text-muted small mb-2">
                <i className="bi bi-clock me-1" aria-hidden="true" />
                {formatAdd8Hours(article.pubDate)}
                {article.author && (
                  <> &nbsp;·&nbsp; <i className="bi bi-newspaper me-1" aria-hidden="true" />{article.author}</>
                )}
              </p>
            )}
            {descLinks.length > 0 ? (
              <ul className="list-unstyled mb-0">
                {descLinks.map((item, i) => {
                  const p = parseNewsTitle(item.text)
                  return (
                    <li key={i} className="py-2 border-bottom">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none text-dark d-flex justify-content-between align-items-start gap-2"
                      >
                        <span>{p.headline || item.text}</span>
                        {p.source && !GENERIC_SOURCES.has(p.source) && (
                          <span className="badge bg-secondary text-nowrap flex-shrink-0 fw-normal">
                            {p.source}
                          </span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : descText ? (
              <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{descText}</p>
            ) : (
              <p className="text-muted mb-0">暫無摘要。</p>
            )}
          </div>
          <div className="modal-footer border-top">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              關閉
            </button>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <i className="bi bi-box-arrow-up-right me-2" aria-hidden="true" />
              查看全文
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const categoryCards = [
  {
    key: 'international',
    title: '國際新聞',
    fallbackImage: '/img/news1.png',
    topicUrl:
      'https://news.google.com/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx1YlY4U0JYcG9MVlJYR2dKVVZ5Z0FQAQ?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant',
  },
  {
    key: 'taiwan',
    title: '台灣新聞',
    fallbackImage: '/img/news2.png',
    topicUrl:
      'https://news.google.com/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFptTXpJU0JYcG9MVlJYS0FBUAE?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant',
  },
  {
    key: 'business',
    title: '商業新聞',
    fallbackImage: '/img/news3.png',
    topicUrl:
      'https://news.google.com/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx6TVdZU0JYcG9MVlJYR2dKVVZ5Z0FQAQ?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant',
  },
  {
    key: 'entertainment',
    title: '娛樂新聞',
    fallbackImage: '/img/news/entertainment.jpg',
    topicUrl:
      'https://news.google.com/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNREpxYW5RU0JYcG9MVlJYR2dKVVZ5Z0FQAQ?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant',
  },
  {
    key: 'sports',
    title: '體育新聞',
    fallbackImage: '/img/news/sports.jpg',
    topicUrl:
      'https://news.google.com/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNRFp1ZEdvU0JYcG9MVlJYR2dKVVZ5Z0FQAQ?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant',
  },
  {
    key: 'scitech',
    title: '科學與科技新聞',
    fallbackImage: '/img/news/scitech.png',
    topicUrl:
      'https://news.google.com/topics/CAAqLAgKIiZDQkFTRmdvSkwyMHZNR1ptZHpWbUVnVjZhQzFVVnhvQ1ZGY29BQVAB?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant',
  },
]

function formatAdd8Hours(dateStr) {
  if (!dateStr) {
    return ''
  }

  const date = new Date(dateStr)
  const forced = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const y = forced.getFullYear()
  const m = String(forced.getMonth() + 1).padStart(2, '0')
  const d = String(forced.getDate()).padStart(2, '0')
  const h = String(forced.getHours()).padStart(2, '0')
  const min = String(forced.getMinutes()).padStart(2, '0')
  const s = String(forced.getSeconds()).padStart(2, '0')
  return `${y}/${m}/${d} ${h}:${min}:${s}`
}

function pickImageUrl(item) {
  if (!item) {
    return ''
  }

  if (item?.enclosure?.link) {
    return item.enclosure.link
  }

  if (item?.thumbnail) {
    return item.thumbnail
  }

  if (item?.description) {
    const match = item.description.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match) {
      return match[1]
    }
  }

  return ''
}

function CategoryNewsCard({ title, topicUrl, items, isLoading, fallbackImage, onArticleClick }) {
  const main = items[0]
  const subItems = items.slice(1, 4)
  const mainImage = pickImageUrl(main)

  return (
    <div className="border rounded shadow-sm h-100 p-3 bg-white">
      <a href={topicUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-dark">
        <h4 className="news-header mb-3 border-bottom pb-2">
          {title}
          <i className="bi bi-caret-right-fill" />
        </h4>
      </a>

      {isLoading && <div className="text-muted py-5 text-center">新聞載入中...</div>}

      {!isLoading && !main && <div className="text-muted py-5 text-center">暫無新聞</div>}

      {!isLoading && main && (
        <>
          <button
            type="button"
            className="d-block w-100 p-0 border-0 bg-transparent text-start"
            onClick={() => onArticleClick?.(main)}
          >
            <img
              src={mainImage || fallbackImage}
              className="news-image"
              loading="lazy"
              alt={`${title}預覽圖`}
              onError={(event) => { event.currentTarget.src = '/img/default.png' }}
            />
          </button>
          <div className="fw-bold mt-2 mb-1 border-bottom pb-2">
            <button
              type="button"
              className="btn btn-link p-0 text-start news-link"
              onClick={() => onArticleClick?.(main)}
            >
              {main.title}
            </button>
            <div className="news-main-time">{formatAdd8Hours(main.pubDate)}</div>
          </div>

          <ul className="list-unstyled mb-0">
            {subItems.map((item) => (
              <li key={item.guid || item.link || item.title} className="my-2 border-bottom pb-2">
                <button
                  type="button"
                  className="btn btn-link p-0 text-start news-link"
                  onClick={() => onArticleClick?.(item)}
                >
                  {item.title}
                </button>
                <div className="news-time">{formatAdd8Hours(item.pubDate)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function News() {
  const [newsMap, setNewsMap] = useState({
    headline: [],
    international: [],
    taiwan: [],
    business: [],
    entertainment: [],
    sports: [],
    scitech: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNews, setSelectedNews] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadNews() {
      try {
        const topicKeys = ['headline', ...categoryCards.map((item) => item.key)]
        const results = await Promise.all(
          topicKeys.map(async (key) => {
            const payload = await getGoogleNewsByTopic(key)
            return [key, Array.isArray(payload?.items) ? payload.items : []]
          })
        )

        if (!isMounted) {
          return
        }

        setNewsMap(Object.fromEntries(results))
      } catch {
        if (!isMounted) {
          return
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadNews()

    return () => {
      isMounted = false
    }
  }, [])

  const headlineMain = useMemo(() => newsMap.headline?.[0], [newsMap])
  const headlineSub = useMemo(() => (newsMap.headline || []).slice(1, 6), [newsMap])
  const headlineImage = pickImageUrl(headlineMain)

  return (
    <main className="container py-3 news-page">
      <section className="border rounded shadow-sm p-3 bg-white my-3">
        <a
          href="https://news.google.com/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNRFZxYUdjU0JYcG9MVlJYR2dKVVZ5Z0FQAQ?hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant"
          target="_blank"
          rel="noopener noreferrer"
          className="text-decoration-none text-dark"
        >
          <h4 className="news-header mb-3 border-bottom pb-2">頭條新聞<i className="bi bi-caret-right-fill" /></h4>
        </a>

        <div className="row g-0">
          <div className="col-12 col-md-5 pe-md-3 mb-3 mb-md-0 d-flex flex-column align-items-center">
            {!isLoading && headlineMain ? (
              <>
                <a href={headlineMain.link} target="_blank" rel="noopener noreferrer" className="w-100">
                  <img
                    src={headlineImage || '/img/news/headline.png'}
                    className="w-100 rounded news-headline-image"
                    loading="lazy"
                    alt="頭條新聞預覽圖"
                    onError={(event) => {
                      event.currentTarget.src = '/img/default.png'
                    }}
                  />
                </a>
                <div className="fw-bold mt-2 mb-1">
                  <a className="news-link" href={headlineMain.link} target="_blank" rel="noopener noreferrer">
                    {headlineMain.title}
                  </a>
                  <div className="news-main-time">{formatAdd8Hours(headlineMain.pubDate)}</div>
                </div>
              </>
            ) : (
              <div className="text-muted py-5 text-center w-100">頭條新聞載入中...</div>
            )}
          </div>

          <div className="col-12 col-md-7 ps-md-3">
            <div className="d-md-none border-bottom" />
            <ul className="list-unstyled mb-0">
              {headlineSub.map((item) => (
                <li key={item.guid || item.link || item.title} className="my-2 border-bottom pb-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-start news-link"
                    onClick={() => setSelectedNews(item)}
                  >
                    {item.title}
                  </button>
                  <div className="news-time">{formatAdd8Hours(item.pubDate)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="row g-3 mb-3">
        {categoryCards.slice(0, 3).map((category) => (
          <div key={category.key} className="col-lg-4">
            <CategoryNewsCard
              title={category.title}
              topicUrl={category.topicUrl}
              items={newsMap[category.key] || []}
              isLoading={isLoading}
              fallbackImage={category.fallbackImage}
              onArticleClick={setSelectedNews}
            />
          </div>
        ))}
      </section>

      <section className="row g-3 mb-3">
        {categoryCards.slice(3).map((category) => (
          <div key={category.key} className="col-lg-4">
            <CategoryNewsCard
              title={category.title}
              topicUrl={category.topicUrl}
              items={newsMap[category.key] || []}
              isLoading={isLoading}
              fallbackImage={category.fallbackImage}
              onArticleClick={setSelectedNews}
            />
          </div>
        ))}
      </section>

      {selectedNews && (
        <NewsModal article={selectedNews} onClose={() => setSelectedNews(null)} />
      )}
    </main>
  )
}

export default News
