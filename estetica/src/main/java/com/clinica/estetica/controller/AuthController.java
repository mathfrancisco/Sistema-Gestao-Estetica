package com.clinica.estetica.controller;

import com.clinica.estetica.model.dto.request.*;
import com.clinica.estetica.model.dto.response.LoginResponse;
import com.clinica.estetica.model.dto.response.MessageResponse;
import com.clinica.estetica.model.dto.response.TokenResponse;
import com.clinica.estetica.model.dto.response.UsuarioResponse;
import com.clinica.estetica.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints de autenticação e autorização")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(
            summary = "Realizar login",
            description = "Autentica o usuário e retorna um token JWT para acesso às funcionalidades protegidas"
    )
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/auth/login - Username: {}", request.getUsername());

        LoginResponse response = authService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Realizar logout",
            description = "Encerra a sessão do usuário autenticado"
    )
    public ResponseEntity<MessageResponse> logout() {
        log.info("POST /api/auth/logout");

        authService.logout();
        return ResponseEntity.ok(MessageResponse.of("Logout realizado com sucesso"));
    }

    @PostMapping("/refresh")
    @Operation(
            summary = "Renovar token",
            description = "Gera um novo token JWT a partir de um token válido ainda não expirado"
    )
    public ResponseEntity<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("POST /api/auth/refresh");

        String newToken = authService.refreshToken(request.getToken());
        return ResponseEntity.ok(TokenResponse.of(newToken));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Obter dados do usuário logado",
            description = "Retorna as informações completas do usuário autenticado"
    )
    public ResponseEntity<UsuarioResponse> getCurrentUser() {
        log.info("GET /api/auth/me");

        UsuarioResponse response = authService.getUsuarioLogadoResponse();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Esqueci minha senha",
            description = "Solicita o envio de email com instruções para redefinir a senha"
    )
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("POST /api/auth/forgot-password - Email: {}", request.getEmail());

        authService.solicitarResetSenha(request.getEmail());
        return ResponseEntity.ok(MessageResponse.of("Email de recuperação enviado com sucesso"));
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Redefinir senha",
            description = "Redefine a senha do usuário usando um token de recuperação válido"
    )
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("POST /api/auth/reset-password");

        authService.resetarSenha(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(MessageResponse.of("Senha redefinida com sucesso"));
    }

    @PutMapping("/change-password")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Alterar senha",
            description = "Permite ao usuário autenticado alterar sua própria senha"
    )
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        log.info("PUT /api/auth/change-password");

        authService.alterarSenhaPerfil(
                request.getCurrentPassword(),
                request.getNewPassword(),
                request.getConfirmPassword()
        );

        return ResponseEntity.ok(MessageResponse.of("Senha alterada com sucesso"));
    }

    @PutMapping("/profile")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Atualizar perfil",
            description = "Atualiza as informações do perfil do usuário autenticado"
    )
    public ResponseEntity<UsuarioResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        log.info("PUT /api/auth/profile");

        UsuarioResponse response = authService.atualizarPerfil(request.getNome(), request.getEmail());
        return ResponseEntity.ok(response);
    }
}