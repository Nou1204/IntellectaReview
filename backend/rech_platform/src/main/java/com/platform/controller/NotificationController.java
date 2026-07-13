package com.platform.controller;

import com.platform.dto.response.NotificationResponse;
import com.platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(Authentication authentication) {
        List<NotificationResponse> items = notificationService.listCurrentUserNotifications(authentication.getName());
        long unreadCount = notificationService.countUnread(authentication.getName());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("unreadCount", unreadCount);
        payload.put("items", items);
        return ResponseEntity.ok(payload);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markOneRead(@PathVariable Long id, Authentication authentication) {
        notificationService.markOneRead(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(Authentication authentication) {
        int updated = notificationService.markAllRead(authentication.getName());
        Map<String, Integer> payload = new LinkedHashMap<>();
        payload.put("updated", updated);
        return ResponseEntity.ok(payload);
    }
}
