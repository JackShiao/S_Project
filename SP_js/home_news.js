// Google News RSS 取得主新聞（CORS 限制下用 rss2json 代理）
document.addEventListener('DOMContentLoaded', function () {

    // 正確的新聞時間格式化函式
    function formatAdd8Hours(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const forced = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        const y = forced.getFullYear();
        const m = (forced.getMonth() + 1).toString().padStart(2, '0');
        const d = forced.getDate().toString().padStart(2, '0');
        const h = forced.getHours().toString().padStart(2, '0');
        const min = forced.getMinutes().toString().padStart(2, '0');
        const s = forced.getSeconds().toString().padStart(2, '0');
        return `${y}/${m}/${d} ${h}:${min}:${s}`;
    }

    // 事件代理：重整按鈕
    document.getElementById('intl-news-main-link').addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('reload-btn')) {
            e.preventDefault();
            location.reload();
        }
    });
    document.getElementById('tw-news-main-link').addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('reload-btn')) {
            e.preventDefault();
            location.reload();
        }
    });
    document.getElementById('business-news-main-link').addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('reload-btn')) {
            e.preventDefault();
            location.reload();
        }
    });


    // 國際新聞
    // 連結 rss 轉 api 再 fetch
    const intlrssUrl = 'https://news.google.com/rss/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx1YlY4U0JYcG9MVlJYR2dKVVZ5Z0FQAQ?hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
    const intlapiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(intlrssUrl);
    fetch(intlapiUrl)
        .then(res => res.json())
        .then(data => {
            // 檢查是否有資料
            if (!data.items || data.items.length < 1) {
                // 主新聞區塊顯示暫無新聞
                document.getElementById('intl-news-main-link').href = '#';
                document.getElementById('intl-news-main-link').innerHTML =
                    '<div class="mt-3 btn btn-primary text-decoration-none d-flex align-items-center justify-content-center reload-btn">重新整理</div>';
                document.getElementById('intl-news-main-time').textContent = '';
                document.getElementById('intl-news-main-img').src = './SP_img/news1.png';
                // 清空副新聞
                for (let i = 2; i <= 4; i++) {
                    const a = document.getElementById('intl-news-link-' + i);
                    const t = document.getElementById('intl-news-time-' + i);
                    if (a) a.textContent = '';
                    if (t) t.textContent = '';
                }
                // 顯示提示
                const intlNews = document.getElementById('intl-news');
                if (intlNews) {
                    intlNews.innerHTML =
                        '<div class="d-flex justify-content-center align-items-center text-muted" style="height: 200px;">暫無新聞</div>';
                }
                return;
            }
            // 主新聞
            const item = data.items[0];
            document.getElementById('intl-news-main-link').href = item.link;
            document.getElementById('intl-news-main-link').textContent = item.title;
            document.getElementById('intl-news-main-time').textContent = formatAdd8Hours(item.pubDate);
            // 主新聞圖片
            let img = item.enclosure && item.enclosure.link ? item.enclosure.link : '';
            if (!img && item.thumbnail) img = item.thumbnail;
            if (!img && item.description) {
                const match = item.description.match(/<img[^>]+src=["']([^"']+)["']/);
                if (match) img = match[1];
            }
            if (img) {
                document.getElementById('intl-news-main-img').src = img;
                // 同步更新圖片外層 <a> 的 href
                const imgLink = document.querySelector('#intl-news-main-img').closest('a');
                if (imgLink) imgLink.href = item.link;
            }
            // 2~4條
            for (let i = 1; i <= 3; i++) {
                const news = data.items[i];
                const a = document.getElementById('intl-news-link-' + (i + 1));
                const t = document.getElementById('intl-news-time-' + (i + 1));
                if (a && news) {
                    a.href = news.link;
                    a.textContent = news.title;
                    if (t) t.textContent = formatAdd8Hours(news.pubDate);
                } else if (a) {
                    a.textContent = '';
                    if (t) t.textContent = '';
                }
            }
        })
        .catch(() => {
            // 網路錯誤時的 fallback
            document.getElementById('intl-news-main-link').href = '#';
            document.getElementById('intl-news-main-link').innerHTML =
                '<div class="mt-3 btn btn-primary text-decoration-none d-flex align-items-center justify-content-center reload-btn">重新整理</div>';
            document.getElementById('intl-news-main-time').textContent = '';
            document.getElementById('intl-news-main-img').src = './SP_img/news1.png';
            for (let i = 2; i <= 4; i++) {
                const a = document.getElementById('intl-news-link-' + i);
                const t = document.getElementById('intl-news-time-' + i);
                if (a) a.textContent = '';
                if (t) t.textContent = '';
            }
            const intlNews = document.getElementById('intl-news');
            if (intlNews) {
                intlNews.innerHTML =
                    '<div class="d-flex justify-content-center align-items-center text-muted" style="height: 200px;">暫無新聞</div>';
            }
        });


    // 台灣新聞
    // 連結 rss 轉 api 再 fetch
    const twrssUrl = 'https://news.google.com/rss/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFptTXpJU0JYcG9MVlJYS0FBUAE?hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
    const twapiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(twrssUrl);
    fetch(twapiUrl)
        .then(res => res.json())
        .then(data => {
            // 檢查是否有資料
            if (!data.items || data.items.length < 1) {
                // 主新聞區塊顯示暫無新聞
                document.getElementById('tw-news-main-link').href = '#';
                document.getElementById('tw-news-main-link').target = '';
                document.getElementById('tw-news-main-link').innerHTML =
                    '<div class="mt-3 btn btn-primary d-flex align-items-center justify-content-center reload-btn">重新整理</div>';
                document.getElementById('tw-news-main-time').textContent = '';
                document.getElementById('tw-news-main-img').src = './SP_img/news21.png';
                // 清空副新聞
                for (let i = 2; i <= 4; i++) {
                    const a = document.getElementById('tw-news-link-' + i);
                    const t = document.getElementById('tw-news-time-' + i);
                    if (a) a.textContent = '';
                    if (t) t.textContent = '';
                }
                // 顯示提示
                const twNews = document.getElementById('news-tw');
                if (twNews) {
                    twNews.innerHTML =
                        '<div class="d-flex justify-content-center align-items-center text-muted" style="height: 200px;">暫無新聞</div>';
                }
                return;
            }
            // 主新聞
            const item = data.items[0];
            document.getElementById('tw-news-main-link').href = item.link;
            document.getElementById('tw-news-main-link').textContent = item.title;
            document.getElementById('tw-news-main-time').textContent = formatAdd8Hours(item.pubDate);
            // 主新聞圖片
            let img = item.enclosure && item.enclosure.link ? item.enclosure.link : '';
            if (!img && item.thumbnail) img = item.thumbnail;
            if (!img && item.description) {
                const match = item.description.match(/<img[^>]+src=["']([^"']+)["']/);
                if (match) img = match[1];
            }
            if (img) {
                document.getElementById('tw-news-main-img').src = img;
                // 同步更新圖片外層 <a> 的 href
                const imgLink = document.querySelector('#tw-news-main-img').closest('a');
                if (imgLink) imgLink.href = item.link;
            }
            // 2~4條
            for (let i = 1; i <= 3; i++) {
                const news = data.items[i];
                const a = document.getElementById('tw-news-link-' + (i + 1));
                const t = document.getElementById('tw-news-time-' + (i + 1));
                if (a && news) {
                    a.href = news.link;
                    a.textContent = news.title;
                    if (t) t.textContent = formatAdd8Hours(news.pubDate);
                } else if (a) {
                    a.textContent = '';
                    if (t) t.textContent = '';
                }
            };
        })
        .catch(() => {
            // 網路錯誤時的 fallback
            document.getElementById('tw-news-main-link').href = '#';
            document.getElementById('tw-news-main-link').target = '';
            document.getElementById('tw-news-main-link').innerHTML =
                '<div class="mt-3 btn btn-primary d-flex align-items-center justify-content-center reload-btn">重新整理</div>';
            document.getElementById('tw-news-main-time').textContent = '';
            document.getElementById('tw-news-main-img').src = './SP_img/news21.png';
            for (let i = 2; i <= 4; i++) {
                const a = document.getElementById('tw-news-link-' + i);
                const t = document.getElementById('tw-news-time-' + i);
                if (a) a.textContent = '';
                if (t) t.textContent = '';
            }
            const twNews = document.getElementById('news-tw');
            if (twNews) {
                twNews.innerHTML =
                    '<div class="d-flex justify-content-center align-items-center text-muted" style="height: 200px;">暫無新聞</div>';
            }
        });

    // 商業新聞
    // 連結 rss 轉 api 再 fetch
    const businessrssUrl = 'https://news.google.com/rss/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx6TVdZU0JYcG9MVlJYR2dKVVZ5Z0FQAQ?hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
    const businessapiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(businessrssUrl);
    fetch(businessapiUrl)
        .then(res => res.json())
        .then(data => {
            // 檢查是否有資料
            if (!data.items || data.items.length < 1) {
                // 主新聞區塊顯示暫無新聞
                document.getElementById('business-news-main-link').href = '#';
                document.getElementById('business-news-main-link').target = '';
                document.getElementById('business-news-main-link').innerHTML =
                    '<div class="mt-3 btn btn-primary d-flex align-items-center justify-content-center reload-btn">重新整理</div>';
                document.getElementById('business-news-main-time').textContent = '';
                document.getElementById('business-news-main-img').src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80';
                // 清空副新聞
                for (let i = 2; i <= 4; i++) {
                    const a = document.getElementById('business-news-link-' + i);
                    const t = document.getElementById('business-news-time-' + i);
                    if (a) a.textContent = '';
                    if (t) t.textContent = '';
                }
                // 顯示提示
                const businessNews = document.getElementById('news-business');
                if (businessNews) {
                    businessNews.innerHTML =
                        '<div class="d-flex justify-content-center align-items-center text-muted" style="height: 200px;">暫無新聞</div>';
                }
                return;
            }
            // 主新聞
            const item = data.items[0];
            document.getElementById('business-news-main-link').href = item.link;
            document.getElementById('business-news-main-link').textContent = item.title;
            document.getElementById('business-news-main-time').textContent = formatAdd8Hours(item.pubDate);
            // 主新聞圖片
            let img = item.enclosure && item.enclosure.link ? item.enclosure.link : '';
            if (!img && item.thumbnail) img = item.thumbnail;
            if (!img && item.description) {
                const match = item.description.match(/<img[^>]+src=["']([^"']+)["']/);
                if (match) img = match[1];
            }
            if (img) {
                document.getElementById('business-news-main-img').src = img;
                // 同步更新圖片外層 <a> 的 href
                const imgLink = document.querySelector('#business-news-main-img').closest('a');
                if (imgLink) imgLink.href = item.link;
            }
            // 2~4條
            for (let i = 1; i <= 3; i++) {
                const news = data.items[i];
                const a = document.getElementById('business-news-link-' + (i + 1));
                const t = document.getElementById('business-news-time-' + (i + 1));
                if (a && news) {
                    a.href = news.link;
                    a.textContent = news.title;
                    if (t) t.textContent = formatAdd8Hours(news.pubDate);
                } else if (a) {
                    a.textContent = '';
                    if (t) t.textContent = '';
                }
            };
        })
        .catch(() => {
            // 網路錯誤時的 fallback
            document.getElementById('business-news-main-link').href = '#';
            document.getElementById('business-news-main-link').target = '';
            document.getElementById('business-news-main-link').innerHTML =
                '<div class="mt-3 btn btn-primary d-flex align-items-center justify-content-center reload-btn">重新整理</div>';
            document.getElementById('business-news-main-time').textContent = '';
            document.getElementById('business-news-main-img').src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80';
            for (let i = 2; i <= 4; i++) {
                const a = document.getElementById('business-news-link-' + i);
                const t = document.getElementById('business-news-time-' + i);
                if (a) a.textContent = '';
                if (t) t.textContent = '';
            }
            const businessNews = document.getElementById('news-business');
            if (businessNews) {
                businessNews.innerHTML =
                    '<div class="d-flex justify-content-center align-items-center text-muted" style="height: 200px;">暫無新聞</div>';
            }
        });

});