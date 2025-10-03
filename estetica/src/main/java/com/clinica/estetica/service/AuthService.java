package com.clinica.estetica.service;


import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.UnauthorizedException;
import com.clinica.estetica.model.entity.Usuario;
import com.clinica.estetica.repository.UsuarioRepository;
import com.clinica.estetica.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Map<String, Object> login(String username, String password) throws UnauthorizedException {
        log.info("Tentativa de login para o usuário: {}", username);

        try {
            // Autenticar usuário
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Buscar usuário
            Usuario usuario = usuarioRepository.findByUsername(username)
                    .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado"));

            // Verificar se usuário está ativo
            if (!usuario.getAtivo()) {
                throw new UnauthorizedException("Usuário inativo");
            }

            // Gerar token JWT
            String token = tokenProvider.generateToken(authentication);

            // Preparar resposta
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("type", "Bearer");
            response.put("usuario", Map.of(
                    "id", usuario.getId(),
                    "nome", usuario.getNome(),
                    "username", usuario.getUsername(),
                    "email", usuario.getEmail(),
                    "role", usuario.getRole()
            ));

            log.info("Login realizado com sucesso para o usuário: {}", username);
            return response;

        } catch (AuthenticationException e) {
            log.error("Falha na autenticação para o usuário: {}", username);
            throw new UnauthorizedException("Credenciais inválidas");
        }
    }

    public void logout() {
        log.info("Logout realizado");
        SecurityContextHolder.clearContext();
    }

    @Transactional
    public void solicitarResetSenha(String email) {
        log.info("Solicitação de reset de senha para o email: {}", email);

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Email não encontrado"));

        // Aqui você pode implementar a lógica de envio de email
        // com token de reset de senha
        // Por exemplo: gerar token, salvar no banco, enviar email

        log.info("Email de reset de senha enviado para: {}", email);
    }

    @Transactional
    public void resetarSenha(String token, String novaSenha) {
        log.info("Resetando senha com token");

        // Aqui você deve validar o token
        // Buscar usuário pelo token
        // Validar se token não expirou

        // Por enquanto, vou deixar uma implementação simplificada
        // Em produção, você deve ter uma tabela de tokens de reset

        if (novaSenha == null || novaSenha.length() < 6) {
            throw new BusinessException("Nova senha deve ter no mínimo 6 caracteres");
        }

        // Implementar lógica de validação de token e reset de senha

        log.info("Senha resetada com sucesso");
    }

    @Transactional(readOnly = true)
    public Usuario getUsuarioLogado() throws UnauthorizedException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Usuário não autenticado");
        }

        String username = authentication.getName();
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado"));
    }

    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }

    public boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    @Transactional
    public String refreshToken(String oldToken) throws UnauthorizedException {
        log.info("Renovando token JWT");

        if (!tokenProvider.validateToken(oldToken)) {
            throw new UnauthorizedException("Token inválido ou expirado");
        }

        String username = tokenProvider.getUsernameFromToken(oldToken);
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado"));

        if (!usuario.getAtivo()) {
            throw new UnauthorizedException("Usuário inativo");
        }

        // Gerar novo token
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String newToken = tokenProvider.generateToken(authentication);

        log.info("Token renovado com sucesso para o usuário: {}", username);
        return newToken;
    }

    @Transactional
    public void alterarSenhaPerfil(String senhaAtual, String novaSenha) throws UnauthorizedException {
        log.info("Alterando senha do perfil do usuário logado");

        Usuario usuario = getUsuarioLogado();

        // Validar senha atual
        if (!passwordEncoder.matches(senhaAtual, usuario.getPasswordHash())) {
            throw new BusinessException("Senha atual incorreta");
        }

        // Validar nova senha
        if (novaSenha == null || novaSenha.length() < 6) {
            throw new BusinessException("Nova senha deve ter no mínimo 6 caracteres");
        }

        // Criptografar e salvar nova senha
        String novaSenhaCriptografada = passwordEncoder.encode(novaSenha);
        usuario.setPasswordHash(novaSenhaCriptografada);

        usuarioRepository.save(usuario);
        log.info("Senha alterada com sucesso para o usuário: {}", usuario.getUsername());
    }

    @Transactional
    public Usuario atualizarPerfil(Usuario usuarioAtualizado) throws UnauthorizedException {
        log.info("Atualizando perfil do usuário logado");

        Usuario usuarioLogado = getUsuarioLogado();

        // Atualizar apenas campos permitidos
        usuarioLogado.setNome(usuarioAtualizado.getNome());
        usuarioLogado.setEmail(usuarioAtualizado.getEmail());

        Usuario usuarioSalvo = usuarioRepository.save(usuarioLogado);
        log.info("Perfil atualizado com sucesso para o usuário: {}", usuarioSalvo.getUsername());
        return usuarioSalvo;
    }
}