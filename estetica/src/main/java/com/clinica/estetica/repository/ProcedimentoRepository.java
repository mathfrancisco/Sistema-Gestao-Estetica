package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.Procedimento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcedimentoRepository extends JpaRepository<Procedimento, Long> {
    
    List<Procedimento> findByAtivoTrue();
    
    Page<Procedimento> findByAtivo(Boolean ativo, Pageable pageable);
    
    List<Procedimento> findByCategoriaId(Long categoriaId);
    
    @Query("SELECT p FROM Procedimento p WHERE " +
           "LOWER(p.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           "LOWER(p.descricao) LIKE LOWER(CONCAT('%', :busca, '%'))")
    Page<Procedimento> buscarPorTexto(@Param("busca") String busca, Pageable pageable);

    @Query("SELECT p, COUNT(a) as total FROM Procedimento p " +
           "LEFT JOIN p.agendamentos a " +
           "WHERE a.status = 'REALIZADO' " +
           "GROUP BY p.id " +
           "ORDER BY total DESC")
    List<Procedimento> findTopProcedimentos(Pageable pageable);
}
