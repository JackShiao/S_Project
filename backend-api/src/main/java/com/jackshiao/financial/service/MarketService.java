package com.jackshiao.financial.service;

import com.jackshiao.financial.entity.MarketIndex;
import com.jackshiao.financial.repository.MarketIndexRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MarketService {

    private static final Logger log = LoggerFactory.getLogger(MarketService.class);
    private static final String FOREX_SYMBOL = "USDTWD";
    private static final String FOREX_NAME = "USD/TWD";

    @Value("${fred.api.key}")
    private String fredApiKey;

    @Value("${fugle.api.key:}")
    private String fugleApiKey;

    private final MarketIndexRepository marketIndexRepository;
    private final RestClient restClient = RestClient.create();

    public List<MarketIndex> getAllMarketIndices() {
        return marketIndexRepository.findAll();
    }

    public List<MarketIndex> searchMarketIndices(String keyword) {
        return marketIndexRepository.searchByKeyword(keyword);
    }

    // ---------------------------------------------------------------
    // 定時任務：每隔一段時間從 Frankfurter API 取得最新的 USD/TWD 匯率，並更新到資料庫。
    // ---------------------------------------------------------------
    @Scheduled(fixedRateString = "${scheduler.forex.fixed-rate}", initialDelayString = "${scheduler.forex.initial-delay}")
    public void updateForexRates() {
        try {
            List<Map<String, Object>> response = restClient.get()
                    .uri("https://api.frankfurter.dev/v2/rates?base=USD&quotes=TWD")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (response == null || response.isEmpty()) {
                log.warn("Frankfurter 回應格式不符合預期: {}", response);
                return;
            }

            Map<String, Object> firstRate = response.getFirst();

            Object twdRateObj = firstRate.get("rate");
            if (twdRateObj == null) {
                log.warn("Frankfurter 回應缺少 TWD 匯率: {}", response);
                return;
            }

            BigDecimal newRate = new BigDecimal(twdRateObj.toString());
            LocalDateTime now = LocalDateTime.now();

            MarketIndex forex = marketIndexRepository.findBySymbol(FOREX_SYMBOL)
                    .orElseGet(() -> MarketIndex.builder()
                            .symbol(FOREX_SYMBOL)
                            .name(FOREX_NAME)
                            .changePoint(BigDecimal.ZERO)
                            .currentPrice(newRate)
                            .updatedAt(now)
                            .build());

            BigDecimal previousPrice = forex.getCurrentPrice();
            forex.setCurrentPrice(newRate);
            forex.setUpdatedAt(now);
            forex.setChangePoint(previousPrice == null ? BigDecimal.ZERO : newRate.subtract(previousPrice));

            marketIndexRepository.save(forex);
            log.info("已更新 {} 匯率: {}", FOREX_SYMBOL, newRate);
        } catch (Exception ex) {
            log.error("更新 USD/TWD 匯率失敗", ex);
        }
    }

    // ---------------------------------------------------------------
    // 定時任務：每隔一段時間從 FRED API 取得最新的美國 10 年期公債殖利率、主要美股指數，並更新到資料庫。
    // ---------------------------------------------------------------
    @Scheduled(fixedRateString = "${scheduler.bond.fixed-rate}", initialDelayString = "${scheduler.bond.initial-delay}")
    public void updateUS10YBondYield() {
        fetchAndUpdateFredIndicator("DGS10", "US10Y", "US 10-Year");
    }

    @Scheduled(fixedRateString = "${scheduler.stock.fixed-rate}", initialDelayString = "${scheduler.stock.initial-delay}")
    public void updateStockIndices() {
        fetchAndUpdateFredIndicator("SP500", "SPX", "S&P 500");
        fetchAndUpdateFredIndicator("NASDAQCOM", "IXIC", "NASDAQ Composite");
        fetchAndUpdateFredIndicator("DJIA", "DJI", "Dow Jones");
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
            log.info("已更新 {} [{}]: {} (漲跌: {})", name, symbol, newPrice, changePoint);
        } catch (Exception ex) {
            log.error("更新 Fugle [{}] 指標失敗", symbolCode, ex);
        }
    }
}
