package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.MovimentacaoEstoque;
import com.clinica.estetica.model.entity.Produto;
import com.clinica.estetica.model.enums.TipoMovimentacao;
import com.clinica.estetica.repository.MovimentacaoEstoqueRepository;
import com.clinica.estetica.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EstoqueService {

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;

    @Transactional(readOnly = true)
    public List<Produto> listarProdutosEstoqueBaixo() {
        log.debug("Listando produtos com estoque baixo");
        return produtoRepository.findProdutosEstoqueBaixo();
    }

    @Transactional(readOnly = true)
    public Long contarProdutosEstoqueBaixo() {
        return produtoRepository.countProdutosEstoqueBaixo();
    }

    @Transactional(readOnly = true)
    public void validarEstoqueDisponivel(Long produtoId, BigDecimal quantidade) {
        log.debug("Validando estoque disponível do produto ID: {} - Quantidade: {}", produtoId, quantidade);

        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ID: " + produtoId));

        if (produto.getEstoqueAtual().compareTo(quantidade) < 0) {
            throw new BusinessException(String.format(
                    "Estoque insuficiente para o produto '%s'. Disponível: %.2f %s, Necessário: %.2f %s",
                    produto.getNome(),
                    produto.getEstoqueAtual(),
                    produto.getUnidadeMedida(),
                    quantidade,
                    produto.getUnidadeMedida()
            ));
        }
    }

    @Transactional
    public MovimentacaoEstoque registrarEntrada(Long produtoId, BigDecimal quantidade,
                                                BigDecimal valorUnitario, String motivo) {
        log.info("Registrando entrada de estoque - Produto ID: {} - Quantidade: {}", produtoId, quantidade);

        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ID: " + produtoId));

        validarQuantidade(quantidade);

        BigDecimal quantidadeAnterior = produto.getEstoqueAtual();
        BigDecimal quantidadeNova = quantidadeAnterior.add(quantidade);

        // Atualizar estoque do produto
        produto.setEstoqueAtual(quantidadeNova);
        produtoRepository.save(produto);

        // Criar movimentação
        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setProduto(produto);
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setQuantidadeAnterior(quantidadeAnterior);
        movimentacao.setQuantidadeNova(quantidadeNova);
        movimentacao.setValorUnitario(valorUnitario);
        movimentacao.setMotivo(motivo);
        movimentacao.setDataMovimentacao(LocalDateTime.now());

        MovimentacaoEstoque movimentacaoSalva = movimentacaoRepository.save(movimentacao);

        log.info("Entrada de estoque registrada com sucesso. Movimentação ID: {}", movimentacaoSalva.getId());
        return movimentacaoSalva;
    }

    @Transactional
    public MovimentacaoEstoque registrarSaida(Long produtoId, BigDecimal quantidade,
                                              String motivo, Long agendamentoId) {
        log.info("Registrando saída de estoque - Produto ID: {} - Quantidade: {}", produtoId, quantidade);

        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ID: " + produtoId));

        validarQuantidade(quantidade);

        BigDecimal quantidadeAnterior = produto.getEstoqueAtual();

        // Validar se tem estoque suficiente
        if (quantidadeAnterior.compareTo(quantidade) < 0) {
            throw new BusinessException(String.format(
                    "Estoque insuficiente para o produto '%s'. Disponível: %.2f %s, Solicitado: %.2f %s",
                    produto.getNome(),
                    quantidadeAnterior,
                    produto.getUnidadeMedida(),
                    quantidade,
                    produto.getUnidadeMedida()
            ));
        }

        BigDecimal quantidadeNova = quantidadeAnterior.subtract(quantidade);

        // Atualizar estoque do produto
        produto.setEstoqueAtual(quantidadeNova);
        produtoRepository.save(produto);

        // Criar movimentação
        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setProduto(produto);
        movimentacao.setTipo(TipoMovimentacao.SAIDA);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setQuantidadeAnterior(quantidadeAnterior);
        movimentacao.setQuantidadeNova(quantidadeNova);
        movimentacao.setValorUnitario(produto.getPrecoCusto());
        movimentacao.setMotivo(motivo);
        movimentacao.setDataMovimentacao(LocalDateTime.now());

        if (agendamentoId != null) {
            // Criar objeto Agendamento apenas com ID para evitar carregar toda a entidade
            com.clinica.estetica.model.entity.Agendamento agendamento =
                    new com.clinica.estetica.model.entity.Agendamento();
            agendamento.setId(agendamentoId);
            movimentacao.setAgendamento(agendamento);
        }

        MovimentacaoEstoque movimentacaoSalva = movimentacaoRepository.save(movimentacao);

        log.info("Saída de estoque registrada com sucesso. Movimentação ID: {}", movimentacaoSalva.getId());
        return movimentacaoSalva;
    }

    @Transactional
    public MovimentacaoEstoque registrarAjuste(Long produtoId, BigDecimal novaQuantidade, String motivo) {
        log.info("Registrando ajuste de estoque - Produto ID: {} - Nova Quantidade: {}", produtoId, novaQuantidade);

        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ID: " + produtoId));

        validarQuantidade(novaQuantidade);

        BigDecimal quantidadeAnterior = produto.getEstoqueAtual();
        BigDecimal diferenca = novaQuantidade.subtract(quantidadeAnterior);

        // Atualizar estoque do produto
        produto.setEstoqueAtual(novaQuantidade);
        produtoRepository.save(produto);

        // Criar movimentação
        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setProduto(produto);
        movimentacao.setTipo(TipoMovimentacao.AJUSTE);
        movimentacao.setQuantidade(diferenca.abs());
        movimentacao.setQuantidadeAnterior(quantidadeAnterior);
        movimentacao.setQuantidadeNova(novaQuantidade);
        movimentacao.setValorUnitario(produto.getPrecoCusto());
        movimentacao.setMotivo(motivo != null ? motivo : "Ajuste de estoque");
        movimentacao.setDataMovimentacao(LocalDateTime.now());

        MovimentacaoEstoque movimentacaoSalva = movimentacaoRepository.save(movimentacao);

        log.info("Ajuste de estoque registrado com sucesso. Movimentação ID: {}", movimentacaoSalva.getId());
        return movimentacaoSalva;
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoEstoque> buscarMovimentacoesPorProduto(Long produtoId) {
        log.debug("Buscando movimentações do produto ID: {}", produtoId);
        return movimentacaoRepository.findByProdutoId(produtoId);
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoEstoque> buscarMovimentacoesPorPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        log.debug("Buscando movimentações no período: {} a {}", inicio, fim);
        return movimentacaoRepository.findByPeriodo(inicio, fim);
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoEstoque> buscarMovimentacoesPorProdutoEPeriodo(Long produtoId,
                                                                           LocalDateTime inicio,
                                                                           LocalDateTime fim) {
        log.debug("Buscando movimentações do produto ID: {} no período: {} a {}", produtoId, inicio, fim);
        return movimentacaoRepository.findByProdutoIdAndPeriodo(produtoId, inicio, fim);
    }

    private void validarQuantidade(BigDecimal quantidade) {
        if (quantidade == null || quantidade.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Quantidade deve ser maior que zero");
        }
    }
}