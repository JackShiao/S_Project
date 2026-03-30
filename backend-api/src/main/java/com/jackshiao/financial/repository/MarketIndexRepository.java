package com.jackshiao.financial.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jackshiao.financial.entity.MarketIndex;

public interface MarketIndexRepository extends JpaRepository<MarketIndex, Integer> {

    Optional<MarketIndex> findBySymbol(String symbol);
}
