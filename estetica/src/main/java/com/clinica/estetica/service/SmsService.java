package com.clinica.estetica.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service para envio de SMS
 *
 * NOTA: Esta é uma implementação de exemplo.
 * Em produção, você deve integrar com um provedor real de SMS como:
 * - Twilio
 * - AWS SNS
 * - Nexmo/Vonage
 * - Brasil API
 * - Total Voice
 *
 * Para integrar com Twilio, por exemplo:
 * 1. Adicionar dependência: com.twilio.sdk:twilio:9.x.x
 * 2. Configurar credenciais no application.properties
 * 3. Usar TwilioRestClient para enviar mensagens
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    @Value("${sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${sms.provider:mock}")
    private String smsProvider;

    @Value("${clinica.nome:Clínica de Estética}")
    private String nomeClinica;

    /**
     * Envia SMS para um destinatário
     */
    @Async
    public void enviarSms(String telefone, String mensagem) {
        log.info("Enviando SMS para: {}", telefone);

        if (!smsEnabled) {
            log.warn("Envio de SMS está desabilitado. Mensagem não enviada para: {}", telefone);
            return;
        }

        try {
            // Validar telefone
            if (!validarTelefone(telefone)) {
                log.error("Telefone inválido: {}", telefone);
                throw new IllegalArgumentException("Formato de telefone inválido");
            }

            // Limitar tamanho da mensagem (SMS padrão = 160 caracteres)
            if (mensagem.length() > 160) {
                mensagem = mensagem.substring(0, 157) + "...";
                log.warn("Mensagem SMS truncada para 160 caracteres");
            }

            // Escolher provedor e enviar
            switch (smsProvider.toLowerCase()) {
                case "twilio":
                    enviarViaTwilio(telefone, mensagem);
                    break;
                case "aws":
                    enviarViaAws(telefone, mensagem);
                    break;
                case "totalvoice":
                    enviarViaTotalVoice(telefone, mensagem);
                    break;
                case "mock":
                default:
                    enviarViaMock(telefone, mensagem);
                    break;
            }

            log.info("SMS enviado com sucesso para: {}", telefone);

        } catch (Exception e) {
            log.error("Erro ao enviar SMS para: {}", telefone, e);
            throw new RuntimeException("Falha ao enviar SMS", e);
        }
    }

    /**
     * Envia SMS para múltiplos destinatários
     */
    @Async
    public void enviarSmsMultiplo(List<String> telefones, String mensagem) {
        log.info("Enviando SMS para {} destinatários", telefones.size());

        for (String telefone : telefones) {
            try {
                enviarSms(telefone, mensagem);
            } catch (Exception e) {
                log.error("Erro ao enviar SMS para: {}", telefone, e);
                // Continua enviando para os próximos mesmo se falhar em um
            }
        }

        log.info("Processamento de SMS múltiplo concluído");
    }

    /**
     * Formata mensagem SMS com assinatura da clínica
     */
    public String formatarMensagem(String conteudo) {
        return conteudo + "\n- " + nomeClinica;
    }

    /**
     * Valida formato de telefone brasileiro
     */
    public boolean validarTelefone(String telefone) {
        if (telefone == null || telefone.trim().isEmpty()) {
            return false;
        }

        // Remove caracteres não numéricos
        String telefoneLimpo = telefone.replaceAll("[^0-9]", "");

        // Telefone brasileiro deve ter 10 ou 11 dígitos (com DDD)
        // Formato: (XX) XXXX-XXXX ou (XX) 9XXXX-XXXX
        return telefoneLimpo.length() >= 10 && telefoneLimpo.length() <= 11;
    }

    /**
     * Formata telefone para padrão brasileiro
     */
    public String formatarTelefone(String telefone) {
        if (telefone == null) {
            return null;
        }

        // Remove caracteres não numéricos
        String telefoneLimpo = telefone.replaceAll("[^0-9]", "");

        if (telefoneLimpo.length() == 11) {
            // Formato: (XX) 9XXXX-XXXX
            return String.format("(%s) %s-%s",
                    telefoneLimpo.substring(0, 2),
                    telefoneLimpo.substring(2, 7),
                    telefoneLimpo.substring(7));
        } else if (telefoneLimpo.length() == 10) {
            // Formato: (XX) XXXX-XXXX
            return String.format("(%s) %s-%s",
                    telefoneLimpo.substring(0, 2),
                    telefoneLimpo.substring(2, 6),
                    telefoneLimpo.substring(6));
        }

        return telefone;
    }

    /**
     * Remove formatação do telefone (retorna apenas números)
     */
    public String limparTelefone(String telefone) {
        if (telefone == null) {
            return null;
        }
        return telefone.replaceAll("[^0-9]", "");
    }

    // ==================== MÉTODOS DE INTEGRAÇÃO COM PROVEDORES ====================

    /**
     * Integração com Twilio (exemplo)
     */
    private void enviarViaTwilio(String telefone, String mensagem) {
        log.info("Enviando SMS via Twilio para: {}", telefone);

        // Implementação de exemplo - em produção, use:
        /*
        Twilio.init(accountSid, authToken);
        Message message = Message.creator(
                new PhoneNumber(telefone),
                new PhoneNumber(twilioPhoneNumber),
                mensagem
        ).create();
        */

        // Por enquanto, apenas loga
        log.info("SMS via Twilio (mock): {} - {}", telefone, mensagem);
    }

    /**
     * Integração com AWS SNS (exemplo)
     */
    private void enviarViaAws(String telefone, String mensagem) {
        log.info("Enviando SMS via AWS SNS para: {}", telefone);

        // Implementação de exemplo - em produção, use:
        /*
        AmazonSNS snsClient = AmazonSNSClientBuilder.standard().build();
        PublishRequest publishRequest = new PublishRequest()
                .withMessage(mensagem)
                .withPhoneNumber(telefone);
        PublishResult result = snsClient.publish(publishRequest);
        */

        // Por enquanto, apenas loga
        log.info("SMS via AWS SNS (mock): {} - {}", telefone, mensagem);
    }

    /**
     * Integração com Total Voice (exemplo)
     */
    private void enviarViaTotalVoice(String telefone, String mensagem) {
        log.info("Enviando SMS via Total Voice para: {}", telefone);

        // Implementação de exemplo - em produção, use a API REST do Total Voice
        // com HttpClient ou RestTemplate

        // Por enquanto, apenas loga
        log.info("SMS via Total Voice (mock): {} - {}", telefone, mensagem);
    }

    /**
     * Mock para desenvolvimento/testes
     */
    private void enviarViaMock(String telefone, String mensagem) {
        log.info("=== SMS MOCK ===");
        log.info("Para: {}", telefone);
        log.info("Mensagem: {}", mensagem);
        log.info("================");

        // Simula delay de envio
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Verifica se o serviço de SMS está habilitado
     */
    public boolean isEnabled() {
        return smsEnabled;
    }

    /**
     * Retorna o provedor de SMS configurado
     */
    public String getProvider() {
        return smsProvider;
    }
}