import { useEffect, useMemo, useState } from 'react'
import { getGoogleNewsByTopic } from '../api/newsApi'
import '../components/home/NewsSection.css'
import './News.css'

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

function CategoryNewsCard({ title, topicUrl, items, isLoading, fallbackImage }) {
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
            <img
              src={mainImage || fallbackImage}
              className="news-image"
              loading="lazy"
              alt={`${title}預覽圖`}
              onError={(event) => {
                event.currentTarget.src = '/img/default.png'
              }}
            />
          </a>
          <div className="fw-bold mt-2 mb-1 border-bottom pb-2">
            <a className="news-link" href={main.link || topicUrl} target="_blank" rel="noopener noreferrer">
              {main.title}
            </a>
            <div className="news-main-time">{formatAdd8Hours(main.pubDate)}</div>
          </div>

          <ul className="list-unstyled mb-0">
            {subItems.map((item) => (
              <li key={item.guid || item.link || item.title} className="my-2 border-bottom pb-2">
                <a className="news-link" href={item.link || topicUrl} target="_blank" rel="noopener noreferrer">
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
                  <a className="news-link" href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
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
            />
          </div>
        ))}
      </section>
    </main>
  )
}

export default News
