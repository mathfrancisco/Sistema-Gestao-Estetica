package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.UnauthorizedException;
import com.clinica.estetica.mapper.UsuarioMapper;
import com.clinica.estetica.model.dto.response.LoginResponse;
import com.clinica.estetica.model.dto.response.UsuarioResponse;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioMapper usuarioMapper;

    @Transactional
    public LoginResponse login(String username, String password) {
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

            // Criar resposta usando mapper
            LoginResponse response = usuarioMapper.toLoginResponse(token, usuario);

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

        // TODO: Implementar lógica de envio de email
        // 1. Gerar token de reset (UUID ou JWT temporário)
        // 2. Salvar token no banco com data de expiração
        // 3. Enviar email com link contendo o token

        log.info("Email de reset de senha enviado para: {}", email);
    }

    @Transactional
    public void resetarSenha(String token, String novaSenha) {
        log.info("Resetando senha com token");

        // TODO: Implementar validação de token
        // 1. Buscar usuário pelo token
        // 2. Verificar se token não expirou
        // 3. Resetar senha

        // Validar nova senha
        if (novaSenha == null || novaSenha.length() < 6) {
            throw new BusinessException("Nova senha deve ter no mínimo 6 caracteres");
        }

        // TODO: Implementar reset de senha

        log.info("Senha resetada com sucesso");
    }

    @Transactional(readOnly = true)
    public Usuario getUsuarioLogado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Usuário não autenticado");
        }

        String username = authentication.getName();
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado"));
    }

    @Transactional(readOnly = true)
    public UsuarioResponse getUsuarioLogadoResponse() {
        Usuario usuario = getUsuarioLogado();
        return usuarioMapper.toResponse(usuario);
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
    public String refreshToken(String oldToken) {
        log.info("Renovando token JWT");

        // Validar token antigo
        if (!tokenProvider.validateToken(oldToken)) {
            throw new UnauthorizedException("Token inválido ou expirado");
        }

        // Extrair username do token antigo
        String username = tokenProvider.getUsernameFromToken(oldToken);
        if (username == null) {
            throw new UnauthorizedException("Token inválido");
        }

        // Buscar usuário
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado"));

        // Verificar se usuário está ativo
        if (!usuario.getAtivo()) {
            throw new UnauthorizedException("Usuário inativo");
        }

        // Gerar novo token
        String newToken = tokenProvider.generateToken(username);

        log.info("Token renovado com sucesso para o usuário: {}", username);
        return newToken;
    }

    @Transactional
    public void alterarSenhaPerfil(String senhaAtual, String novaSenha, String confirmPassword) {
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

        // Validar confirmação de senha
        if (!novaSenha.equals(confirmPassword)) {
            throw new BusinessException("As senhas não coincidem");
        }

        // Criptografar e salvar nova senha
        String novaSenhaCriptografada = passwordEncoder.encode(novaSenha);
        usuario.setPasswordHash(novaSenhaCriptografada);

        usuarioRepository.save(usuario);
        log.info("Senha alterada com sucesso para o usuário: {}", usuario.getUsername());
    }

    @Transactional
    public UsuarioResponse atualizarPerfil(String nome, String email) {
        log.info("Atualizando perfil do usuário logado");

        Usuario usuarioLogado = getUsuarioLogado();

        // Verificar se email já existe para outro usuário
        if (!usuarioLogado.getEmail().equals(email)) {
            boolean emailExiste = usuarioRepository.existsByEmail(email);
            if (emailExiste) {
                throw new BusinessException("Email já está em uso");
            }
        }

        // Atualizar apenas campos permitidos
        usuarioLogado.setNome(nome);
        usuarioLogado.setEmail(email);

        Usuario usuarioSalvo = usuarioRepository.save(usuarioLogado);
        log.info("Perfil atualizado com sucesso para o usuário: {}", usuarioSalvo.getUsername());

        return usuarioMapper.toResponse(usuarioSalvo);
    }
}