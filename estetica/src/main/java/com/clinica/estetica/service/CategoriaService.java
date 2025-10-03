package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.Categoria;
import com.clinica.estetica.repository.CategoriaRepository;
import com.clinica.estetica.repository.ProcedimentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProcedimentoRepository procedimentoRepository;

    @Transactional(readOnly = true)
    public List<Categoria> listarTodas() {
        log.debug("Listando todas as categorias");
        return categoriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Categoria> listarAtivas() {
        log.debug("Listando categorias ativas");
        return categoriaRepository.findByAtivoTrue();
    }

    @Transactional(readOnly = true)
    public Categoria buscarPorId(Long id) {
        log.debug("Buscando categoria por ID: {}", id);
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Categoria> buscarPorNome(String nome) {
        log.debug("Buscando categorias por nome: {}", nome);
        return categoriaRepository.findByNomeContainingIgnoreCase(nome);
    }

    @Transactional
    public Categoria criar(Categoria categoria) {
        log.info("Criando nova categoria: {}", categoria.getNome());

        validarCategoria(categoria);

        if (categoria.getAtivo() == null) {
            categoria.setAtivo(true);
        }

        Categoria categoriaSalva = categoriaRepository.save(categoria);
        log.info("Categoria criada com sucesso. ID: {}", categoriaSalva.getId());
        return categoriaSalva;
    }

    @Transactional
    public Categoria atualizar(Long id, Categoria categoriaAtualizada) {
        log.info("Atualizando categoria ID: {}", id);

        Categoria categoriaExistente = buscarPorId(id);
        validarCategoria(categoriaAtualizada);

        categoriaExistente.setNome(categoriaAtualizada.getNome());
        categoriaExistente.setDescricao(categoriaAtualizada.getDescricao());
        categoriaExistente.setIcone(categoriaAtualizada.getIcone());
        categoriaExistente.setCor(categoriaAtualizada.getCor());

        Categoria categoriaSalva = categoriaRepository.save(categoriaExistente);
        log.info("Categoria atualizada com sucesso. ID: {}", id);
        return categoriaSalva;
    }

    @Transactional
    public Categoria inativar(Long id) {
        log.info("Inativando categoria ID: {}", id);

        Categoria categoria = buscarPorId(id);
        categoria.setAtivo(false);

        Categoria categoriaSalva = categoriaRepository.save(categoria);
        log.info("Categoria inativada com sucesso. ID: {}", id);
        return categoriaSalva;
    }

    @Transactional
    public Categoria ativar(Long id) {
        log.info("Ativando categoria ID: {}", id);

        Categoria categoria = buscarPorId(id);
        categoria.setAtivo(true);

        Categoria categoriaSalva = categoriaRepository.save(categoria);
        log.info("Categoria ativada com sucesso. ID: {}", id);
        return categoriaSalva;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Tentando deletar categoria ID: {}", id);

        Categoria categoria = buscarPorId(id);

        // Verificar se tem procedimentos vinculados
        long totalProcedimentos = procedimentoRepository.findByCategoriaId(id).size();

        if (totalProcedimentos > 0) {
            throw new BusinessException("Não é possível deletar a categoria. Existem " +
                    totalProcedimentos + " procedimento(s) vinculado(s). Considere inativar em vez de deletar.");
        }

        categoriaRepository.deleteById(id);
        log.info("Categoria deletada com sucesso. ID: {}", id);
    }

    private void validarCategoria(Categoria categoria) {
        if (categoria.getNome() == null || categoria.getNome().trim().isEmpty()) {
            throw new BusinessException("Nome da categoria é obrigatório");
        }
    }
}