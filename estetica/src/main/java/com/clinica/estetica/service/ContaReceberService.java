package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.Agendamento;
import com.clinica.estetica.model.entity.ContaReceber;
import com.clinica.estetica.model.enums.FormaPagamento;
import com.clinica.estetica.model.enums.StatusConta;
import com.clinica.estetica.repository.ContaReceberRepository;
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
public class ContaReceberService {

    private final ContaReceberRepository contaReceberRepository;
    private final ClienteService clienteService;

    @Transactional(readOnly = true)
    public List<ContaReceber> listarTodas() {
        log.debug("Listando todas as contas a receber");
        return contaReceberRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<ContaReceber> listarTodasPaginado(Pageable pageable) {
        log.debug("Listando contas a receber paginado");
        return contaReceberRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public ContaReceber buscarPorId(Long id) {
        log.debug("Buscando conta a receber por ID: {}", id);
        return contaReceberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta a receber não encontrada com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<ContaReceber> buscarPorCliente(Long clienteId) {
        log.debug("Buscando contas a receber do cliente ID: {}", clienteId);
        return contaReceberRepository.findByClienteId(clienteId);
    }

    @Transactional(readOnly = true)
    public Page<ContaReceber> buscarPorStatus(StatusConta status, Pageable pageable) {
        log.debug("Buscando contas a receber por status: {}", status);
        return contaReceberRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public List<ContaReceber> buscarContasVencidas() {
        log.debug("Buscando contas vencidas");
        return contaReceberRepository.findContasVencidas();
    }

    @Transactional(readOnly = true)
    public Long contarContasVencidas() {
        return contaReceberRepository.countContasVencidas();
    }

    @Transactional(readOnly = true)
    public List<ContaReceber> buscarPorPeriodo(LocalDate inicio, LocalDate fim) {
        log.debug("Buscando contas a receber no período: {} a {}", inicio, fim);
        return contaReceberRepository.findByPeriodo(inicio, fim);
    }

    @Transactional(readOnly = true)
    public BigDecimal somarRecebidoPorPeriodo(LocalDate inicio, LocalDate fim) {
        BigDecimal total = contaReceberRepository.somarRecebidoPorPeriodo(inicio, fim);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal somarReceberHoje() {
        BigDecimal total = contaReceberRepository.somarReceberHoje();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal somarReceberMes() {
        BigDecimal total = contaReceberRepository.somarReceberMes();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional
    public ContaReceber criar(ContaReceber conta) {
        log.info("Criando nova conta a receber");

        validarConta(conta);

        if (conta.getStatus() == null) {
            conta.setStatus(StatusConta.PENDENTE);
        }

        // Atualizar status se já passou da data de vencimento
        if (conta.getDataVencimento().isBefore(LocalDate.now()) &&
                conta.getStatus() == StatusConta.PENDENTE) {
            conta.setStatus(StatusConta.VENCIDO);
        }

        ContaReceber contaSalva = contaReceberRepository.save(conta);
        log.info("Conta a receber criada com sucesso. ID: {}", contaSalva.getId());
        return contaSalva;
    }

    @Transactional
    public ContaReceber criarDeAgendamento(Agendamento agendamento) {
        log.info("Criando conta a receber do agendamento ID: {}", agendamento.getId());

        ContaReceber conta = new ContaReceber();
        conta.setCliente(agendamento.getCliente());
        conta.setAgendamento(agendamento);
        conta.setDescricao(String.format("%s - %s",
                agendamento.getProcedimento().getNome(),
                agendamento.getCliente().getNome()));
        conta.setValor(agendamento.getValorTotal());
        conta.setDataVencimento(agendamento.getDataHora().toLocalDate());
        conta.setStatus(StatusConta.PENDENTE);

        if (agendamento.getFormaPagamento() != null) {
            conta.setFormaPagamento(agendamento.getFormaPagamento());
        }

        return criar(conta);
    }

    @Transactional
    public ContaReceber atualizar(Long id, ContaReceber contaAtualizada) {
        log.info("Atualizando conta a receber ID: {}", id);

        ContaReceber contaExistente = buscarPorId(id);
        validarConta(contaAtualizada);

        if (contaExistente.getStatus() == StatusConta.PAGO) {
            throw new BusinessException("Não é possível atualizar uma conta já paga");
        }

        contaExistente.setDescricao(contaAtualizada.getDescricao());
        contaExistente.setValor(contaAtualizada.getValor());
        contaExistente.setDataVencimento(contaAtualizada.getDataVencimento());
        contaExistente.setFormaPagamento(contaAtualizada.getFormaPagamento());
        contaExistente.setObservacoes(contaAtualizada.getObservacoes());

        ContaReceber contaSalva = contaReceberRepository.save(contaExistente);
        log.info("Conta a receber atualizada com sucesso. ID: {}", id);
        return contaSalva;
    }

    @Transactional
    public ContaReceber registrarPagamento(Long id, LocalDate dataPagamento,  FormaPagamento formaPagamento) {
        log.info("Registrando pagamento da conta a receber ID: {}", id);

        ContaReceber conta = buscarPorId(id);

        if (conta.getStatus() == StatusConta.PAGO) {
            throw new BusinessException("Conta já está paga");
        }

        conta.setDataPagamento(dataPagamento);
        conta.setStatus(StatusConta.PAGO);

        if (formaPagamento != null) {
            conta.setFormaPagamento(formaPagamento);
        }

        ContaReceber contaSalva = contaReceberRepository.save(conta);

        // Atualizar total gasto do cliente
        clienteService.atualizarTotalGasto(conta.getCliente().getId(), conta.getValor());

        log.info("Pagamento registrado com sucesso. ID: {}", id);
        return contaSalva;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Deletando conta a receber ID: {}", id);

        ContaReceber conta = buscarPorId(id);

        if (conta.getStatus() == StatusConta.PAGO) {
            throw new BusinessException("Não é possível deletar uma conta já paga");
        }

        contaReceberRepository.deleteById(id);
        log.info("Conta a receber deletada com sucesso. ID: {}", id);
    }

    @Transactional
    public void atualizarStatusVencidas() {
        log.info("Atualizando status das contas vencidas");

        List<ContaReceber> contas = contaReceberRepository.findAll();
        LocalDate hoje = LocalDate.now();

        for (ContaReceber conta : contas) {
            if (conta.getStatus() == StatusConta.PENDENTE &&
                    conta.getDataVencimento().isBefore(hoje)) {
                conta.setStatus(StatusConta.VENCIDO);
                contaReceberRepository.save(conta);
            }
        }

        log.info("Status das contas vencidas atualizado");
    }

    private void validarConta(ContaReceber conta) {
        if (conta.getDescricao() == null || conta.getDescricao().trim().isEmpty()) {
            throw new BusinessException("Descrição da conta é obrigatória");
        }

        if (conta.getValor() == null || conta.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Valor da conta deve ser maior que zero");
        }

        if (conta.getDataVencimento() == null) {
            throw new BusinessException("Data de vencimento é obrigatória");
        }

        if (conta.getCliente() == null || conta.getCliente().getId() == null) {
            throw new BusinessException("Cliente é obrigatório");
        }
    }
}