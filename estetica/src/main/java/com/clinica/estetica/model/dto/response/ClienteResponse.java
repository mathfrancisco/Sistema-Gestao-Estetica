package com.clinica.estetica.model.dto.response;

import com.clinica.estetica.model.enums.StatusCliente;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteResponse {
    private Long id;
    private String nome;
    private String cpf;
    private String email;
    private String telefone;
    private String celular;
    private LocalDate dataNascimento;
    private Integer idade;
    private String sexo;
    private String endereco;
    private String cidade;
    private String estado;
    private String cep;
    private String observacoes;
    private String restricoesAlergias;
    private String fotoPerfilUrl;
    private StatusCliente status;
    private LocalDate dataCadastro;
    private LocalDate ultimaVisita;
    private BigDecimal totalGasto;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
