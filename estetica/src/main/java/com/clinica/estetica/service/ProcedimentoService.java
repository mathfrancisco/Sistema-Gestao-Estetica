package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.Procedimento;
import com.clinica.estetica.model.entity.ProcedimentoProduto;
import com.clinica.estetica.repository.AgendamentoRepository;
import com.clinica.estetica.repository.ProcedimentoProdutoRepository;
import com.clinica.estetica.repository.ProcedimentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcedimentoService {

    private final ProcedimentoRepository procedimentoRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final ProcedimentoProdutoRepository procedimentoProdutoRepository;

    @Transactional(readOnly = true)
    public List<Procedimento> listarTodos() {
        log.debug("Listando todos os procedimentos");
        return procedimentoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Procedimento> listarTodosPaginado(Pageable pageable) {
        log.debug("Listando procedimentos paginado");
        return procedimentoRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Procedimento> listarAtivos() {
        log.debug("Listando procedimentos ativos");
        return procedimentoRepository.findByAtivoTrue();
    }

    @Transactional(readOnly = true)
    public Procedimento buscarPorId(Long id) {
        log.debug("Buscando procedimento por ID: {}", id);
        return procedimentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Procedimento não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public Page<Procedimento> buscarPorTexto(String busca, Pageable pageable) {
        log.debug("Buscando procedimentos por texto: {}", busca);
        return procedimentoRepository.buscarPorTexto(busca, pageable);
    }

    @Transactional(readOnly = true)
    public List<Procedimento> buscarPorCategoria(Long categoriaId) {
        log.debug("Buscando procedimentos por categoria ID: {}", categoriaId);
        return procedimentoRepository.findByCategoriaId(categoriaId);
    }

    @Transactional(readOnly = true)
    public Page<Procedimento> buscarPorAtivo(Boolean ativo, Pageable pageable) {
        log.debug("Buscando procedimentos por status ativo: {}", ativo);
        return procedimentoRepository.findByAtivo(ativo, pageable);
    }

    @Transactional(readOnly = true)
    public List<Procedimento> buscarTopProcedimentos(int limit) {
        log.debug("Buscando top {} procedimentos", limit);
        return procedimentoRepository.findTopProcedimentos(Pageable.ofSize(limit));
    }

    @Transactional
    public Procedimento criar(Procedimento procedimento) {
        log.info("Criando novo procedimento: {}", procedimento.getNome());

        validarProcedimento(procedimento);

        if (procedimento.getAtivo() == null) {
            procedimento.setAtivo(true);
        }

        Procedimento procedimentoSalvo = procedimentoRepository.save(procedimento);
        log.info("Procedimento criado com sucesso. ID: {}", procedimentoSalvo.getId());
        return procedimentoSalvo;
    }

    @Transactional
    public Procedimento atualizar(Long id, Procedimento procedimentoAtualizado) {
        log.info("Atualizando procedimento ID: {}", id);

        Procedimento procedimentoExistente = buscarPorId(id);
        validarProcedimento(procedimentoAtualizado);

        procedimentoExistente.setNome(procedimentoAtualizado.getNome());
        procedimentoExistente.setDescricao(procedimentoAtualizado.getDescricao());
        procedimentoExistente.setCategoria(procedimentoAtualizado.getCategoria());
        procedimentoExistente.setDuracaoMinutos(procedimentoAtualizado.getDuracaoMinutos());
        procedimentoExistente.setPreco(procedimentoAtualizado.getPreco());
        procedimentoExistente.setPreparoNecessario(procedimentoAtualizado.getPreparoNecessario());
        procedimentoExistente.setCuidadosPos(procedimentoAtualizado.getCuidadosPos());
        procedimentoExistente.setContraindicacoes(procedimentoAtualizado.getContraindicacoes());
        procedimentoExistente.setImagemUrl(procedimentoAtualizado.getImagemUrl());

        Procedimento procedimentoSalvo = procedimentoRepository.save(procedimentoExistente);
        log.info("Procedimento atualizado com sucesso. ID: {}", id);
        return procedimentoSalvo;
    }

    @Transactional
    public Procedimento inativar(Long id) {
        log.info("Inativando procedimento ID: {}", id);

        Procedimento procedimento = buscarPorId(id);

        // Verificar se tem agendamentos futuros
        LocalDateTime agora = LocalDateTime.now();
        long agendamentosFuturos = agendamentoRepository.findByProcedimentoId(id).stream()
                .filter(a -> a.getDataHora().isAfter(agora))
                .count();

        if (agendamentosFuturos > 0) {
            throw new BusinessException("Não é possível inativar o procedimento. Existem " +
                    agendamentosFuturos + " agendamento(s) futuro(s).");
        }

        procedimento.setAtivo(false);

        Procedimento procedimentoSalvo = procedimentoRepository.save(procedimento);
        log.info("Procedimento inativado com sucesso. ID: {}", id);
        return procedimentoSalvo;
    }

    @Transactional
    public Procedimento ativar(Long id) {
        log.info("Ativando procedimento ID: {}", id);

        Procedimento procedimento = buscarPorId(id);
        procedimento.setAtivo(true);

        Procedimento procedimentoSalvo = procedimentoRepository.save(procedimento);
        log.info("Procedimento ativado com sucesso. ID: {}", id);
        return procedimentoSalvo;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Tentando deletar procedimento ID: {}", id);

        Procedimento procedimento = buscarPorId(id);

        // Verificar se tem agendamentos
        long totalAgendamentos = agendamentoRepository.findByProcedimentoId(id).size();

        if (totalAgendamentos > 0) {
            throw new BusinessException("Não é possível deletar o procedimento. Existem " +
                    totalAgendamentos + " agendamento(s) vinculado(s). Considere inativar em vez de deletar.");
        }

        // Deletar associações com produtos
        procedimentoProdutoRepository.deleteByProcedimentoId(id);

        procedimentoRepository.deleteById(id);
        log.info("Procedimento deletado com sucesso. ID: {}", id);
    }

    @Transactional
    public void associarProdutos(Long procedimentoId, List<ProcedimentoProduto> produtos) {
        log.info("Associando {} produtos ao procedimento ID: {}", produtos.size(), procedimentoId);

        Procedimento procedimento = buscarPorId(procedimentoId);

        // Remover associações antigas
        procedimentoProdutoRepository.deleteByProcedimentoId(procedimentoId);

        // Criar novas associações
        for (ProcedimentoProduto pp : produtos) {
            pp.setProcedimento(procedimento);
            procedimentoProdutoRepository.save(pp);
        }

        log.info("Produtos associados com sucesso ao procedimento ID: {}", procedimentoId);
    }

    @Transactional(readOnly = true)
    public List<ProcedimentoProduto> buscarProdutosAssociados(Long procedimentoId) {
        log.debug("Buscando produtos associados ao procedimento ID: {}", procedimentoId);
        return procedimentoProdutoRepository.findByProcedimentoId(procedimentoId);
    }

    private void validarProcedimento(Procedimento procedimento) {
        if (procedimento.getNome() == null || procedimento.getNome().trim().isEmpty()) {
            throw new BusinessException("Nome do procedimento é obrigatório");
        }

        if (procedimento.getDuracaoMinutos() == null || procedimento.getDuracaoMinutos() < 1) {
            throw new BusinessException("Duração do procedimento deve ser maior que zero");
        }

        if (procedimento.getPreco() == null || procedimento.getPreco().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Preço não pode ser negativo");
        }
    }
}