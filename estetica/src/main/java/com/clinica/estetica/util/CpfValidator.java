package com.clinica.estetica.util;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@UtilityClass
public class CpfValidator {

    /**
     * Valida se um CPF é válido
     *
     * @param cpf CPF com ou sem formatação (123.456.789-00 ou 12345678900)
     * @return true se válido, false caso contrário
     */
    public static boolean isValid(String cpf) {
        if (cpf == null || cpf.trim().isEmpty()) {
            log.debug("CPF nulo ou vazio");
            return false;
        }

        // Remove formatação (pontos e traços)
        String cpfNumeros = cpf.replaceAll("[^0-9]", "");

        // Verifica se tem 11 dígitos
        if (cpfNumeros.length() != 11) {
            log.debug("CPF não possui 11 dígitos: {}", cpfNumeros.length());
            return false;
        }

        // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
        if (cpfNumeros.matches("(\\d)\\1{10}")) {
            log.debug("CPF com todos os dígitos iguais");
            return false;
        }

        // Calcula o primeiro dígito verificador
        int soma = 0;
        for (int i = 0; i < 9; i++) {
            soma += Character.getNumericValue(cpfNumeros.charAt(i)) * (10 - i);
        }
        int primeiroDigito = 11 - (soma % 11);
        if (primeiroDigito >= 10) {
            primeiroDigito = 0;
        }

        // Verifica o primeiro dígito verificador
        if (primeiroDigito != Character.getNumericValue(cpfNumeros.charAt(9))) {
            log.debug("Primeiro dígito verificador inválido");
            return false;
        }

        // Calcula o segundo dígito verificador
        soma = 0;
        for (int i = 0; i < 10; i++) {
            soma += Character.getNumericValue(cpfNumeros.charAt(i)) * (11 - i);
        }
        int segundoDigito = 11 - (soma % 11);
        if (segundoDigito >= 10) {
            segundoDigito = 0;
        }

        // Verifica o segundo dígito verificador
        if (segundoDigito != Character.getNumericValue(cpfNumeros.charAt(10))) {
            log.debug("Segundo dígito verificador inválido");
            return false;
        }

        log.debug("CPF válido: {}", cpf);
        return true;
    }

    /**
     * Formata um CPF sem formatação para o padrão 123.456.789-00
     *
     * @param cpf CPF sem formatação (11 dígitos)
     * @return CPF formatado
     */
    public static String format(String cpf) {
        if (cpf == null || cpf.trim().isEmpty()) {
            return cpf;
        }

        // Remove formatação existente
        String cpfNumeros = cpf.replaceAll("[^0-9]", "");

        // Verifica se tem 11 dígitos
        if (cpfNumeros.length() != 11) {
            return cpf; // Retorna o original se não tiver 11 dígitos
        }

        // Formata: 123.456.789-00
        return cpfNumeros.substring(0, 3) + "." +
                cpfNumeros.substring(3, 6) + "." +
                cpfNumeros.substring(6, 9) + "-" +
                cpfNumeros.substring(9, 11);
    }

    /**
     * Remove a formatação do CPF, mantendo apenas os números
     *
     * @param cpf CPF com formatação
     * @return CPF sem formatação (apenas números)
     */
    public static String unformat(String cpf) {
        if (cpf == null || cpf.trim().isEmpty()) {
            return cpf;
        }
        return cpf.replaceAll("[^0-9]", "");
    }

    /**
     * Valida e formata o CPF
     *
     * @param cpf CPF com ou sem formatação
     * @return CPF formatado se válido, null se inválido
     */
    public static String validateAndFormat(String cpf) {
        if (isValid(cpf)) {
            return format(cpf);
        }
        return null;
    }
}