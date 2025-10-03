package com.clinica.estetica.controller;

import com.clinica.estetica.model.dto.request.AgendamentoRequest;
import com.clinica.estetica.model.entity.Agendamento;
import com.clinica.estetica.model.enums.StatusAgendamento;
import com.clinica.estetica.service.AgendamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agendamentos")
@RequiredArgsConstructor
@Tag(name = "Agendamentos", description = "Gestão de agendamentos com fluxo de aprovação")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;
    private final ModelMapper modelMapper;

    @GetMapping
    @Operation(summary = "Listar todos os agendamentos")
    public ResponseEntity<Page<Agendamento>> listarTodos(
            @PageableDefault(size = 20, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Agendamento> agendamentos = agendamentoService.listarTodosPaginado(pageable);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar agendamento por ID")
    public ResponseEntity<Agendamento> buscarPorId(@PathVariable Long id) {
        Agendamento agendamento = agendamentoService.buscarPorId(id);
        return ResponseEntity.ok(agendamento);
    }

    // ========== CRIAR AGENDAMENTOS ==========

    @PostMapping("/direto")
    @Operation(summary = "Criar agendamento direto",
            description = "Cria agendamento já aprovado (para recepção/telefone)")
    public ResponseEntity<Agendamento> criarAgendamentoDireto(@Valid @RequestBody AgendamentoRequest request) {
        Agendamento agendamento = mapearParaAgendamento(request);
        Agendamento agendamentoSalvo = agendamentoService.criarAgendamentoDireto(agendamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(agendamentoSalvo);
    }

    @PostMapping("/solicitar")
    @Operation(summary = "Solicitar agendamento",
            description = "Cria solicitação de agendamento pendente (para app/site)")
    public ResponseEntity<Agendamento> solicitarAgendamento(@Valid @RequestBody AgendamentoRequest request) {
        Agendamento agendamento = mapearParaAgendamento(request);
        Agendamento agendamentoSalvo = agendamentoService.solicitarAgendamento(agendamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(agendamentoSalvo);
    }

    // ========== FLUXO DE APROVAÇÃO ==========

    @PutMapping("/{id}/aprovar")
    @Operation(summary = "Aprovar agendamento",
            description = "Esteticista aprova agendamento pendente")
    public ResponseEntity<Agendamento> aprovar(@PathVariable Long id) {
        Agendamento agendamento = agendamentoService.aprovar(id);
        return ResponseEntity.ok(agendamento);
    }

    @PutMapping("/{id}/reprovar")
    @Operation(summary = "Reprovar e sugerir novo horário",
            description = "Esteticista reprova e sugere outro horário")
    public ResponseEntity<Agendamento> reprovarESugerirNovoHorario(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime novaDataHora,
            @RequestParam String motivo) {
        Agendamento agendamento = agendamentoService.reprovarESugerirNovoHorario(id, novaDataHora, motivo);
        return ResponseEntity.ok(agendamento);
    }

    @PutMapping("/{id}/aceitar-proposta")
    @Operation(summary = "Cliente aceita proposta",
            description = "Cliente aceita novo horário proposto")
    public ResponseEntity<Agendamento> aceitarProposta(@PathVariable Long id) {
        Agendamento agendamento = agendamentoService.aceitarNovaPropostaCliente(id);
        return ResponseEntity.ok(agendamento);
    }

    // ========== GERENCIAR AGENDAMENTOS ==========

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar agendamento")
    public ResponseEntity<Agendamento> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AgendamentoRequest request) {
        Agendamento agendamento = mapearParaAgendamento(request);
        Agendamento agendamentoAtualizado = agendamentoService.atualizar(id, agendamento);
        return ResponseEntity.ok(agendamentoAtualizado);
    }

    @PutMapping("/{id}/confirmar")
    @Operation(summary = "Confirmar agendamento",
            description = "Cliente confirma presença")
    public ResponseEntity<Agendamento> confirmar(@PathVariable Long id) {
        Agendamento agendamento = agendamentoService.confirmar(id);
        return ResponseEntity.ok(agendamento);
    }

    @PutMapping("/{id}/cancelar")
    @Operation(summary = "Cancelar agendamento")
    public ResponseEntity<Agendamento> cancelar(
            @PathVariable Long id,
            @RequestParam String motivo) {
        Agendamento agendamento = agendamentoService.cancelar(id, motivo);
        return ResponseEntity.ok(agendamento);
    }

    @PutMapping("/{id}/reagendar")
    @Operation(summary = "Reagendar")
    public ResponseEntity<Agendamento> reagendar(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime novaDataHora) {
        Agendamento agendamento = agendamentoService.reagendar(id, novaDataHora);
        return ResponseEntity.ok(agendamento);
    }

    @PutMapping("/{id}/realizar")
    @Operation(summary = "Marcar como realizado",
            description = "Procedimento foi realizado - dá baixa no estoque")
    public ResponseEntity<Agendamento> realizar(@PathVariable Long id) {
        Agendamento agendamento = agendamentoService.realizar(id);
        return ResponseEntity.ok(agendamento);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar agendamento")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        agendamentoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    // ========== CONSULTAS ==========

    @GetMapping("/hoje")
    @Operation(summary = "Agendamentos de hoje")
    public ResponseEntity<List<Agendamento>> buscarAgendamentosHoje() {
        List<Agendamento> agendamentos = agendamentoService.buscarAgendamentosHoje();
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/data/{data}")
    @Operation(summary = "Buscar por data")
    public ResponseEntity<List<Agendamento>> buscarPorData(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        List<Agendamento> agendamentos = agendamentoService.buscarPorData(data);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/periodo")
    @Operation(summary = "Buscar por período")
    public ResponseEntity<List<Agendamento>> buscarPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        List<Agendamento> agendamentos = agendamentoService.buscarPorPeriodo(inicio, fim);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/cliente/{id}")
    @Operation(summary = "Buscar por cliente")
    public ResponseEntity<List<Agendamento>> buscarPorCliente(@PathVariable Long id) {
        List<Agendamento> agendamentos = agendamentoService.buscarPorCliente(id);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/esteticista/{nome}")
    @Operation(summary = "Buscar por esteticista")
    public ResponseEntity<List<Agendamento>> buscarPorEsteticista(@PathVariable String nome) {
        List<Agendamento> agendamentos = agendamentoService.buscarPorEsteticista(nome);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar por status")
    public ResponseEntity<Page<Agendamento>> buscarPorStatus(
            @PathVariable StatusAgendamento status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Agendamento> agendamentos = agendamentoService.buscarPorStatus(status, pageable);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/disponibilidade")
    @Operation(summary = "Verificar disponibilidade de horário")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidade(
            @RequestParam String esteticista,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam Integer duracaoMinutos) {

        LocalDateTime fim = inicio.plusMinutes(duracaoMinutos);
        boolean disponivel = agendamentoService.verificarDisponibilidade(esteticista, inicio, fim);

        Map<String, Object> response = new HashMap<>();
        response.put("disponivel", disponivel);
        response.put("esteticista", esteticista);
        response.put("inicio", inicio);
        response.put("fim", fim);

        return ResponseEntity.ok(response);
    }

    // ========== HELPER ==========

    private Agendamento mapearParaAgendamento(AgendamentoRequest request) {
        Agendamento agendamento = modelMapper.map(request, Agendamento.class);

        // Configurar cliente e procedimento com apenas o ID
        com.clinica.estetica.model.entity.Cliente cliente = new com.clinica.estetica.model.entity.Cliente();
        cliente.setId(request.getClienteId());
        agendamento.setCliente(cliente);

        com.clinica.estetica.model.entity.Procedimento procedimento = new com.clinica.estetica.model.entity.Procedimento();
        procedimento.setId(request.getProcedimentoId());
        agendamento.setProcedimento(procedimento);

        // Calcular data hora fim
        agendamento.setDataHoraFim(request.getDataHora().plusMinutes(request.getDuracaoMinutos()));

        return agendamento;
    }
}