package com.jackshiao.financial.service;

import com.jackshiao.financial.entity.MarketIndex;
import com.jackshiao.financial.repository.MarketIndexRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarketService {

    private final MarketIndexRepository marketIndexRepository;

    public List<MarketIndex> getAllMarketIndices() {
        return marketIndexRepository.findAll();
    }
}
