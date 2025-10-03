package com.clinica.estetica.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 3, max = 200, message = "Nome deve ter entre 3 e 200 caracteres")
    private String nome;

    @NotBlank(message = "CPF é obrigatório")
    @Pattern(regexp = "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", message = "CPF deve estar no formato XXX.XXX.XXX-XX")
    private String cpf;

    @Email(message = "Email inválido")
    private String email;

    private String telefone;

    private String celular;

    @Past(message = "Data de nascimento deve ser no passado")
    private LocalDate dataNascimento;

    @Pattern(regexp = "[MF]", message = "Sexo deve ser M ou F")
    private String sexo;

    private String endereco;

    private String cidade;

    @Size(max = 2, message = "Estado deve ter 2 caracteres")
    private String estado;

    @Pattern(regexp = "\\d{5}-\\d{3}", message = "CEP deve estar no formato XXXXX-XXX")
    private String cep;

    private String observacoes;

    private String restricoesAlergias;

    private String fotoPerfilUrl;
}