package com.jackshiao.financial.controller;

import com.jackshiao.financial.common.ApiResponse;
import com.jackshiao.financial.service.MarketService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping("/indices")
    public ApiResponse<Map<String, Object>> getMarketIndices() {
        Map<String, Object> marketData = marketService.getMarketIndices();
        return ApiResponse.success(marketData);
    }
}
