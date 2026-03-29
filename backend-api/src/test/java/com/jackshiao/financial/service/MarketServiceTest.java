package com.jackshiao.financial.service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class MarketServiceTest {

    @Autowired
    private MarketService marketService;

    @Test
    void shouldCreateMarketServiceBean() {
        assertNotNull(marketService);
    }

    @Test
    @Disabled("連外部 API 的 smoke test，預設不在 CI 啟用")
    void shouldFetchMarketIndicesFromExternalApi() {
        Map<String, Object> data = marketService.getMarketIndices();
        assertNotNull(data);
    }
}
