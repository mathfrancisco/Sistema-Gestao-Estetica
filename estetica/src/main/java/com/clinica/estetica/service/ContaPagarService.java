package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.ContaPagar;
import com.clinica.estetica.model.enums.FormaPagamento;
import com.clinica.estetica.model.enums.StatusConta;
import com.clinica.estetica.repository.ContaPagarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContaPagarService {

    private final ContaPagarRepository contaPagarRepository;

    @Transactional(readOnly = true)
    public List<ContaPagar> listarTodas() {
        log.debug("Listando todas as contas a pagar");
        return contaPagarRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<ContaPagar> listarTodasPaginado(Pageable pageable) {
        log.debug("Listando contas a pagar paginado");
        return contaPagarRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public ContaPagar buscarPorId(Long id) {
        log.debug("Buscando conta a pagar por ID: {}", id);
        return contaPagarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta a pagar não encontrada com ID: " + id));
    }

    @Transactional(readOnly = true)
    public Page<ContaPagar> buscarPorStatus(StatusConta status, Pageable pageable) {
        log.debug("Buscando contas a pagar por status: {}", status);
        return contaPagarRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public List<ContaPagar> buscarPorCategoria(String categoria) {
        log.debug("Buscando contas a pagar por categoria: {}", categoria);
        return contaPagarRepository.findByCategoria(categoria);
    }

    @Transactional(readOnly = true)
    public List<ContaPagar> buscarContasVencidas() {
        log.debug("Buscando contas vencidas");
        return contaPagarRepository.findContasVencidas();
    }

    @Transactional(readOnly = true)
    public List<ContaPagar> buscarPorPeriodo(LocalDate inicio, LocalDate fim) {
        log.debug("Buscando contas a pagar no período: {} a {}", inicio, fim);
        return contaPagarRepository.findByPeriodo(inicio, fim);
    }

    @Transactional(readOnly = true)
    public BigDecimal somarPagoPorPeriodo(LocalDate inicio, LocalDate fim) {
        BigDecimal total = contaPagarRepository.somarPagoPorPeriodo(inicio, fim);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional
    public ContaPagar criar(ContaPagar conta) {
        log.info("Criando nova conta a pagar");

        validarConta(conta);

        if (conta.getStatus() == null) {
            conta.setStatus(StatusConta.PENDENTE);
        }

        // Atualizar status se já passou da data de vencimento
        if (conta.getDataVencimento().isBefore(LocalDate.now()) &&
                conta.getStatus() == StatusConta.PENDENTE) {
            conta.setStatus(StatusConta.VENCIDO);
        }

        ContaPagar contaSalva = contaPagarRepository.save(conta);
        log.info("Conta a pagar criada com sucesso. ID: {}", contaSalva.getId());
        return contaSalva;
    }

    @Transactional
    public ContaPagar atualizar(Long id, ContaPagar contaAtualizada) {
        log.info("Atualizando conta a pagar ID: {}", id);

        ContaPagar contaExistente = buscarPorId(id);
        validarConta(contaAtualizada);

        if (contaExistente.getStatus() == StatusConta.PAGO) {
            throw new BusinessException("Não é possível atualizar uma conta já paga");
        }

        contaExistente.setDescricao(contaAtualizada.getDescricao());
        contaExistente.setCategoria(contaAtualizada.getCategoria());
        contaExistente.setValor(contaAtualizada.getValor());
        contaExistente.setDataVencimento(contaAtualizada.getDataVencimento());
        contaExistente.setFormaPagamento(contaAtualizada.getFormaPagamento());
        contaExistente.setObservacoes(contaAtualizada.getObservacoes());

        ContaPagar contaSalva = contaPagarRepository.save(contaExistente);
        log.info("Conta a pagar atualizada com sucesso. ID: {}", id);
        return contaSalva;
    }

    @Transactional
    public ContaPagar registrarPagamento(Long id, LocalDate dataPagamento, FormaPagamento formaPagamento) {
        log.info("Registrando pagamento da conta a pagar ID: {}", id);

        ContaPagar conta = buscarPorId(id);

        if (conta.getStatus() == StatusConta.PAGO) {
            throw new BusinessException("Conta já está paga");
        }

        conta.setDataPagamento(dataPagamento);
        conta.setStatus(StatusConta.PAGO);

        if (formaPagamento != null) {
            conta.setFormaPagamento(formaPagamento);
        }

        ContaPagar contaSalva = contaPagarRepository.save(conta);
        log.info("Pagamento registrado com sucesso. ID: {}", id);
        return contaSalva;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Deletando conta a pagar ID: {}", id);

        ContaPagar conta = buscarPorId(id);

        if (conta.getStatus() == StatusConta.PAGO) {
            throw new BusinessException("Não é possível deletar uma conta já paga");
        }

        contaPagarRepository.deleteById(id);
        log.info("Conta a pagar deletada com sucesso. ID: {}", id);
    }

    @Transactional
    public void atualizarStatusVencidas() {
        log.info("Atualizando status das contas vencidas");

        List<ContaPagar> contas = contaPagarRepository.findAll();
        LocalDate hoje = LocalDate.now();

        for (ContaPagar conta : contas) {
            if (conta.getStatus() == StatusConta.PENDENTE &&
                    conta.getDataVencimento().isBefore(hoje)) {
                conta.setStatus(StatusConta.VENCIDO);
                contaPagarRepository.save(conta);
            }
        }

        log.info("Status das contas vencidas atualizado");
    }

    private void validarConta(ContaPagar conta) {
        if (conta.getDescricao() == null || conta.getDescricao().trim().isEmpty()) {
            throw new BusinessException("Descrição da conta é obrigatória");
        }

        if (conta.getValor() == null || conta.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Valor da conta deve ser maior que zero");
        }

        if (conta.getDataVencimento() == null) {
            throw new BusinessException("Data de vencimento é obrigatória");
        }
    }
}