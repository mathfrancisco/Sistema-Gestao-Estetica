package com.clinica.estetica.service;

import com.clinica.estetica.model.entity.Agendamento;
import com.clinica.estetica.model.entity.Cliente;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final EmailService emailService;
    private final SmsService smsService;
    private final AgendamentoService agendamentoService;
    private final ClienteService clienteService;

    @Value("${clinica.email.esteticista:esteticista@clinica.com}")
    private String emailEsteticista;

    @Value("${clinica.telefone.esteticista:11999999999}")
    private String telefoneEsteticista;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    // ==================== NOTIFICAÇÕES PARA CLIENTE ====================

    /**
     * Envia confirmação de que a solicitação foi recebida (Status: PENDENTE)
     */
    @Async
    public void enviarConfirmacaoSolicitacao(Agendamento agendamento) {
        log.info("Enviando confirmação de solicitação recebida - Agendamento ID: {}", agendamento.getId());

        try {
            Cliente cliente = agendamento.getCliente();
            String dataHora = agendamento.getDataHora().format(DATETIME_FORMATTER);

            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "Solicitação Recebida - Agendamento";
                String mensagem = String.format(
                        "Olá %s,\n\n" +
                                "Recebemos sua solicitação de agendamento!\n\n" +
                                "Detalhes Solicitados:\n" +
                                "Procedimento: %s\n" +
                                "Data/Hora: %s\n" +
                                "Esteticista: %s\n" +
                                "Valor: R$ %.2f\n\n" +
                                "Sua solicitação será avaliada pela nossa equipe e você receberá " +
                                "a confirmação em breve (geralmente em até 2 horas).\n\n" +
                                "Caso o horário não esteja disponível, entraremos em contato " +
                                "para sugerir outras opções.\n\n" +
                                "Aguarde nossa confirmação!\n\n" +
                                "Clínica de Estética",
                        cliente.getNome(),
                        agendamento.getProcedimento().getNome(),
                        dataHora,
                        agendamento.getEsteticista(),
                        agendamento.getValorTotal()
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            if (cliente.getCelular() != null && !cliente.getCelular().isEmpty()) {
                String mensagemSms = String.format(
                        "Olá %s! Recebemos seu pedido de agendamento para %s. " +
                                "Você receberá confirmação em breve. - Clínica de Estética",
                        cliente.getNome().split(" ")[0],
                        agendamento.getDataHora().format(DATE_FORMATTER)
                );

                smsService.enviarSms(cliente.getCelular(), mensagemSms);
            }

            log.info("Confirmação de solicitação enviada - Agendamento ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao enviar confirmação de solicitação - Agendamento ID: {}", agendamento.getId(), e);
        }
    }

    /**
     * Notifica cliente que agendamento foi APROVADO
     */
    @Async
    public void enviarAprovacaoAgendamento(Agendamento agendamento) {
        log.info("Enviando aprovação de agendamento - ID: {}", agendamento.getId());

        try {
            Cliente cliente = agendamento.getCliente();
            String dataHora = agendamento.getDataHora().format(DATETIME_FORMATTER);

            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "✅ Agendamento CONFIRMADO!";
                String mensagem = String.format(
                        "Ótima notícia, %s! 🎉\n\n" +
                                "Seu agendamento foi APROVADO e CONFIRMADO!\n\n" +
                                "📅 Detalhes do Agendamento:\n" +
                                "━━━━━━━━━━━━━━━━━━━━━━\n" +
                                "💆 Procedimento: %s\n" +
                                "📆 Data/Hora: %s\n" +
                                "👩 Esteticista: %s\n" +
                                "⏱️ Duração: %d minutos\n" +
                                "💰 Valor: R$ %.2f\n" +
                                "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                                "⚠️ IMPORTANTE:\n" +
                                "- Chegue 10 minutos antes do horário\n" +
                                "- %s\n\n" +
                                "📱 Em caso de imprevistos, avise com antecedência.\n\n" +
                                "Aguardamos você!\n\n" +
                                "Clínica de Estética",
                        cliente.getNome(),
                        agendamento.getProcedimento().getNome(),
                        dataHora,
                        agendamento.getEsteticista(),
                        agendamento.getDuracaoMinutos(),
                        agendamento.getValorTotal(),
                        agendamento.getProcedimento().getPreparoNecessario() != null ?
                                agendamento.getProcedimento().getPreparoNecessario() : "Nenhum preparo especial necessário"
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            if (cliente.getCelular() != null && !cliente.getCelular().isEmpty()) {
                String mensagemSms = String.format(
                        "✅ %s, seu agendamento foi CONFIRMADO! %s às %s com %s. Aguardamos você! - Clínica",
                        cliente.getNome().split(" ")[0],
                        agendamento.getDataHora().format(DATE_FORMATTER),
                        agendamento.getDataHora().format(TIME_FORMATTER),
                        agendamento.getEsteticista()
                );

                smsService.enviarSms(cliente.getCelular(), mensagemSms);
            }

            log.info("Aprovação enviada com sucesso - Agendamento ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao enviar aprovação - Agendamento ID: {}", agendamento.getId(), e);
        }
    }

    /**
     * Notifica cliente sobre proposta de novo horário
     */
    @Async
    public void enviarPropostaNovoHorario(Agendamento agendamento, LocalDateTime novoHorario, String motivo) {
        log.info("Enviando proposta de novo horário - Agendamento ID: {}", agendamento.getId());

        try {
            Cliente cliente = agendamento.getCliente();
            String horarioOriginal = agendamento.getDataHora().format(DATETIME_FORMATTER);
            String novoHorarioFormatado = novoHorario.format(DATETIME_FORMATTER);

            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "Proposta de Novo Horário - Agendamento";
                String mensagem = String.format(
                        "Olá %s,\n\n" +
                                "Sobre sua solicitação de agendamento...\n\n" +
                                "Infelizmente o horário solicitado não está disponível:\n" +
                                "❌ Horário solicitado: %s\n" +
                                "Motivo: %s\n\n" +
                                "Mas temos uma ótima alternativa! ✨\n\n" +
                                "✅ NOVO HORÁRIO PROPOSTO: %s\n\n" +
                                "Procedimento: %s\n" +
                                "Esteticista: %s\n" +
                                "Valor: R$ %.2f\n\n" +
                                "Para CONFIRMAR este novo horário, acesse:\n" +
                                "[LINK PARA CONFIRMAR]\n\n" +
                                "Ou entre em contato conosco para sugerir outro horário.\n\n" +
                                "Aguardamos seu retorno!\n\n" +
                                "Clínica de Estética",
                        cliente.getNome(),
                        horarioOriginal,
                        motivo,
                        novoHorarioFormatado,
                        agendamento.getProcedimento().getNome(),
                        agendamento.getEsteticista(),
                        agendamento.getValorTotal()
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            if (cliente.getCelular() != null && !cliente.getCelular().isEmpty()) {
                String mensagemSms = String.format(
                        "%s, o horário %s não está disponível. Podemos em %s? " +
                                "Confirme pelo link ou ligue para nós. - Clínica",
                        cliente.getNome().split(" ")[0],
                        agendamento.getDataHora().format(TIME_FORMATTER),
                        novoHorario.format(DATETIME_FORMATTER)
                );

                smsService.enviarSms(cliente.getCelular(), mensagemSms);
            }

            log.info("Proposta de novo horário enviada - Agendamento ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao enviar proposta de novo horário - Agendamento ID: {}", agendamento.getId(), e);
        }
    }

    /**
     * Envia lembrete de agendamento 24h antes (já existente, mantido)
     */
    @Async
    public void enviarLembreteAgendamento(Agendamento agendamento) {
        log.info("Enviando lembrete de agendamento ID: {}", agendamento.getId());

        try {
            Cliente cliente = agendamento.getCliente();
            String dataHora = agendamento.getDataHora().format(DATETIME_FORMATTER);

            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "Lembrete: Agendamento Amanhã! 📅";
                String mensagem = String.format(
                        "Olá %s,\n\n" +
                                "Este é um lembrete do seu agendamento AMANHÃ:\n\n" +
                                "📅 %s\n" +
                                "💆 %s\n" +
                                "👩 Com %s\n" +
                                "💰 R$ %.2f\n\n" +
                                "📍 Endereço: [Endereço da clínica]\n" +
                                "⏰ Chegue 10 minutos antes\n\n" +
                                "Aguardamos você!\n\n" +
                                "Clínica de Estética",
                        cliente.getNome(),
                        dataHora,
                        agendamento.getProcedimento().getNome(),
                        agendamento.getEsteticista(),
                        agendamento.getValorTotal()
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            if (cliente.getCelular() != null && !cliente.getCelular().isEmpty()) {
                String mensagemSms = String.format(
                        "Lembrete: %s, você tem agendamento amanhã às %s - %s. Aguardamos você! - Clínica",
                        cliente.getNome().split(" ")[0],
                        agendamento.getDataHora().format(TIME_FORMATTER),
                        agendamento.getProcedimento().getNome()
                );

                smsService.enviarSms(cliente.getCelular(), mensagemSms);
            }

            agendamentoService.marcarLembreteEnviado(agendamento.getId());

            log.info("Lembrete enviado com sucesso - Agendamento ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao enviar lembrete - Agendamento ID: {}", agendamento.getId(), e);
        }
    }

    /**
     * Envia confirmação após criação de agendamento direto (já existente)
     */
    @Async
    public void enviarConfirmacaoAgendamento(Agendamento agendamento) {
        log.info("Enviando confirmação de agendamento direto - ID: {}", agendamento.getId());

        try {
            Cliente cliente = agendamento.getCliente();
            String dataHora = agendamento.getDataHora().format(DATETIME_FORMATTER);

            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "Agendamento Confirmado - Clínica de Estética";
                String mensagem = String.format(
                        "Olá %s,\n\n" +
                                "Seu agendamento foi confirmado com sucesso!\n\n" +
                                "Detalhes:\n" +
                                "Procedimento: %s\n" +
                                "Data/Hora: %s\n" +
                                "Esteticista: %s\n" +
                                "Valor: R$ %.2f\n" +
                                "Duração: %d minutos\n\n" +
                                "Aguardamos você!\n\n" +
                                "Clínica de Estética",
                        cliente.getNome(),
                        agendamento.getProcedimento().getNome(),
                        dataHora,
                        agendamento.getEsteticista(),
                        agendamento.getValorTotal(),
                        agendamento.getDuracaoMinutos()
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            log.info("Confirmação enviada - Agendamento ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao enviar confirmação - Agendamento ID: {}", agendamento.getId(), e);
        }
    }

    /**
     * Envia notificação de reagendamento
     */
    @Async
    public void enviarNotificacaoReagendamento(Agendamento agendamento) {
        log.info("Enviando notificação de reagendamento - ID: {}", agendamento.getId());

        try {
            Cliente cliente = agendamento.getCliente();
            String dataHora = agendamento.getDataHora().format(DATETIME_FORMATTER);

            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "Agendamento Reagendado";
                String mensagem = String.format(
                        "Olá %s,\n\n" +
                                "Seu agendamento foi reagendado:\n\n" +
                                "NOVO horário: %s\n" +
                                "Procedimento: %s\n" +
                                "Esteticista: %s\n\n" +
                                "Aguardamos você no novo horário!\n\n" +
                                "Clínica de Estética",
                        cliente.getNome(),
                        dataHora,
                        agendamento.getProcedimento().getNome(),
                        agendamento.getEsteticista()
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            log.info("Notificação de reagendamento enviada - ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao enviar notificação de reagendamento - ID: {}", agendamento.getId(), e);
        }
    }

    /**
     * Envia mensagem de cancelamento (já existente)
     */
    @Async
    public void enviarCancelamentoAgendamento(Agendamento agendamento) {
        log.info("Enviando notificação de cancelamento - Agendamento ID: {}", agendamento.getId());

        try {
            Cliente cliente = agendamento.getCliente();
            String dataHora = agendamento.getDataHora().format(DATETIME_FORMATTER);

            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "Agendamento Cancelado";
                String mensagem = String.format(
                        "Olá %s,\n\n" +
                                "Informamos que seu agendamento foi cancelado.\n\n" +
                                "Procedimento: %s\n" +
                                "Data/Hora: %s\n" +
                                "Motivo: %s\n\n" +
                                "Para reagendar, entre em contato conosco.\n\n" +
                                "Clínica de Estética",
                        cliente.getNome(),
                        agendamento.getProcedimento().getNome(),
                        dataHora,
                        agendamento.getMotivoCancelamento() != null ?
                                agendamento.getMotivoCancelamento() : "Não informado"
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            log.info("Cancelamento notificado - Agendamento ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao enviar cancelamento - Agendamento ID: {}", agendamento.getId(), e);
        }
    }

    // ==================== NOTIFICAÇÕES PARA ESTETICISTA ====================

    /**
     * Notifica esteticista sobre NOVA solicitação de agendamento
     */
    @Async
    public void notificarEsteticistaNovoAgendamento(Agendamento agendamento) {
        log.info("Notificando esteticista sobre novo agendamento - ID: {}", agendamento.getId());

        try {
            String dataHora = agendamento.getDataHora().format(DATETIME_FORMATTER);

            // Email para esteticista
            String assunto = "🔔 NOVA Solicitação de Agendamento";
            String mensagem = String.format(
                    "Nova solicitação de agendamento recebida!\n\n" +
                            "AGENDAMENTO #%d\n" +
                            "━━━━━━━━━━━━━━━━━━━━━━\n" +
                            "Cliente: %s\n" +
                            "Telefone: %s\n" +
                            "Procedimento: %s\n" +
                            "Data/Hora: %s\n" +
                            "Esteticista: %s\n" +
                            "Valor: R$ %.2f\n" +
                            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                            "⚠️ AÇÃO NECESSÁRIA:\n" +
                            "Acesse o sistema para APROVAR ou SUGERIR outro horário.\n\n" +
                            "[LINK PARA O SISTEMA]\n\n" +
                            "Sistema da Clínica",
                    agendamento.getId(),
                    agendamento.getCliente().getNome(),
                    agendamento.getCliente().getCelular(),
                    agendamento.getProcedimento().getNome(),
                    dataHora,
                    agendamento.getEsteticista(),
                    agendamento.getValorTotal()
            );

            emailService.enviarEmail(emailEsteticista, assunto, mensagem);

            // SMS para esteticista
            String mensagemSms = String.format(
                    "NOVA solicitação de agendamento! %s - %s em %s. Acesse o sistema para aprovar.",
                    agendamento.getCliente().getNome(),
                    agendamento.getProcedimento().getNome(),
                    dataHora
            );

            smsService.enviarSms(telefoneEsteticista, mensagemSms);

            log.info("Esteticista notificada - Agendamento ID: {}", agendamento.getId());

        } catch (Exception e) {
            log.error("Erro ao notificar esteticista - Agendamento ID: {}", agendamento.getId(), e);
        }
    }

    // ==================== NOTIFICAÇÕES GERAIS (já existentes) ====================

    @Async
    public void enviarMensagensAniversario() {
        log.info("Processando mensagens de aniversário");

        try {
            List<Cliente> aniversariantes = clienteService.listarAniversariantesdoDia();

            for (Cliente cliente : aniversariantes) {
                enviarMensagemAniversario(cliente);
            }

            log.info("Mensagens de aniversário enviadas para {} clientes", aniversariantes.size());

        } catch (Exception e) {
            log.error("Erro ao processar mensagens de aniversário", e);
        }
    }

    @Async
    public void enviarMensagemAniversario(Cliente cliente) {
        log.info("Enviando mensagem de aniversário para: {}", cliente.getNome());

        try {
            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                String assunto = "Feliz Aniversário! 🎉";
                String mensagem = String.format(
                        "Olá %s,\n\n" +
                                "Parabéns pelo seu aniversário! 🎂🎉\n\n" +
                                "Desejamos um dia maravilhoso!\n\n" +
                                "PRESENTE ESPECIAL: 10%% de desconto em qualquer procedimento este mês!\n\n" +
                                "Agende já!\n\n" +
                                "Com carinho,\nClínica de Estética",
                        cliente.getNome()
                );

                emailService.enviarEmail(cliente.getEmail(), assunto, mensagem);
            }

            log.info("Mensagem de aniversário enviada para: {}", cliente.getNome());

        } catch (Exception e) {
            log.error("Erro ao enviar mensagem de aniversário para: {}", cliente.getNome(), e);
        }
    }

    @Async
    public void processarLembretesAgendamentos() {
        log.info("Processando lembretes de agendamentos");

        try {
            List<Agendamento> agendamentos = agendamentoService.buscarAgendamentosSemLembrete();
            LocalDateTime limite = LocalDateTime.now().plusHours(24);

            for (Agendamento agendamento : agendamentos) {
                if (agendamento.getDataHora().isBefore(limite)) {
                    enviarLembreteAgendamento(agendamento);
                }
            }

            log.info("Lembretes processados: {}", agendamentos.size());

        } catch (Exception e) {
            log.error("Erro ao processar lembretes", e);
        }
    }

    @Async
    public void enviarAlertaEstoqueBaixo(String emailDestino) {
        log.info("Enviando alerta de estoque baixo");

        try {
            String assunto = "⚠️ Alerta: Produtos com Estoque Baixo";
            String mensagem = "Existem produtos com estoque abaixo do mínimo. Verifique o sistema.";

            emailService.enviarEmail(emailDestino, assunto, mensagem);

        } catch (Exception e) {
            log.error("Erro ao enviar alerta de estoque", e);
        }
    }

    @Async
    public void enviarAlertaContasVencidas(String emailDestino) {
        log.info("Enviando alerta de contas vencidas");

        try {
            String assunto = "⚠️ Alerta: Contas Vencidas";
            String mensagem = "Existem contas a receber vencidas. Verifique o sistema.";

            emailService.enviarEmail(emailDestino, assunto, mensagem);

        } catch (Exception e) {
            log.error("Erro ao enviar alerta de contas vencidas", e);
        }
    }
}