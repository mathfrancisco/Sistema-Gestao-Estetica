package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.Cliente;
import com.clinica.estetica.model.enums.StatusCliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByCpf(String cpf);
    
    boolean existsByCpf(String cpf);
    
    boolean existsByCpfAndIdNot(String cpf, Long id);

    List<Cliente> findByNomeContainingIgnoreCase(String nome);

    Page<Cliente> findByStatus(StatusCliente status, Pageable pageable);

    @Query("SELECT c FROM Cliente c WHERE " +
           "LOWER(c.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           "LOWER(c.cpf) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :busca, '%'))")
    Page<Cliente> buscarPorTexto(@Param("busca") String busca, Pageable pageable);

    @Query("SELECT c FROM Cliente c WHERE " +
           "MONTH(c.dataNascimento) = :mes AND " +
           "DAY(c.dataNascimento) = :dia AND " +
           "c.status = 'ATIVO'")
    List<Cliente> findAniversariantesdoDia(@Param("mes") int mes, @Param("dia") int dia);

    @Query("SELECT c FROM Cliente c WHERE " +
           "c.ultimaVisita < :dataLimite AND " +
           "c.status = 'ATIVO' " +
           "ORDER BY c.ultimaVisita DESC")
    List<Cliente> findClientesInativos(@Param("dataLimite") LocalDate dataLimite);

    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.status = :status")
    Long countByStatus(@Param("status") StatusCliente status);

    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.dataCadastro >= :dataInicio")
    Long countClientesNovos(@Param("dataInicio") LocalDate dataInicio);
}
