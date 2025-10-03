package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.ContaPagar;
import com.clinica.estetica.model.enums.StatusConta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContaPagarRepository extends JpaRepository<ContaPagar, Long> {
    
    Page<ContaPagar> findByStatus(StatusConta status, Pageable pageable);
    
    List<ContaPagar> findByCategoria(String categoria);
    
    @Query("SELECT c FROM ContaPagar c WHERE " +
           "c.status = 'PENDENTE' AND " +
           "c.dataVencimento < CURRENT_DATE")
    List<ContaPagar> findContasVencidas();

    @Query("SELECT c FROM ContaPagar c WHERE " +
           "c.dataVencimento >= :inicio AND c.dataVencimento <= :fim " +
           "ORDER BY c.dataVencimento")
    List<ContaPagar> findByPeriodo(@Param("inicio") LocalDate inicio,
                                   @Param("fim") LocalDate fim);

    @Query("SELECT SUM(c.valor) FROM ContaPagar c WHERE " +
           "c.status = 'PAGO' AND " +
           "c.dataPagamento >= :inicio AND c.dataPagamento <= :fim")
    BigDecimal somarPagoPorPeriodo(@Param("inicio") LocalDate inicio,
                                  @Param("fim") LocalDate fim);
}
