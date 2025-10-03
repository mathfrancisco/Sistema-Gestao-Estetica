package com.clinica.estetica.controller;

import com.clinica.estetica.exception.UnauthorizedException;
import com.clinica.estetica.model.dto.request.LoginRequest;
import com.clinica.estetica.model.entity.Usuario;
import com.clinica.estetica.security.JwtTokenProvider;
import com.clinica.estetica.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints de autenticação e autorização")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Autentica usuário e retorna token JWT")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) throws UnauthorizedException {
        Map<String, Object> response = authService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Encerra sessão do usuário")
    public ResponseEntity<Map<String, String>> logout() {
        authService.logout();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout realizado com sucesso");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh Token", description = "Renova token JWT")
    public ResponseEntity<Map<String, String>> refreshToken(@RequestHeader("Authorization") String token) throws UnauthorizedException {
        String oldToken = token.substring(7);
        String newToken = authService.refreshToken(oldToken);

        Map<String, String> response = new HashMap<>();
        response.put("token", newToken);
        response.put("type", "Bearer");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Dados do Usuário", description = "Retorna dados do usuário logado")
    public ResponseEntity<Usuario> getCurrentUser() throws UnauthorizedException {
        Usuario usuario = authService.getUsuarioLogado();
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Esqueci Minha Senha", description = "Solicita reset de senha")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestParam String email) {
        authService.solicitarResetSenha(email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Email de recuperação enviado");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Resetar Senha", description = "Reseta senha com token")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        authService.resetarSenha(token, newPassword);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Senha resetada com sucesso");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    @Operation(summary = "Alterar Senha", description = "Altera senha do usuário logado")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestParam String currentPassword,
            @RequestParam String newPassword) throws UnauthorizedException {
        authService.alterarSenhaPerfil(currentPassword, newPassword);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Senha alterada com sucesso");
        return ResponseEntity.ok(response);
    }
}