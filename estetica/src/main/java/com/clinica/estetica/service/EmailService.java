package com.clinica.estetica.service;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@clinicaestetica.com}")
    private String remetente;

    @Value("${clinica.nome:Clínica de Estética}")
    private String nomeClinica;

    /**
     * Envia email simples (texto puro)
     */
    @Async
    public void enviarEmail(String destinatario, String assunto, String mensagem) {
        log.info("Enviando email para: {}", destinatario);

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(remetente);
            email.setTo(destinatario);
            email.setSubject(assunto);
            email.setText(mensagem);

            mailSender.send(email);

            log.info("Email enviado com sucesso para: {}", destinatario);

        } catch (Exception e) {
            log.error("Erro ao enviar email para: {}", destinatario, e);
            throw new RuntimeException("Falha ao enviar email", e);
        }
    }

    /**
     * Envia email HTML
     */
    @Async
    public void enviarEmailHtml(String destinatario, String assunto, String conteudoHtml) {
        log.info("Enviando email HTML para: {}", destinatario);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(remetente);
            helper.setTo(destinatario);
            helper.setSubject(assunto);
            helper.setText(conteudoHtml, true); // true = HTML

            mailSender.send(mimeMessage);

            log.info("Email HTML enviado com sucesso para: {}", destinatario);

        } catch (MessagingException e) {
            log.error("Erro ao enviar email HTML para: {}", destinatario, e);
            throw new RuntimeException("Falha ao enviar email HTML", e);
        }
    }

    /**
     * Envia email para múltiplos destinatários
     */
    @Async
    public void enviarEmailMultiplo(List<String> destinatarios, String assunto, String mensagem) {
        log.info("Enviando email para {} destinatários", destinatarios.size());

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(remetente);
            email.setTo(destinatarios.toArray(new String[0]));
            email.setSubject(assunto);
            email.setText(mensagem);

            mailSender.send(email);

            log.info("Email enviado com sucesso para {} destinatários", destinatarios.size());

        } catch (Exception e) {
            log.error("Erro ao enviar email para múltiplos destinatários", e);
            throw new RuntimeException("Falha ao enviar email múltiplo", e);
        }
    }

    /**
     * Envia email com cópia (CC)
     */
    @Async
    public void enviarEmailComCopia(String destinatario, String copia, String assunto, String mensagem) {
        log.info("Enviando email para: {} com cópia para: {}", destinatario, copia);

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(remetente);
            email.setTo(destinatario);
            email.setCc(copia);
            email.setSubject(assunto);
            email.setText(mensagem);

            mailSender.send(email);

            log.info("Email com cópia enviado com sucesso");

        } catch (Exception e) {
            log.error("Erro ao enviar email com cópia", e);
            throw new RuntimeException("Falha ao enviar email com cópia", e);
        }
    }

    /**
     * Monta template HTML padrão para emails
     */
    public String montarTemplateHtml(String titulo, String conteudo) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background-color: #FF6B9D;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background-color: #f9f9f9;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 0 0 5px 5px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            padding: 10px;
                            font-size: 12px;
                            color: #666;
                        }
                        .button {
                            display: inline-block;
                            padding: 10px 20px;
                            background-color: #FF6B9D;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>%s</h1>
                        <p>%s</p>
                    </div>
                    <div class="content">
                        %s
                    </div>
                    <div class="footer">
                        <p>Este é um email automático, por favor não responda.</p>
                        <p>&copy; 2025 %s - Todos os direitos reservados</p>
                    </div>
                </body>
                </html>
                """, nomeClinica, titulo, conteudo, nomeClinica);
    }

    /**
     * Envia email de boas-vindas
     */
    @Async
    public void enviarEmailBoasVindas(String destinatario, String nomeCliente) {
        log.info("Enviando email de boas-vindas para: {}", destinatario);

        String assunto = "Bem-vindo(a) à " + nomeClinica;
        String conteudo = String.format("""
                <p>Olá <strong>%s</strong>,</p>
                <p>Seja muito bem-vindo(a) à nossa clínica!</p>
                <p>Estamos muito felizes em tê-lo(a) como nosso cliente.</p>
                <p>Nossa equipe está preparada para oferecer os melhores tratamentos e cuidados para você.</p>
                <p>Em caso de dúvidas, estamos à disposição.</p>
                <p>Atenciosamente,<br>Equipe %s</p>
                """, nomeCliente, nomeClinica);

        String htmlCompleto = montarTemplateHtml("Bem-vindo(a)!", conteudo);
        enviarEmailHtml(destinatario, assunto, htmlCompleto);
    }

    /**
     * Envia email de recuperação de senha
     */
    @Async
    public void enviarEmailRecuperacaoSenha(String destinatario, String token) {
        log.info("Enviando email de recuperação de senha para: {}", destinatario);

        String assunto = "Recuperação de Senha - " + nomeClinica;
        String linkRecuperacao = "https://clinica.com/reset-password?token=" + token;

        String conteudo = String.format("""
                <p>Você solicitou a recuperação de senha da sua conta.</p>
                <p>Clique no botão abaixo para redefinir sua senha:</p>
                <p><a href="%s" class="button">Redefinir Senha</a></p>
                <p>Ou copie e cole o link abaixo no seu navegador:</p>
                <p><a href="%s">%s</a></p>
                <p>Este link é válido por 24 horas.</p>
                <p>Se você não solicitou esta recuperação, ignore este email.</p>
                """, linkRecuperacao, linkRecuperacao, linkRecuperacao);

        String htmlCompleto = montarTemplateHtml("Recuperação de Senha", conteudo);
        enviarEmailHtml(destinatario, assunto, htmlCompleto);
    }

    /**
     * Valida formato de email
     */
    public boolean validarEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        String regex = "^[A-Za-z0-9+_.-]+@(.+)$";
        return email.matches(regex);
    }
}