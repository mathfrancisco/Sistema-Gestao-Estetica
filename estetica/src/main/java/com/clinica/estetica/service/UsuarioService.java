package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.Usuario;
import com.clinica.estetica.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<Usuario> listarTodos() {
        log.debug("Listando todos os usuários");
        return usuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorId(Long id) {
        log.debug("Buscando usuário por ID: {}", id);
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorUsername(String username) {
        log.debug("Buscando usuário por username: {}", username);
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com username: " + username));
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorEmail(String email) {
        log.debug("Buscando usuário por email: {}", email);
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com email: " + email));
    }

    @Transactional
    public Usuario criar(Usuario usuario) {
        log.info("Criando novo usuário: {}", usuario.getUsername());

        validarUsuario(usuario);

        // Verificar se username já existe
        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            throw new BusinessException("Username já existe: " + usuario.getUsername());
        }

        // Verificar se email já existe
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new BusinessException("Email já cadastrado: " + usuario.getEmail());
        }

        // Criptografar senha
        String senhaCriptografada = passwordEncoder.encode(usuario.getPasswordHash());
        usuario.setPasswordHash(senhaCriptografada);

        if (usuario.getAtivo() == null) {
            usuario.setAtivo(true);
        }

        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        log.info("Usuário criado com sucesso. ID: {}", usuarioSalvo.getId());
        return usuarioSalvo;
    }

    @Transactional
    public Usuario atualizar(Long id, Usuario usuarioAtualizado) {
        log.info("Atualizando usuário ID: {}", id);

        Usuario usuarioExistente = buscarPorId(id);

        // Validar username se foi alterado
        if (!usuarioExistente.getUsername().equals(usuarioAtualizado.getUsername())) {
            if (usuarioRepository.existsByUsername(usuarioAtualizado.getUsername())) {
                throw new BusinessException("Username já existe: " + usuarioAtualizado.getUsername());
            }
        }

        // Validar email se foi alterado
        if (!usuarioExistente.getEmail().equals(usuarioAtualizado.getEmail())) {
            if (usuarioRepository.existsByEmail(usuarioAtualizado.getEmail())) {
                throw new BusinessException("Email já cadastrado: " + usuarioAtualizado.getEmail());
            }
        }

        usuarioExistente.setNome(usuarioAtualizado.getNome());
        usuarioExistente.setUsername(usuarioAtualizado.getUsername());
        usuarioExistente.setEmail(usuarioAtualizado.getEmail());
        usuarioExistente.setRole(usuarioAtualizado.getRole());

        Usuario usuarioSalvo = usuarioRepository.save(usuarioExistente);
        log.info("Usuário atualizado com sucesso. ID: {}", id);
        return usuarioSalvo;
    }

    @Transactional
    public void alterarSenha(Long id, String senhaAtual, String novaSenha) {
        log.info("Alterando senha do usuário ID: {}", id);

        Usuario usuario = buscarPorId(id);

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
        log.info("Senha alterada com sucesso. ID: {}", id);
    }

    @Transactional
    public void resetarSenha(String email, String novaSenha) {
        log.info("Resetando senha do usuário com email: {}", email);

        Usuario usuario = buscarPorEmail(email);

        // Validar nova senha
        if (novaSenha == null || novaSenha.length() < 6) {
            throw new BusinessException("Nova senha deve ter no mínimo 6 caracteres");
        }

        // Criptografar e salvar nova senha
        String novaSenhaCriptografada = passwordEncoder.encode(novaSenha);
        usuario.setPasswordHash(novaSenhaCriptografada);

        usuarioRepository.save(usuario);
        log.info("Senha resetada com sucesso para o email: {}", email);
    }

    @Transactional
    public Usuario inativar(Long id) {
        log.info("Inativando usuário ID: {}", id);

        Usuario usuario = buscarPorId(id);
        usuario.setAtivo(false);

        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        log.info("Usuário inativado com sucesso. ID: {}", id);
        return usuarioSalvo;
    }

    @Transactional
    public Usuario ativar(Long id) {
        log.info("Ativando usuário ID: {}", id);

        Usuario usuario = buscarPorId(id);
        usuario.setAtivo(true);

        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        log.info("Usuário ativado com sucesso. ID: {}", id);
        return usuarioSalvo;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Deletando usuário ID: {}", id);

        Usuario usuario = buscarPorId(id);

        // Não permitir deletar o próprio usuário
        // Esta validação pode ser feita no controller usando o contexto de segurança

        usuarioRepository.deleteById(id);
        log.info("Usuário deletado com sucesso. ID: {}", id);
    }

    private void validarUsuario(Usuario usuario) {
        if (usuario.getNome() == null || usuario.getNome().trim().isEmpty()) {
            throw new BusinessException("Nome é obrigatório");
        }

        if (usuario.getUsername() == null || usuario.getUsername().trim().isEmpty()) {
            throw new BusinessException("Username é obrigatório");
        }

        if (usuario.getUsername().length() < 3) {
            throw new BusinessException("Username deve ter no mínimo 3 caracteres");
        }

        if (usuario.getEmail() == null || usuario.getEmail().trim().isEmpty()) {
            throw new BusinessException("Email é obrigatório");
        }

        if (!usuario.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BusinessException("Email inválido");
        }

        if (usuario.getPasswordHash() == null || usuario.getPasswordHash().trim().isEmpty()) {
            throw new BusinessException("Senha é obrigatória");
        }

        if (usuario.getPasswordHash().length() < 6) {
            throw new BusinessException("Senha deve ter no mínimo 6 caracteres");
        }

        if (usuario.getRole() == null) {
            throw new BusinessException("Role é obrigatória");
        }
    }
}