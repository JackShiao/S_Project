// Banner 支援滑動切換功能
(function () {
    const carousel = document.getElementById('bannerCarousel');
    if (!carousel) return;
    const inner = carousel.querySelector('.carousel-inner');
    // 起始座標（滑動起點）
    let startX = 0;
    // 當前座標（滑動中）
    let currentX = 0;
    // 是否正在拖曳
    let isDragging = false;

    // ===================== 觸控事件（手機/平板） =====================
    // 手指觸碰開始
    carousel.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) { // 只處理單指觸控
            startX = e.touches[0].clientX; // 記錄起點
            currentX = startX;
            isDragging = true;
            inner.style.transition = 'none'; // 拖曳時取消動畫
        }
    });
    // 手指移動中
    carousel.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX; // 取得目前位置
    });
    // 手指放開
    carousel.addEventListener('touchend', function (e) {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        finishDrag(endX - startX); // 根據滑動距離決定切換或回彈
        isDragging = false;
    });

    // ===================== 滑鼠事件（桌機） =====================
    // 滑鼠按下開始拖曳（整個 carousel 區域都可拖曳，包含 button）
    carousel.addEventListener('mousedown', function (e) {
        // 僅處理左鍵
        if (e.button !== 0) return;
        startX = e.clientX; // 記錄起點
        currentX = startX;
        isDragging = true;
        inner.style.transition = 'none'; // 拖曳時取消動畫
        e.preventDefault(); // 防止拖曳圖片或按鈕時觸發預設行為
    });
    // 滑鼠移動中
    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        currentX = e.clientX; // 取得目前位置
        e.preventDefault();
    });
    // 滑鼠放開
    document.addEventListener('mouseup', function (e) {
        if (!isDragging) return;
        finishDrag(e.clientX - startX); // 根據滑動距離決定切換或回彈
        isDragging = false;
    });
    // 滑鼠移出 carousel 區域（如拖曳過快）
    carousel.addEventListener('mouseleave', function (e) {
        if (!isDragging) return;
        finishDrag(0); // 強制回彈
        isDragging = false;
    });

    // ===================== 拖曳結束後的處理 =====================
    /**
     * 拖曳結束時根據滑動距離決定：
     * 1. 超過 50px 就切換到上一張/下一張
     * 2. 否則回彈到原位
     * @param {number} diff 滑動距離
     */
    function finishDrag(diff) {
        // 不做圖片移動動畫，僅根據滑動距離切換
        if (Math.abs(diff) > 50) {
            const bsCarousel = bootstrap.Carousel.getOrCreateInstance(carousel);
            if (diff > 0) {
                bsCarousel.prev(); // 向右滑，上一張
            } else {
                bsCarousel.next(); // 向左滑，下一張
            }
        }
    }

    // ===================== 切換後重置 =====================
    // 不需重置 transform，因為圖片沒被移動
})();