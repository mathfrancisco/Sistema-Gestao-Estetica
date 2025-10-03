package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.Produto;
import com.clinica.estetica.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    @Transactional(readOnly = true)
    public List<Produto> listarTodos() {
        log.debug("Listando todos os produtos");
        return produtoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Produto> listarTodosPaginado(Pageable pageable) {
        log.debug("Listando produtos paginado");
        return produtoRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Produto> listarAtivos() {
        log.debug("Listando produtos ativos");
        return produtoRepository.findByAtivoTrue();
    }

    @Transactional(readOnly = true)
    public Produto buscarPorId(Long id) {
        log.debug("Buscando produto por ID: {}", id);
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public Produto buscarPorCodigoBarras(String codigoBarras) {
        log.debug("Buscando produto por código de barras: {}", codigoBarras);
        return produtoRepository.findByCodigoBarras(codigoBarras)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produto não encontrado com código de barras: " + codigoBarras));
    }

    @Transactional(readOnly = true)
    public Page<Produto> buscarPorTexto(String busca, Pageable pageable) {
        log.debug("Buscando produtos por texto: {}", busca);
        return produtoRepository.buscarPorTexto(busca, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Produto> buscarPorAtivo(Boolean ativo, Pageable pageable) {
        log.debug("Buscando produtos por status ativo: {}", ativo);
        return produtoRepository.findByAtivo(ativo, pageable);
    }

    @Transactional(readOnly = true)
    public List<Produto> listarProdutosEstoqueBaixo() {
        log.debug("Listando produtos com estoque baixo");
        return produtoRepository.findProdutosEstoqueBaixo();
    }

    @Transactional
    public Produto criar(Produto produto) {
        log.info("Criando novo produto: {}", produto.getNome());

        validarProduto(produto);

        if (produto.getAtivo() == null) {
            produto.setAtivo(true);
        }

        if (produto.getEstoqueAtual() == null) {
            produto.setEstoqueAtual(BigDecimal.ZERO);
        }

        if (produto.getEstoqueMinimo() == null) {
            produto.setEstoqueMinimo(BigDecimal.ZERO);
        }

        Produto produtoSalvo = produtoRepository.save(produto);
        log.info("Produto criado com sucesso. ID: {}", produtoSalvo.getId());
        return produtoSalvo;
    }

    @Transactional
    public Produto atualizar(Long id, Produto produtoAtualizado) {
        log.info("Atualizando produto ID: {}", id);

        Produto produtoExistente = buscarPorId(id);
        validarProduto(produtoAtualizado);

        produtoExistente.setNome(produtoAtualizado.getNome());
        produtoExistente.setDescricao(produtoAtualizado.getDescricao());
        produtoExistente.setCodigoBarras(produtoAtualizado.getCodigoBarras());
        produtoExistente.setUnidadeMedida(produtoAtualizado.getUnidadeMedida());
        produtoExistente.setEstoqueMinimo(produtoAtualizado.getEstoqueMinimo());
        produtoExistente.setPrecoCusto(produtoAtualizado.getPrecoCusto());
        produtoExistente.setPrecoVenda(produtoAtualizado.getPrecoVenda());
        produtoExistente.setMarca(produtoAtualizado.getMarca());
        produtoExistente.setLinkCompra(produtoAtualizado.getLinkCompra());

        Produto produtoSalvo = produtoRepository.save(produtoExistente);
        log.info("Produto atualizado com sucesso. ID: {}", id);
        return produtoSalvo;
    }

    @Transactional
    public Produto inativar(Long id) {
        log.info("Inativando produto ID: {}", id);

        Produto produto = buscarPorId(id);
        produto.setAtivo(false);

        Produto produtoSalvo = produtoRepository.save(produto);
        log.info("Produto inativado com sucesso. ID: {}", id);
        return produtoSalvo;
    }

    @Transactional
    public Produto ativar(Long id) {
        log.info("Ativando produto ID: {}", id);

        Produto produto = buscarPorId(id);
        produto.setAtivo(true);

        Produto produtoSalvo = produtoRepository.save(produto);
        log.info("Produto ativado com sucesso. ID: {}", id);
        return produtoSalvo;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Deletando produto ID: {}", id);

        Produto produto = buscarPorId(id);

        // Verificar se tem estoque
        if (produto.getEstoqueAtual().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("Não é possível deletar produto com estoque. " +
                    "Atual: " + produto.getEstoqueAtual() + " " + produto.getUnidadeMedida());
        }

        produtoRepository.deleteById(id);
        log.info("Produto deletado com sucesso. ID: {}", id);
    }

    private void validarProduto(Produto produto) {
        if (produto.getNome() == null || produto.getNome().trim().isEmpty()) {
            throw new BusinessException("Nome do produto é obrigatório");
        }

        if (produto.getUnidadeMedida() == null || produto.getUnidadeMedida().trim().isEmpty()) {
            throw new BusinessException("Unidade de medida é obrigatória");
        }

        if (produto.getPrecoCusto() == null || produto.getPrecoCusto().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Preço de custo não pode ser negativo");
        }

        if (produto.getPrecoVenda() != null && produto.getPrecoVenda().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Preço de venda não pode ser negativo");
        }

        if (produto.getEstoqueMinimo() != null && produto.getEstoqueMinimo().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Estoque mínimo não pode ser negativo");
        }
    }
}