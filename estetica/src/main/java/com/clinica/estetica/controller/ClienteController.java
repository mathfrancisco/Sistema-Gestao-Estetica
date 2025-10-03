package com.clinica.estetica.controller;

import com.clinica.estetica.model.dto.request.ClienteRequest;
import com.clinica.estetica.model.entity.Cliente;
import com.clinica.estetica.model.enums.StatusCliente;
import com.clinica.estetica.service.ClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@Tag(name = "Clientes", description = "Gestão de clientes")
public class ClienteController {

    private final ClienteService clienteService;
    private final ModelMapper modelMapper;

    @GetMapping
    @Operation(summary = "Listar todos os clientes", description = "Lista todos os clientes com paginação")
    public ResponseEntity<Page<Cliente>> listarTodos(
            @PageableDefault(size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<Cliente> clientes = clienteService.listarTodosPaginado(pageable);
        return ResponseEntity.ok(clientes);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        Cliente cliente = clienteService.buscarPorId(id);
        return ResponseEntity.ok(cliente);
    }

    @GetMapping("/cpf/{cpf}")
    @Operation(summary = "Buscar cliente por CPF")
    public ResponseEntity<Cliente> buscarPorCpf(@PathVariable String cpf) {
        Cliente cliente = clienteService.buscarPorCpf(cpf);
        return ResponseEntity.ok(cliente);
    }

    @PostMapping("/buscar")
    @Operation(summary = "Buscar clientes", description = "Busca clientes por texto (nome, CPF, email)")
    public ResponseEntity<Page<Cliente>> buscar(
            @RequestParam String busca,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Cliente> clientes = clienteService.buscarPorTexto(busca, pageable);
        return ResponseEntity.ok(clientes);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar por status")
    public ResponseEntity<Page<Cliente>> buscarPorStatus(
            @PathVariable StatusCliente status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Cliente> clientes = clienteService.buscarPorStatus(status, pageable);
        return ResponseEntity.ok(clientes);
    }

    @GetMapping("/aniversariantes")
    @Operation(summary = "Aniversariantes do dia")
    public ResponseEntity<List<Cliente>> listarAniversariantes() {
        List<Cliente> clientes = clienteService.listarAniversariantesdoDia();
        return ResponseEntity.ok(clientes);
    }

    @GetMapping("/{id}/historico")
    @Operation(summary = "Histórico do cliente", description = "Retorna agendamentos e transações do cliente")
    public ResponseEntity<Cliente> buscarHistorico(@PathVariable Long id) {
        // Implementar histórico completo se necessário
        Cliente cliente = clienteService.buscarPorId(id);
        return ResponseEntity.ok(cliente);
    }

    @PostMapping
    @Operation(summary = "Criar novo cliente")
    public ResponseEntity<Cliente> criar(@Valid @RequestBody ClienteRequest request) {
        Cliente cliente = modelMapper.map(request, Cliente.class);
        Cliente clienteSalvo = clienteService.criar(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteSalvo);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cliente")
    public ResponseEntity<Cliente> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteRequest request) {
        Cliente cliente = modelMapper.map(request, Cliente.class);
        Cliente clienteAtualizado = clienteService.atualizar(id, cliente);
        return ResponseEntity.ok(clienteAtualizado);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar cliente", description = "Remove cliente se não tiver agendamentos futuros")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        clienteService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/inativar")
    @Operation(summary = "Inativar cliente")
    public ResponseEntity<Cliente> inativar(@PathVariable Long id) {
        Cliente cliente = clienteService.inativar(id);
        return ResponseEntity.ok(cliente);
    }

    @PutMapping("/{id}/ativar")
    @Operation(summary = "Ativar cliente")
    public ResponseEntity<Cliente> ativar(@PathVariable Long id) {
        Cliente cliente = clienteService.ativar(id);
        return ResponseEntity.ok(cliente);
    }
}