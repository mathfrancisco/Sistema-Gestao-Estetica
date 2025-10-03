package com.clinica.estetica.controller;

import com.clinica.estetica.model.entity.Categoria;
import com.clinica.estetica.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
@Tag(name = "Categorias", description = "Endpoints para gerenciamento de categorias de procedimentos")
public class CategoriaController {

    private final CategoriaService categoriaService;

    @GetMapping
    @Operation(
            summary = "Listar todas as categorias",
            description = "Retorna uma lista com todas as categorias cadastradas no sistema"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso",
                    content = @Content(schema = @Schema(implementation = Categoria.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<Categoria>> listarTodas() {
        List<Categoria> categorias = categoriaService.listarTodas();
        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/ativas")
    @Operation(
            summary = "Listar categorias ativas",
            description = "Retorna apenas as categorias que estão ativas no sistema"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<List<Categoria>> listarAtivas() {
        List<Categoria> categorias = categoriaService.listarAtivas();
        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Buscar categoria por ID",
            description = "Retorna os detalhes de uma categoria específica"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria encontrada"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Categoria> buscarPorId(
            @Parameter(description = "ID da categoria", required = true)
            @PathVariable Long id) {
        Categoria categoria = categoriaService.buscarPorId(id);
        return ResponseEntity.ok(categoria);
    }

    @GetMapping("/buscar")
    @Operation(
            summary = "Buscar categorias por nome",
            description = "Busca categorias que contenham o texto informado no nome"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Busca realizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos")
    })
    public ResponseEntity<List<Categoria>> buscarPorNome(
            @Parameter(description = "Nome ou parte do nome da categoria", required = true)
            @RequestParam String nome) {
        List<Categoria> categorias = categoriaService.buscarPorNome(nome);
        return ResponseEntity.ok(categorias);
    }

    @PostMapping
    @Operation(
            summary = "Criar nova categoria",
            description = "Cria uma nova categoria de procedimentos no sistema"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Categoria criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Categoria> criar(
            @Parameter(description = "Dados da nova categoria", required = true)
            @Valid @RequestBody Categoria categoria) {
        Categoria categoriaSalva = categoriaService.criar(categoria);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaSalva);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Atualizar categoria",
            description = "Atualiza os dados de uma categoria existente"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Categoria> atualizar(
            @Parameter(description = "ID da categoria", required = true)
            @PathVariable Long id,
            @Parameter(description = "Novos dados da categoria", required = true)
            @Valid @RequestBody Categoria categoria) {
        Categoria categoriaAtualizada = categoriaService.atualizar(id, categoria);
        return ResponseEntity.ok(categoriaAtualizada);
    }

    @PutMapping("/{id}/inativar")
    @Operation(
            summary = "Inativar categoria",
            description = "Marca uma categoria como inativa (não será excluída do banco)"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria inativada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Categoria> inativar(
            @Parameter(description = "ID da categoria", required = true)
            @PathVariable Long id) {
        Categoria categoria = categoriaService.inativar(id);
        return ResponseEntity.ok(categoria);
    }

    @PutMapping("/{id}/ativar")
    @Operation(
            summary = "Ativar categoria",
            description = "Marca uma categoria como ativa novamente"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categoria ativada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Categoria> ativar(
            @Parameter(description = "ID da categoria", required = true)
            @PathVariable Long id) {
        Categoria categoria = categoriaService.ativar(id);
        return ResponseEntity.ok(categoria);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Deletar categoria",
            description = "Remove uma categoria do sistema. ATENÇÃO: Só é possível deletar se não houver procedimentos vinculados."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Categoria deletada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Não é possível deletar - existem procedimentos vinculados"),
            @ApiResponse(responseCode = "404", description = "Categoria não encontrada"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Void> deletar(
            @Parameter(description = "ID da categoria", required = true)
            @PathVariable Long id) {
        categoriaService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}