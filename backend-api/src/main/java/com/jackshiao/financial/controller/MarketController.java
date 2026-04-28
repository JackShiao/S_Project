package com.jackshiao.financial.controller;

import com.jackshiao.financial.common.ApiResponse;
import com.jackshiao.financial.entity.MarketIndex;
import com.jackshiao.financial.service.MarketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    @GetMapping("/indices")
    public ApiResponse<List<MarketIndex>> getMarketIndices() {
        List<MarketIndex> indices = marketService.getAllMarketIndices();
        return ApiResponse.success(indices);
    }

    @GetMapping("/search")
    public ApiResponse<List<MarketIndex>> searchMarketIndices(
            @RequestParam(name = "q", defaultValue = "") String keyword) {
        if (keyword.isBlank()) {
            return ApiResponse.success(List.of());
        }
        List<MarketIndex> results = marketService.searchMarketIndices(keyword.trim());
        return ApiResponse.success(results);
    }
}
