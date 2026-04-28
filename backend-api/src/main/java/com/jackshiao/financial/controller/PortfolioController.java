package com.jackshiao.financial.controller;

import com.jackshiao.financial.common.ApiResponse;
import com.jackshiao.financial.dto.AddHoldingRequest;
import com.jackshiao.financial.dto.HoldingResponse;
import com.jackshiao.financial.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    // [需要驗證] 取得目前登入者的所有持倉
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ApiResponse<List<HoldingResponse>> getHoldings(
            @AuthenticationPrincipal String email) {

        return ApiResponse.success(portfolioService.getHoldings(email));
    }

    // [需要驗證] 新增持倉
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ApiResponse<HoldingResponse> addHolding(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody AddHoldingRequest request) {

        return ApiResponse.success(portfolioService.addHolding(email, request), "持倉新增成功");
    }

    // [需要驗證] 刪除持倉
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteHolding(
            @AuthenticationPrincipal String email,
            @PathVariable Integer id) {

        portfolioService.deleteHolding(email, id);
        return ApiResponse.success(null, "持倉已刪除");
    }
}
