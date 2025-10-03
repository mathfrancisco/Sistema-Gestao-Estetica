package com.clinica.estetica.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(secret);
    }

    /**
     * Gera token a partir de UserDetails
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(userDetails.getUsername());
    }

    /**
     * Gera token a partir de Authentication
     */
    public String generateToken(Authentication authentication) {
        return generateToken(authentication.getName());
    }

    /**
     * Gera token a partir de username
     */
    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return JWT.create()
                .withSubject(username)
                .withIssuedAt(now)
                .withExpiresAt(expiryDate)
                .withIssuer("clinica-estetica")
                .sign(getAlgorithm());
    }

    /**
     * Extrai username do token
     */
    public String extractUsername(String token) {
        try {
            DecodedJWT jwt = JWT.require(getAlgorithm())
                    .withIssuer("clinica-estetica")
                    .build()
                    .verify(token);
            return jwt.getSubject();
        } catch (JWTVerificationException e) {
            log.error("Erro ao extrair username do token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Alias para extractUsername - mantido para compatibilidade
     */
    public String getUsernameFromToken(String token) {
        return extractUsername(token);
    }

    /**
     * Valida token com UserDetails
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username != null &&
                    username.equals(userDetails.getUsername()) &&
                    !isTokenExpired(token));
        } catch (Exception e) {
            log.error("Erro ao validar token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Valida token sem UserDetails (apenas verifica se é válido e não expirou)
     */
    public boolean validateToken(String token) {
        try {
            DecodedJWT jwt = JWT.require(getAlgorithm())
                    .withIssuer("clinica-estetica")
                    .build()
                    .verify(token);
            return !isTokenExpired(token);
        } catch (JWTVerificationException e) {
            log.error("Token inválido: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifica se o token está expirado
     */
    private boolean isTokenExpired(String token) {
        try {
            DecodedJWT jwt = JWT.require(getAlgorithm())
                    .withIssuer("clinica-estetica")
                    .build()
                    .verify(token);
            return jwt.getExpiresAt().before(new Date());
        } catch (JWTVerificationException e) {
            log.error("Erro ao verificar expiração do token: {}", e.getMessage());
            return true;
        }
    }

    /**
     * Obtém a data de expiração do token
     */
    public Date getExpirationDateFromToken(String token) {
        try {
            DecodedJWT jwt = JWT.require(getAlgorithm())
                    .withIssuer("clinica-estetica")
                    .build()
                    .verify(token);
            return jwt.getExpiresAt();
        } catch (JWTVerificationException e) {
            log.error("Erro ao obter data de expiração do token: {}", e.getMessage());
            return null;
        }
    }
}