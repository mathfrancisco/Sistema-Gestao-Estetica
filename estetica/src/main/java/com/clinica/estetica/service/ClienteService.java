package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.Cliente;
import com.clinica.estetica.model.enums.StatusCliente;
import com.clinica.estetica.repository.AgendamentoRepository;
import com.clinica.estetica.repository.ClienteRepository;
import com.clinica.estetica.util.CpfValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final AgendamentoRepository agendamentoRepository;

    @Transactional(readOnly = true)
    public List<Cliente> listarTodos() {
        log.debug("Listando todos os clientes");
        return clienteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Cliente> listarTodosPaginado(Pageable pageable) {
        log.debug("Listando clientes paginado: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return clienteRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Cliente buscarPorId(Long id) {
        log.debug("Buscando cliente por ID: {}", id);
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public Cliente buscarPorCpf(String cpf) {
        log.debug("Buscando cliente por CPF: {}", cpf);
        return clienteRepository.findByCpf(cpf)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com CPF: " + cpf));
    }

    @Transactional(readOnly = true)
    public Page<Cliente> buscarPorTexto(String busca, Pageable pageable) {
        log.debug("Buscando clientes por texto: {}", busca);
        return clienteRepository.buscarPorTexto(busca, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Cliente> buscarPorStatus(StatusCliente status, Pageable pageable) {
        log.debug("Buscando clientes por status: {}", status);
        return clienteRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public List<Cliente> listarAniversariantesdoDia() {
        LocalDate hoje = LocalDate.now();
        log.debug("Buscando aniversariantes do dia: {}", hoje);
        return clienteRepository.findAniversariantesdoDia(hoje.getMonthValue(), hoje.getDayOfMonth());
    }

    @Transactional(readOnly = true)
    public List<Cliente> listarClientesInativos(int diasSemVisita) {
        LocalDate dataLimite = LocalDate.now().minusDays(diasSemVisita);
        log.debug("Buscando clientes inativos desde: {}", dataLimite);
        return clienteRepository.findClientesInativos(dataLimite);
    }

    @Transactional
    public Cliente criar(Cliente cliente) {
        log.info("Criando novo cliente: {}", cliente.getNome());

        // Validar CPF
        if (!CpfValidator.isValid(cliente.getCpf())) {
            throw new BusinessException("CPF inválido: " + cliente.getCpf());
        }

        // Verificar se CPF já existe
        if (clienteRepository.existsByCpf(cliente.getCpf())) {
            throw new BusinessException("Já existe um cliente cadastrado com o CPF: " + cliente.getCpf());
        }

        // Definir valores padrão
        if (cliente.getStatus() == null) {
            cliente.setStatus(StatusCliente.ATIVO);
        }
        if (cliente.getDataCadastro() == null) {
            cliente.setDataCadastro(LocalDate.now());
        }
        if (cliente.getTotalGasto() == null) {
            cliente.setTotalGasto(BigDecimal.ZERO);
        }

        Cliente clienteSalvo = clienteRepository.save(cliente);
        log.info("Cliente criado com sucesso. ID: {}", clienteSalvo.getId());
        return clienteSalvo;
    }

    @Transactional
    public Cliente atualizar(Long id, Cliente clienteAtualizado) {
        log.info("Atualizando cliente ID: {}", id);

        Cliente clienteExistente = buscarPorId(id);

        // Validar CPF se foi alterado
        if (!clienteExistente.getCpf().equals(clienteAtualizado.getCpf())) {
            if (!CpfValidator.isValid(clienteAtualizado.getCpf())) {
                throw new BusinessException("CPF inválido: " + clienteAtualizado.getCpf());
            }
            if (clienteRepository.existsByCpfAndIdNot(clienteAtualizado.getCpf(), id)) {
                throw new BusinessException("Já existe outro cliente com o CPF: " + clienteAtualizado.getCpf());
            }
        }

        // Atualizar campos
        clienteExistente.setNome(clienteAtualizado.getNome());
        clienteExistente.setCpf(clienteAtualizado.getCpf());
        clienteExistente.setEmail(clienteAtualizado.getEmail());
        clienteExistente.setTelefone(clienteAtualizado.getTelefone());
        clienteExistente.setCelular(clienteAtualizado.getCelular());
        clienteExistente.setDataNascimento(clienteAtualizado.getDataNascimento());
        clienteExistente.setSexo(clienteAtualizado.getSexo());
        clienteExistente.setEndereco(clienteAtualizado.getEndereco());
        clienteExistente.setCidade(clienteAtualizado.getCidade());
        clienteExistente.setEstado(clienteAtualizado.getEstado());
        clienteExistente.setCep(clienteAtualizado.getCep());
        clienteExistente.setObservacoes(clienteAtualizado.getObservacoes());
        clienteExistente.setRestricoesAlergias(clienteAtualizado.getRestricoesAlergias());
        clienteExistente.setFotoPerfilUrl(clienteAtualizado.getFotoPerfilUrl());

        Cliente clienteSalvo = clienteRepository.save(clienteExistente);
        log.info("Cliente atualizado com sucesso. ID: {}", id);
        return clienteSalvo;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Tentando deletar cliente ID: {}", id);

        Cliente cliente = buscarPorId(id);

        // Query otimizada no repository
        long agendamentosFuturos = agendamentoRepository.countAgendamentosFuturos(id);

        if (agendamentosFuturos > 0) {
            throw new BusinessException("Não é possível deletar o cliente. Existem " +
                    agendamentosFuturos + " agendamento(s) futuro(s).");
        }

        clienteRepository.deleteById(id);
        log.info("Cliente deletado com sucesso. ID: {}", id);
    }

    @Transactional
    public Cliente inativar(Long id) {
        log.info("Inativando cliente ID: {}", id);

        Cliente cliente = buscarPorId(id);
        cliente.setStatus(StatusCliente.INATIVO);

        Cliente clienteSalvo = clienteRepository.save(cliente);
        log.info("Cliente inativado com sucesso. ID: {}", id);
        return clienteSalvo;
    }

    @Transactional
    public Cliente ativar(Long id) {
        log.info("Ativando cliente ID: {}", id);

        Cliente cliente = buscarPorId(id);
        cliente.setStatus(StatusCliente.ATIVO);

        Cliente clienteSalvo = clienteRepository.save(cliente);
        log.info("Cliente ativado com sucesso. ID: {}", id);
        return clienteSalvo;
    }

    @Transactional
    public void atualizarTotalGasto(Long id, BigDecimal valor) {
        log.debug("Atualizando total gasto do cliente ID: {} - Valor: {}", id, valor);

        Cliente cliente = buscarPorId(id);
        BigDecimal totalAtual = cliente.getTotalGasto() != null ? cliente.getTotalGasto() : BigDecimal.ZERO;
        cliente.setTotalGasto(totalAtual.add(valor));
        clienteRepository.save(cliente);

        log.debug("Total gasto atualizado. Novo total: {}", cliente.getTotalGasto());
    }

    @Transactional
    public void atualizarUltimaVisita(Long id, LocalDate data) {
        log.debug("Atualizando última visita do cliente ID: {} - Data: {}", id, data);

        Cliente cliente = buscarPorId(id);
        cliente.setUltimaVisita(data);
        clienteRepository.save(cliente);
    }

    @Transactional(readOnly = true)
    public Long contarClientesAtivos() {
        return clienteRepository.countByStatus(StatusCliente.ATIVO);
    }

    @Transactional(readOnly = true)
    public Long contarClientesNovos(int dias) {
        LocalDate dataInicio = LocalDate.now().minusDays(dias);
        return clienteRepository.countClientesNovos(dataInicio);
    }
}