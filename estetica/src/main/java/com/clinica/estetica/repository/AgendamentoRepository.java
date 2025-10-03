package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.Agendamento;
import com.clinica.estetica.model.enums.StatusAgendamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    
    List<Agendamento> findByClienteId(Long clienteId);
    
    List<Agendamento> findByProcedimentoId(Long procedimentoId);
    
    List<Agendamento> findByEsteticista(String esteticista);
    
    Page<Agendamento> findByStatus(StatusAgendamento status, Pageable pageable);
    
    @Query("SELECT a FROM Agendamento a WHERE " +
           "a.dataHora >= :inicio AND a.dataHora < :fim " +
           "ORDER BY a.dataHora")
    List<Agendamento> findByPeriodo(@Param("inicio") LocalDateTime inicio, 
                                    @Param("fim") LocalDateTime fim);

    @Query("SELECT a FROM Agendamento a WHERE " +
           "a.esteticista = :esteticista AND " +
           "a.dataHora >= :inicio AND a.dataHora < :fim AND " +
           "a.status != 'CANCELADO' " +
           "ORDER BY a.dataHora")
    List<Agendamento> findByEsteticistaPeriodo(@Param("esteticista") String esteticista,
                                               @Param("inicio") LocalDateTime inicio,
                                               @Param("fim") LocalDateTime fim);

    @Query("SELECT a FROM Agendamento a WHERE " +
           "DATE(a.dataHora) = CURRENT_DATE AND " +
           "a.status != 'CANCELADO' " +
           "ORDER BY a.dataHora")
    List<Agendamento> findAgendamentosHoje();

    @Query("SELECT COUNT(a) FROM Agendamento a WHERE " +
           "DATE(a.dataHora) = CURRENT_DATE AND " +
           "a.status != 'CANCELADO'")
    Long countAgendamentosHoje();

    @Query("SELECT COUNT(a) FROM Agendamento a WHERE " +
           "MONTH(a.dataHora) = MONTH(CURRENT_DATE) AND " +
           "YEAR(a.dataHora) = YEAR(CURRENT_DATE) AND " +
           "a.status != 'CANCELADO'")
    Long countAgendamentosMes();

    @Query("SELECT a FROM Agendamento a WHERE " +
           "a.dataHora > CURRENT_TIMESTAMP AND " +
           "a.confirmado = false AND " +
           "a.lembreteEnviado = false AND " +
           "a.status = 'AGENDADO'")
    List<Agendamento> findAgendamentosSemLembrete();

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
           "FROM Agendamento a WHERE " +
           "a.esteticista = :esteticista AND " +
           "a.status != 'CANCELADO' AND " +
           "((a.dataHora <= :fim AND a.dataHoraFim > :inicio))")
    boolean existsConflito(@Param("esteticista") String esteticista,
                          @Param("inicio") LocalDateTime inicio,
                          @Param("fim") LocalDateTime fim);
}
