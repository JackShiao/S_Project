package com.jackshiao.financial.service;

import com.jackshiao.financial.dto.MarketPriceHistoryDto;
import com.jackshiao.financial.entity.MarketIndex;
import com.jackshiao.financial.entity.MarketPriceHistory;
import com.jackshiao.financial.repository.MarketIndexRepository;
import com.jackshiao.financial.repository.MarketPriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarketService {

    private static final Logger log = LoggerFactory.getLogger(MarketService.class);
    private static final int MIN_HISTORY_DAYS = 1;
    private static final int MAX_HISTORY_DAYS = 90; // 約 3 個月，防止單次查詢過多歷史資料
    private static final DateTimeFormatter HISTORY_DATE_FMT = DateTimeFormatter.ofPattern("MM/dd");

    @Value("${fred.api.key}")
    private String fredApiKey;

    @Value("${fugle.api.key:}")
    private String fugleApiKey;

    private final MarketIndexRepository marketIndexRepository;
    private final MarketPriceHistoryRepository marketPriceHistoryRepository;
    private final RestClient restClient = RestClient.create();

    public List<MarketIndex> getAllMarketIndices() {
        return marketIndexRepository.findAll();
    }

    public List<MarketIndex> searchMarketIndices(String keyword) {
        return marketIndexRepository.searchByKeyword(keyword);
    }

    // ---------------------------------------------------------------
    // 定時任務：每隔一段時間從 Frankfurter API 取得 USD、JPY、CNY 對 TWD 匯率並更新到資料庫。
    // ---------------------------------------------------------------
    @Scheduled(fixedRateString = "${scheduler.forex.fixed-rate}", initialDelayString = "${scheduler.forex.initial-delay}")
    public void updateForexRates() {
        updateFrankfurterRate("USD", "TWD", "USDTWD", "USD/TWD");
        updateFrankfurterRate("JPY", "TWD", "JPYTWD", "JPY/TWD");
        updateFrankfurterRate("CNY", "TWD", "CNYTWD", "CNY/TWD");
    }

    // ---------------------------------------------------------------
    // 共用輔助方法：呼叫 Frankfurter API 並更新單一匯率到資料庫
    // ---------------------------------------------------------------
    private void updateFrankfurterRate(String baseCurrency, String quoteCurrency, String symbol, String name) {
        try {
            List<Map<String, Object>> response = restClient.get()
                    .uri("https://api.frankfurter.dev/v2/rates?base=" + baseCurrency + "&quotes=" + quoteCurrency)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (response == null || response.isEmpty()) {
                log.warn("Frankfurter [{}] 回應格式不符合預期: {}", symbol, response);
                return;
            }

            Object rateObj = response.getFirst().get("rate");
            if (rateObj == null) {
                log.warn("Frankfurter [{}] 回應缺少匯率欄位", symbol);
                return;
            }

            BigDecimal newRate = new BigDecimal(rateObj.toString());
            LocalDateTime now = LocalDateTime.now();

            MarketIndex forex = marketIndexRepository.findBySymbol(symbol)
                    .orElseGet(() -> MarketIndex.builder()
                            .symbol(symbol)
                            .name(name)
                            .changePoint(BigDecimal.ZERO)
                            .currentPrice(newRate)
                            .updatedAt(now)
                            .build());

            BigDecimal previousPrice = forex.getCurrentPrice();
            forex.setCurrentPrice(newRate);
            forex.setUpdatedAt(now);
            forex.setChangePoint(previousPrice == null ? BigDecimal.ZERO : newRate.subtract(previousPrice));

            marketIndexRepository.save(forex);
            saveHistory(symbol, newRate);
            log.info("已更新 {} 匯率: {}", symbol, newRate);
        } catch (Exception ex) {
            log.error("更新 {} 匯率失敗", symbol, ex);
        }
    }

    // ---------------------------------------------------------------
    // 定時任務：每隔一段時間從 FRED API 取得最新的公債殖利率並更新到資料庫。
    // ---------------------------------------------------------------
    @Scheduled(fixedRateString = "${scheduler.bond.fixed-rate}", initialDelayString = "${scheduler.bond.initial-delay}")
    public void updateBondYields() {
        fetchAndUpdateFredIndicator("DGS10", "US10Y", "US 10-Year");
        fetchAndUpdateFredIndicator("IRLTLT01JPM156N", "JP10Y", "JP 10-Year");
    }

    @Scheduled(fixedRateString = "${scheduler.stock.fixed-rate}", initialDelayString = "${scheduler.stock.initial-delay}")
    public void updateStockIndices() {
        fetchAndUpdateFredIndicator("SP500", "SPX", "S&P 500");
        fetchAndUpdateFredIndicator("NASDAQCOM", "IXIC", "NASDAQ Composite");
        fetchAndUpdateFredIndicator("DJIA", "DJI", "Dow Jones");
        fetchAndUpdateFredIndicator("NIKKEI225", "N225", "Nikkei 225");
    }

    // ---------------------------------------------------------------
    // 共用輔助方法：呼叫 FRED API 並更新單一指標到資料庫
    // ---------------------------------------------------------------
    private void fetchAndUpdateFredIndicator(String seriesId, String symbol, String name) {
        try {
            Map<String, Object> response = restClient.get()
                    .uri("https://api.stlouisfed.org/fred/series/observations"
                            + "?series_id=" + seriesId
                            + "&api_key=" + fredApiKey
                    + "&file_type=json&sort_order=desc&limit=5")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (response == null || !(response.get("observations") instanceof List<?> observations)
                    || observations.isEmpty()) {
                log.warn("FRED [{}] 回應格式不符合預期: {}", seriesId, response);
                return;
            }

            BigDecimal latestValue = null;
            BigDecimal previousValue = null;

            for (Object observation : observations) {
                if (!(observation instanceof Map<?, ?> obsMap)) {
                    continue;
                }

                Object valueObj = obsMap.get("value");
                if (valueObj == null) {
                    continue;
                }

                String valueText = valueObj.toString();
                // FRED 在假日或資料缺漏時會回 "."
                if (".".equals(valueText)) {
                    continue;
                }

                BigDecimal value = new BigDecimal(valueText);
                if (latestValue == null) {
                    latestValue = value;
                } else {
                    previousValue = value;
                    break;
                }
            }

            if (latestValue == null) {
                log.warn("FRED [{}] 找不到可用觀測值（全為空值或 '.'）", seriesId);
                return;
            }

            BigDecimal changePoint = previousValue == null
                    ? BigDecimal.ZERO
                    : latestValue.subtract(previousValue);
            LocalDateTime now = LocalDateTime.now();
            final BigDecimal finalLatestValue = latestValue;
            final BigDecimal finalChangePoint = changePoint;
            final LocalDateTime finalNow = now;

            MarketIndex indicator = marketIndexRepository.findBySymbol(symbol)
                    .orElseGet(() -> MarketIndex.builder()
                            .symbol(symbol)
                            .name(name)
                            .changePoint(BigDecimal.ZERO)
                            .currentPrice(finalLatestValue)
                            .updatedAt(finalNow)
                            .build());

            indicator.setCurrentPrice(finalLatestValue);
            indicator.setUpdatedAt(finalNow);
            indicator.setChangePoint(finalChangePoint);

            marketIndexRepository.save(indicator);
            saveHistory(symbol, finalLatestValue);
            log.info("已更新 {} [{}]: {} (漲跌: {})", name, symbol, finalLatestValue, finalChangePoint);
        } catch (Exception ex) {
            log.error("更新 FRED [{}] 指標失敗", seriesId, ex);
        }
    }

    // ---------------------------------------------------------------
    // 定時任務：每隔一段時間從 Fugle API 取得最新的台灣加權指數，並更新到資料庫。
    // ---------------------------------------------------------------
    @Scheduled(fixedRateString = "${scheduler.twse.fixed-rate}", initialDelayString = "${scheduler.twse.initial-delay}")
    public void updateTwseIndex() {
        fetchAndUpdateFugleIndicator("IX0001", "TWII", "台灣加權指數");
    }

    // ---------------------------------------------------------------
    // 共用輔助方法：呼叫 Fugle API 並更新單一台股指標到資料庫
    // ---------------------------------------------------------------
    private void fetchAndUpdateFugleIndicator(String symbolCode, String symbol, String name) {
        // 確保 API Key 有設定，避免噴 401 錯誤
        if (fugleApiKey == null || fugleApiKey.trim().isEmpty()) {
            log.warn("Fugle API Key 尚未設定，略過 {} [{}] 更新", name, symbolCode);
            return;
        }

        try {
            Map<String, Object> response = restClient.get()
                    .uri("https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/" + symbolCode)
                    .header("X-API-KEY", fugleApiKey)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (response == null) {
                log.warn("Fugle [{}] 回應為空", symbolCode);
                return;
            }

            // lastPrice 為盤中即時值，非交易時間會是 null，改取 closePrice
            Object priceObj = response.get("lastPrice");
            if (priceObj == null) {
                priceObj = response.get("closePrice");
            }
            if (priceObj == null) {
                log.warn("Fugle [{}] 回應缺少價格欄位: {}", symbolCode, response);
                return;
            }

            BigDecimal newPrice = new BigDecimal(priceObj.toString());
            // 直接使用 Fugle 提供的漲跌點數（相對前一交易日收盤，比自算更準確）
            Object changeObj = response.get("change");
            BigDecimal changePoint = (changeObj != null)
                    ? new BigDecimal(changeObj.toString())
                    : BigDecimal.ZERO;

            LocalDateTime now = LocalDateTime.now();

            MarketIndex indicator = marketIndexRepository.findBySymbol(symbol)
                    .orElseGet(() -> MarketIndex.builder()
                            .symbol(symbol)
                            .name(name)
                            .changePoint(BigDecimal.ZERO)
                            .currentPrice(newPrice)
                            .updatedAt(now)
                            .build());

            indicator.setCurrentPrice(newPrice);
            indicator.setUpdatedAt(now);
            indicator.setChangePoint(changePoint);

            marketIndexRepository.save(indicator);
            saveHistory(symbol, newPrice);
            log.info("已更新 {} [{}]: {} (漲跌: {})", name, symbol, newPrice, changePoint);
        } catch (Exception ex) {
            log.error("更新 Fugle [{}] 指標失敗", symbolCode, ex);
        }
    }

    // ---------------------------------------------------------------
    // 工具方法：每次 Scheduler 更新後儲存一筆歷史快照
    // 歷史快照為輔助數據（僅供折線圖使用），儲存失敗不應中斷主指數更新，故吞掉例外僅記錄 log。
    // ---------------------------------------------------------------
    private void saveHistory(String symbol, BigDecimal price) {
        try {
            MarketPriceHistory history = MarketPriceHistory.builder()
                    .symbol(symbol)
                    .price(price)
                    .recordedAt(LocalDateTime.now())
                    .build();
            marketPriceHistoryRepository.save(history);
        } catch (Exception ex) {
            log.error("儲存 {} 歷史快照失敗", symbol, ex);
        }
    }

    // ---------------------------------------------------------------
    // 查詢方法：取得指定 symbol 的每日最新快照（最近 N 天，由舊到新）
    // ---------------------------------------------------------------
    public List<MarketPriceHistoryDto> getMarketHistory(String symbol, int limit) {
        int safeLimit = Math.min(Math.max(limit, MIN_HISTORY_DAYS), MAX_HISTORY_DAYS);
        Pageable pageable = PageRequest.of(0, safeLimit);
        List<MarketPriceHistory> rows = marketPriceHistoryRepository
                .findLatestPerDayBySymbol(symbol.toUpperCase(), pageable);
        List<MarketPriceHistoryDto> result = rows.stream()
                .map(h -> new MarketPriceHistoryDto(h.getPrice(), h.getRecordedAt().format(HISTORY_DATE_FMT)))
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.reverse(result);
        return result;
    }
}
