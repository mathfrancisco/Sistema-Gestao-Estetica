package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByAtivoTrue();
    List<Categoria> findByNomeContainingIgnoreCase(String nome);
}
