package com.platform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@platform.com}")
    private String fromAddress;

    // Helper method to guarantee a valid email address structure
    private String getValidFromAddress() {
        if (fromAddress == null || fromAddress.trim().isEmpty() || fromAddress.contains("${")) {
            return "no-reply@platform.com"; // Force a valid fallback globally if properties fail
        }
        return fromAddress;
    }

    public void sendText(String to, String subject, String body) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            
            // FIX: Use the clean address tracker
            helper.setFrom(getValidFromAddress());
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    public void sendTextWithAttachments(String to, String subject, String body, List<Attachment> attachments) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            
            // FIX: Use the clean address tracker
            helper.setFrom(getValidFromAddress());
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            for (Attachment attachment : attachments) {
                helper.addAttachment(attachment.fileName(), new ByteArrayResource(attachment.bytes()));
            }
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send email with attachments to {}: {}", to, ex.getMessage());
        }
    }

    public record Attachment(String fileName, byte[] bytes) {}

    public static Attachment attachment(String fileName, InputStream stream) {
        try {
            return new Attachment(fileName, stream.readAllBytes());
        } catch (Exception ex) {
            throw new RuntimeException("Failed to read attachment: " + ex.getMessage(), ex);
        }
    }
}