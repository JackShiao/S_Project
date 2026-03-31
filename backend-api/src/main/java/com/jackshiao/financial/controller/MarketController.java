package com.jackshiao.financial.controller;

import com.jackshiao.financial.common.ApiResponse;
import com.jackshiao.financial.entity.MarketIndex;
import com.jackshiao.financial.service.MarketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
