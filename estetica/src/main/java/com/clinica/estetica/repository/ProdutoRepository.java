package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.Produto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    
    Optional<Produto> findByCodigoBarras(String codigoBarras);
    
    List<Produto> findByAtivoTrue();
    
    Page<Produto> findByAtivo(Boolean ativo, Pageable pageable);
    
    @Query("SELECT p FROM Produto p WHERE " +
           "LOWER(p.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           "LOWER(p.marca) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           "LOWER(p.codigoBarras) LIKE LOWER(CONCAT('%', :busca, '%'))")
    Page<Produto> buscarPorTexto(@Param("busca") String busca, Pageable pageable);

    @Query("SELECT p FROM Produto p WHERE p.estoqueAtual < p.estoqueMinimo AND p.ativo = true")
    List<Produto> findProdutosEstoqueBaixo();

    @Query("SELECT COUNT(p) FROM Produto p WHERE p.estoqueAtual < p.estoqueMinimo AND p.ativo = true")
    Long countProdutosEstoqueBaixo();
}
