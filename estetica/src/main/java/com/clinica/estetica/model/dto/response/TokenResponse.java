package com.clinica.estetica.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {

    private String token;
    private String type;

    public static TokenResponse of(String token) {
        return TokenResponse.builder()
                .token(token)
                .type("Bearer")
                .build();
    }
}