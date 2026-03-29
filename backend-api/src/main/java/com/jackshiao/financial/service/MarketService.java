package com.jackshiao.financial.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class MarketService {

    private static final String MOCK_INDICES_API_URL = "https://jsonplaceholder.typicode.com/posts/1";

    private final RestTemplate restTemplate;

    public MarketService() {
        this.restTemplate = new RestTemplate();
    }

    public Map<String, Object> getMarketIndices() {
        try {
            Map<String, Object> result = restTemplate.getForObject(MOCK_INDICES_API_URL, Map.class);

            if (result == null || result.isEmpty()) {
                throw new IllegalStateException("External API returned empty market indices data");
            }

            return result;
        } catch (RestClientException e) {
            throw new IllegalStateException("Failed to fetch market indices from external API", e);
        }
    }
}
