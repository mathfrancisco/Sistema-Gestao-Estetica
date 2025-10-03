package com.clinica.estetica.service;

import com.clinica.estetica.exception.BusinessException;
import com.clinica.estetica.exception.ResourceNotFoundException;
import com.clinica.estetica.model.entity.Agendamento;
import com.clinica.estetica.model.entity.Cliente;
import com.clinica.estetica.model.entity.Procedimento;
import com.clinica.estetica.model.entity.ProcedimentoProduto;
import com.clinica.estetica.model.enums.StatusAgendamento;
import com.clinica.estetica.model.enums.StatusCliente;
import com.clinica.estetica.repository.AgendamentoRepository;
import com.clinica.estetica.repository.ProcedimentoProdutoRepository;
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
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteService clienteService;
    private final ProcedimentoService procedimentoService;
    private final EstoqueService estoqueService;
    private final ContaReceberService contaReceberService;
    private final ProcedimentoProdutoRepository procedimentoProdutoRepository;
    private final NotificacaoService notificacaoService;

    @Transactional(readOnly = true)
    public List<Agendamento> listarTodos() {
        log.debug("Listando todos os agendamentos");
        return agendamentoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Agendamento> listarTodosPaginado(Pageable pageable) {
        log.debug("Listando agendamentos paginado");
        return agendamentoRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Agendamento buscarPorId(Long id) {
        log.debug("Buscando agendamento por ID: {}", id);
        return agendamentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarPorCliente(Long clienteId) {
        log.debug("Buscando agendamentos do cliente ID: {}", clienteId);
        return agendamentoRepository.findByClienteId(clienteId);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarPorProcedimento(Long procedimentoId) {
        log.debug("Buscando agendamentos do procedimento ID: {}", procedimentoId);
        return agendamentoRepository.findByProcedimentoId(procedimentoId);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarPorEsteticista(String esteticista) {
        log.debug("Buscando agendamentos da esteticista: {}", esteticista);
        return agendamentoRepository.findByEsteticista(esteticista);
    }

    @Transactional(readOnly = true)
    public Page<Agendamento> buscarPorStatus(StatusAgendamento status, Pageable pageable) {
        log.debug("Buscando agendamentos por status: {}", status);
        return agendamentoRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarPorPeriodo(LocalDateTime inicio, LocalDateTime fim) {
        log.debug("Buscando agendamentos no período: {} a {}", inicio, fim);
        return agendamentoRepository.findByPeriodo(inicio, fim);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarPorData(LocalDate data) {
        LocalDateTime inicio = data.atStartOfDay();
        LocalDateTime fim = data.plusDays(1).atStartOfDay();
        return buscarPorPeriodo(inicio, fim);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarAgendamentosHoje() {
        log.debug("Buscando agendamentos de hoje");
        return agendamentoRepository.findAgendamentosHoje();
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarPorEsteticistaPeriodo(String esteticista, LocalDateTime inicio, LocalDateTime fim) {
        log.debug("Buscando agendamentos da esteticista {} no período: {} a {}", esteticista, inicio, fim);
        return agendamentoRepository.findByEsteticistaPeriodo(esteticista, inicio, fim);
    }

    @Transactional(readOnly = true)
    public boolean verificarDisponibilidade(String esteticista, LocalDateTime inicio, LocalDateTime fim) {
        log.debug("Verificando disponibilidade da esteticista {} de {} a {}", esteticista, inicio, fim);
        return !agendamentoRepository.existsConflito(esteticista, inicio, fim);
    }

    /**
     * Cria agendamento DIRETO (já aprovado) - Para recepção/telefone
     */
    @Transactional
    public Agendamento criarAgendamentoDireto(Agendamento agendamento) {
        log.info("Criando agendamento DIRETO (já aprovado)");

        validarAgendamento(agendamento);
        validarClienteAtivo(agendamento.getCliente().getId());
        validarProcedimentoAtivo(agendamento.getProcedimento().getId());

        Procedimento procedimento = procedimentoService.buscarPorId(agendamento.getProcedimento().getId());

        // Verificar conflito de horário
        if (!verificarDisponibilidade(agendamento.getEsteticista(),
                agendamento.getDataHora(),
                agendamento.getDataHoraFim())) {
            throw new BusinessException("Horário já ocupado para esta esteticista");
        }

        // Validar estoque disponível
        validarEstoqueProdutos(procedimento.getId());

        // Calcular valores
        calcularValores(agendamento, procedimento);

        // Status AGENDADO (já aprovado)
        agendamento.setStatus(StatusAgendamento.AGENDADO);
        agendamento.setConfirmado(false);
        agendamento.setLembreteEnviado(false);
        agendamento.setPago(false);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        // Criar conta a receber
        contaReceberService.criarDeAgendamento(agendamentoSalvo);

        // Enviar confirmação ao cliente
        notificacaoService.enviarConfirmacaoAgendamento(agendamentoSalvo);

        log.info("Agendamento direto criado com sucesso. ID: {}", agendamentoSalvo.getId());
        return agendamentoSalvo;
    }

    /**
     * Cria solicitação de agendamento (PENDENTE) - Para app/site cliente
     */
    @Transactional
    public Agendamento solicitarAgendamento(Agendamento agendamento) {
        log.info("Criando SOLICITAÇÃO de agendamento (aguardando aprovação)");

        validarAgendamento(agendamento);
        validarClienteAtivo(agendamento.getCliente().getId());
        validarProcedimentoAtivo(agendamento.getProcedimento().getId());

        Procedimento procedimento = procedimentoService.buscarPorId(agendamento.getProcedimento().getId());

        // Verificar conflito de horário (alerta, mas permite criar)
        boolean horarioDisponivel = verificarDisponibilidade(
                agendamento.getEsteticista(),
                agendamento.getDataHora(),
                agendamento.getDataHoraFim()
        );

        if (!horarioDisponivel) {
            log.warn("Horário solicitado já está ocupado. Esteticista precisará reprovar ou sugerir outro horário.");
        }

        // Calcular valores
        calcularValores(agendamento, procedimento);

        // Status PENDENTE (aguardando aprovação)
        agendamento.setStatus(StatusAgendamento.PENDENTE);
        agendamento.setConfirmado(false);
        agendamento.setLembreteEnviado(false);
        agendamento.setPago(false);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        // Notificar esteticista sobre nova solicitação
        notificacaoService.notificarEsteticistaNovoAgendamento(agendamentoSalvo);

        // Notificar cliente que solicitação foi recebida
        notificacaoService.enviarConfirmacaoSolicitacao(agendamentoSalvo);

        log.info("Solicitação de agendamento criada com sucesso. ID: {}", agendamentoSalvo.getId());
        return agendamentoSalvo;
    }

    /**
     * Aprova um agendamento pendente
     */
    @Transactional
    public Agendamento aprovar(Long id) {
        log.info("Aprovando agendamento ID: {}", id);

        Agendamento agendamento = buscarPorId(id);

        if (!agendamento.getStatus().podeAprovar()) {
            throw new BusinessException("Apenas agendamentos pendentes podem ser aprovados. Status atual: " +
                    agendamento.getStatus().getNome());
        }

        // Verificar conflito de horário novamente
        if (!verificarDisponibilidade(agendamento.getEsteticista(),
                agendamento.getDataHora(),
                agendamento.getDataHoraFim())) {
            throw new BusinessException("Horário não está mais disponível. Sugira outro horário ao cliente.");
        }

        // Validar estoque disponível
        validarEstoqueProdutos(agendamento.getProcedimento().getId());

        agendamento.setStatus(StatusAgendamento.AGENDADO);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        // Criar conta a receber
        contaReceberService.criarDeAgendamento(agendamentoSalvo);

        // Notificar cliente sobre aprovação
        notificacaoService.enviarAprovacaoAgendamento(agendamentoSalvo);

        log.info("Agendamento aprovado com sucesso. ID: {}", id);
        return agendamentoSalvo;
    }

    /**
     * Reprova e sugere novo horário
     */
    @Transactional
    public Agendamento reprovarESugerirNovoHorario(Long id, LocalDateTime novaDataHora, String motivo) {
        log.info("Reprovando agendamento ID: {} e sugerindo novo horário: {}", id, novaDataHora);

        Agendamento agendamento = buscarPorId(id);

        if (!agendamento.getStatus().podeAprovar()) {
            throw new BusinessException("Apenas agendamentos pendentes podem ser reprovados");
        }

        // Verificar disponibilidade no novo horário
        LocalDateTime novaDataHoraFim = novaDataHora.plusMinutes(agendamento.getDuracaoMinutos());

        if (!verificarDisponibilidade(agendamento.getEsteticista(), novaDataHora, novaDataHoraFim)) {
            throw new BusinessException("Novo horário sugerido não está disponível");
        }

        // Atualizar horário
        agendamento.setDataHora(novaDataHora);
        agendamento.setDataHoraFim(novaDataHoraFim);

        // Adicionar motivo nas observações
        String observacaoAtual = agendamento.getObservacoes() != null ? agendamento.getObservacoes() : "";
        agendamento.setObservacoes(observacaoAtual + "\n[ESTETICISTA] " + motivo);

        // Mantém PENDENTE aguardando confirmação do cliente
        agendamento.setStatus(StatusAgendamento.PENDENTE);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        // Notificar cliente sobre nova proposta de horário
        notificacaoService.enviarPropostaNovoHorario(agendamentoSalvo, novaDataHora, motivo);

        log.info("Nova proposta de horário enviada ao cliente. Agendamento ID: {}", id);
        return agendamentoSalvo;
    }

    /**
     * Cliente aceita nova proposta de horário
     */
    @Transactional
    public Agendamento aceitarNovaPropostaCliente(Long id) {
        log.info("Cliente aceitando nova proposta de horário. Agendamento ID: {}", id);

        Agendamento agendamento = buscarPorId(id);

        if (agendamento.getStatus() != StatusAgendamento.PENDENTE) {
            throw new BusinessException("Agendamento não está pendente de aprovação");
        }

        // Aprovar automaticamente
        return aprovar(id);
    }

    @Transactional
    public Agendamento atualizar(Long id, Agendamento agendamentoAtualizado) {
        log.info("Atualizando agendamento ID: {}", id);

        Agendamento agendamentoExistente = buscarPorId(id);

        if (!agendamentoExistente.getStatus().podeEditar()) {
            throw new BusinessException("Agendamento não pode mais ser editado. Status: " +
                    agendamentoExistente.getStatus().getNome());
        }

        validarAgendamento(agendamentoAtualizado);

        // Se mudou horário ou esteticista, verificar disponibilidade
        boolean mudouHorario = !agendamentoExistente.getDataHora().equals(agendamentoAtualizado.getDataHora()) ||
                !agendamentoExistente.getEsteticista().equals(agendamentoAtualizado.getEsteticista());

        if (mudouHorario) {
            if (!verificarDisponibilidade(agendamentoAtualizado.getEsteticista(),
                    agendamentoAtualizado.getDataHora(),
                    agendamentoAtualizado.getDataHoraFim())) {
                throw new BusinessException("Horário já ocupado para esta esteticista");
            }
        }

        // Atualizar campos
        agendamentoExistente.setDataHora(agendamentoAtualizado.getDataHora());
        agendamentoExistente.setDataHoraFim(agendamentoAtualizado.getDataHoraFim());
        agendamentoExistente.setEsteticista(agendamentoAtualizado.getEsteticista());
        agendamentoExistente.setObservacoes(agendamentoAtualizado.getObservacoes());
        agendamentoExistente.setValorDesconto(agendamentoAtualizado.getValorDesconto());

        // Recalcular valor total
        BigDecimal valorTotal = agendamentoExistente.getValorProcedimento()
                .subtract(agendamentoAtualizado.getValorDesconto() != null ?
                        agendamentoAtualizado.getValorDesconto() : BigDecimal.ZERO);
        agendamentoExistente.setValorTotal(valorTotal);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamentoExistente);
        log.info("Agendamento atualizado com sucesso. ID: {}", id);
        return agendamentoSalvo;
    }

    @Transactional
    public Agendamento confirmar(Long id) {
        log.info("Confirmando agendamento ID: {}", id);

        Agendamento agendamento = buscarPorId(id);

        if (!agendamento.getStatus().podeConfirmar()) {
            throw new BusinessException("Agendamento não pode ser confirmado. Status atual: " +
                    agendamento.getStatus().getNome());
        }

        agendamento.setConfirmado(true);
        agendamento.setStatus(StatusAgendamento.CONFIRMADO);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);
        log.info("Agendamento confirmado com sucesso. ID: {}", id);
        return agendamentoSalvo;
    }

    @Transactional
    public Agendamento cancelar(Long id, String motivoCancelamento) {
        log.info("Cancelando agendamento ID: {}", id);

        Agendamento agendamento = buscarPorId(id);

        if (!agendamento.getStatus().podeCancelar()) {
            throw new BusinessException("Agendamento não pode ser cancelado. Status: " +
                    agendamento.getStatus().getNome());
        }

        agendamento.setStatus(StatusAgendamento.CANCELADO);
        agendamento.setMotivoCancelamento(motivoCancelamento);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        // Notificar cliente sobre cancelamento
        notificacaoService.enviarCancelamentoAgendamento(agendamentoSalvo);

        log.info("Agendamento cancelado com sucesso. ID: {}", id);
        return agendamentoSalvo;
    }

    @Transactional
    public Agendamento realizar(Long id) {
        log.info("Realizando agendamento ID: {}", id);

        Agendamento agendamento = buscarPorId(id);

        if (!agendamento.getStatus().podeRealizar()) {
            throw new BusinessException("Agendamento não pode ser realizado. Status: " +
                    agendamento.getStatus().getNome());
        }

        // Dar baixa nos produtos do estoque
        List<ProcedimentoProduto> produtos = procedimentoProdutoRepository
                .findByProcedimentoId(agendamento.getProcedimento().getId());

        for (ProcedimentoProduto pp : produtos) {
            estoqueService.registrarSaida(
                    pp.getProduto().getId(),
                    pp.getQuantidadeUtilizada(),
                    "Utilizado em procedimento - Agendamento #" + id,
                    agendamento.getId()
            );
        }

        agendamento.setStatus(StatusAgendamento.REALIZADO);

        // Atualizar última visita do cliente
        clienteService.atualizarUltimaVisita(
                agendamento.getCliente().getId(),
                agendamento.getDataHora().toLocalDate()
        );

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);
        log.info("Agendamento realizado com sucesso. ID: {}", id);
        return agendamentoSalvo;
    }

    @Transactional
    public Agendamento reagendar(Long id, LocalDateTime novaDataHora) {
        log.info("Reagendando agendamento ID: {} para {}", id, novaDataHora);

        Agendamento agendamento = buscarPorId(id);

        if (!agendamento.getStatus().podeEditar()) {
            throw new BusinessException("Agendamento não pode ser reagendado. Status: " +
                    agendamento.getStatus().getNome());
        }

        LocalDateTime novaDataHoraFim = novaDataHora.plusMinutes(agendamento.getDuracaoMinutos());

        // Verificar disponibilidade no novo horário
        if (!verificarDisponibilidade(agendamento.getEsteticista(), novaDataHora, novaDataHoraFim)) {
            throw new BusinessException("Novo horário já está ocupado para esta esteticista");
        }

        agendamento.setDataHora(novaDataHora);
        agendamento.setDataHoraFim(novaDataHoraFim);
        agendamento.setConfirmado(false);
        agendamento.setLembreteEnviado(false);

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        // Notificar cliente sobre reagendamento
        notificacaoService.enviarNotificacaoReagendamento(agendamentoSalvo);

        log.info("Agendamento reagendado com sucesso. ID: {}", id);
        return agendamentoSalvo;
    }

    @Transactional
    public void deletar(Long id) {
        log.info("Deletando agendamento ID: {}", id);

        Agendamento agendamento = buscarPorId(id);

        if (agendamento.getStatus() == StatusAgendamento.REALIZADO) {
            throw new BusinessException("Não é possível deletar um agendamento realizado");
        }

        agendamentoRepository.deleteById(id);
        log.info("Agendamento deletado com sucesso. ID: {}", id);
    }

    @Transactional(readOnly = true)
    public Long contarAgendamentosHoje() {
        return agendamentoRepository.countAgendamentosHoje();
    }

    @Transactional(readOnly = true)
    public Long contarAgendamentosMes() {
        return agendamentoRepository.countAgendamentosMes();
    }

    @Transactional(readOnly = true)
    public List<Agendamento> buscarAgendamentosSemLembrete() {
        return agendamentoRepository.findAgendamentosSemLembrete();
    }

    @Transactional
    public void marcarLembreteEnviado(Long id) {
        Agendamento agendamento = buscarPorId(id);
        agendamento.setLembreteEnviado(true);
        agendamentoRepository.save(agendamento);
        log.debug("Lembrete marcado como enviado para agendamento ID: {}", id);
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private void validarAgendamento(Agendamento agendamento) {
        if (agendamento.getDataHora() == null) {
            throw new BusinessException("Data e hora do agendamento são obrigatórios");
        }

        if (agendamento.getDataHora().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Não é possível agendar em data/hora passada");
        }

        if (agendamento.getDuracaoMinutos() < 15) {
            throw new BusinessException("Duração mínima do agendamento é 15 minutos");
        }

        if (agendamento.getEsteticista() == null || agendamento.getEsteticista().trim().isEmpty()) {
            throw new BusinessException("Esteticista é obrigatória");
        }

        if (agendamento.getCliente() == null || agendamento.getCliente().getId() == null) {
            throw new BusinessException("Cliente é obrigatório");
        }

        if (agendamento.getProcedimento() == null || agendamento.getProcedimento().getId() == null) {
            throw new BusinessException("Procedimento é obrigatório");
        }
    }

    private void validarClienteAtivo(Long clienteId) {
        Cliente cliente = clienteService.buscarPorId(clienteId);
        if (cliente.getStatus() != StatusCliente.ATIVO) {
            throw new BusinessException("Cliente inativo não pode fazer novos agendamentos");
        }
    }

    private void validarProcedimentoAtivo(Long procedimentoId) {
        Procedimento procedimento = procedimentoService.buscarPorId(procedimentoId);
        if (!procedimento.getAtivo()) {
            throw new BusinessException("Procedimento inativo não pode ser agendado");
        }
    }

    private void validarEstoqueProdutos(Long procedimentoId) {
        List<ProcedimentoProduto> produtos = procedimentoProdutoRepository
                .findByProcedimentoId(procedimentoId);

        for (ProcedimentoProduto pp : produtos) {
            estoqueService.validarEstoqueDisponivel(pp.getProduto().getId(), pp.getQuantidadeUtilizada());
        }
    }

    private void calcularValores(Agendamento agendamento, Procedimento procedimento) {
        BigDecimal valorProcedimento = procedimento.getPreco();
        BigDecimal valorDesconto = agendamento.getValorDesconto() != null ?
                agendamento.getValorDesconto() : BigDecimal.ZERO;
        BigDecimal valorTotal = valorProcedimento.subtract(valorDesconto);

        agendamento.setValorProcedimento(valorProcedimento);
        agendamento.setValorTotal(valorTotal);
    }
}