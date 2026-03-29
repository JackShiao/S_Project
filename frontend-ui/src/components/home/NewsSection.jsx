import { useEffect, useMemo, useState } from 'react'
import { getGoogleNewsByTopic } from '../../api/newsApi'
import { Link } from 'react-router-dom'
import './NewsSection.css'

const NEWS_CATEGORIES = [
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

function NewsCard({ title, topicUrl, items, isLoading, fallbackImage }) {
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
          <a href={main.link || topicUrl} target="_blank" rel="noopener noreferrer">
            {mainImage || fallbackImage ? (
              <img
                src={mainImage || fallbackImage}
                className="news-image"
                loading="lazy"
                alt={`${title}預覽圖`}
                onError={(event) => {
                  event.currentTarget.src = '/img/default.png'
                }}
              />
            ) : (
              <div className="news-image-placeholder">暫無圖片</div>
            )}
          </a>
          <div className="fw-bold mt-2 mb-1 border-bottom pb-2">
            <a
              className="news-link"
              href={main.link || topicUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {main.title}
            </a>
            <div className="news-main-time">{formatAdd8Hours(main.pubDate)}</div>
          </div>

          <ul className="list-unstyled mb-0">
            {subItems.map((item) => (
              <li key={item.guid || item.link || item.title} className="my-2 border-bottom pb-2">
                <a
                  className="news-link"
                  href={item.link || topicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.title}
                </a>
                <div className="news-time">{formatAdd8Hours(item.pubDate)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function NewsSection() {
  const [newsMap, setNewsMap] = useState({
    international: [],
    taiwan: [],
    business: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadNews() {
      try {
        const results = await Promise.all(
          NEWS_CATEGORIES.map(async (category) => {
            const payload = await getGoogleNewsByTopic(category.key)
            return [category.key, Array.isArray(payload?.items) ? payload.items : []]
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

        setNewsMap({
          international: [],
          taiwan: [],
          business: [],
        })
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

  const categories = useMemo(() => NEWS_CATEGORIES, [])

  return (
    <section className="news-section container">
      <div className="row g-3">
        {categories.map((category) => (
          <div key={category.key} className="col-lg-4">
            <NewsCard
              title={category.title}
              topicUrl={category.topicUrl}
              items={newsMap[category.key] || []}
              isLoading={isLoading}
              fallbackImage={category.fallbackImage}
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Link to="/news" className="btn btn-warning w-100">
          查看更多新聞
        </Link>
      </div>
    </section>
  )
}

export default NewsSection