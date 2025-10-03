package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.ContaReceber;
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
public interface ContaReceberRepository extends JpaRepository<ContaReceber, Long> {
    
    List<ContaReceber> findByClienteId(Long clienteId);
    
    Page<ContaReceber> findByStatus(StatusConta status, Pageable pageable);
    
    @Query("SELECT c FROM ContaReceber c WHERE " +
           "c.status = 'PENDENTE' AND " +
           "c.dataVencimento < CURRENT_DATE")
    List<ContaReceber> findContasVencidas();

    @Query("SELECT COUNT(c) FROM ContaReceber c WHERE " +
           "c.status = 'PENDENTE' AND " +
           "c.dataVencimento < CURRENT_DATE")
    Long countContasVencidas();

    @Query("SELECT c FROM ContaReceber c WHERE " +
           "c.dataVencimento >= :inicio AND c.dataVencimento <= :fim " +
           "ORDER BY c.dataVencimento")
    List<ContaReceber> findByPeriodo(@Param("inicio") LocalDate inicio,
                                     @Param("fim") LocalDate fim);

    @Query("SELECT SUM(c.valor) FROM ContaReceber c WHERE " +
           "c.status = 'PAGO' AND " +
           "c.dataPagamento >= :inicio AND c.dataPagamento <= :fim")
    BigDecimal somarRecebidoPorPeriodo(@Param("inicio") LocalDate inicio,
                                      @Param("fim") LocalDate fim);

    @Query("SELECT SUM(c.valor) FROM ContaReceber c WHERE " +
           "DATE(c.createdAt) = CURRENT_DATE")
    BigDecimal somarReceberHoje();

    @Query("SELECT SUM(c.valor) FROM ContaReceber c WHERE " +
           "MONTH(c.createdAt) = MONTH(CURRENT_DATE) AND " +
           "YEAR(c.createdAt) = YEAR(CURRENT_DATE)")
    BigDecimal somarReceberMes();
}
