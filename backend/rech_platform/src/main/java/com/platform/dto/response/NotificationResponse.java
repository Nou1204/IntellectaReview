package com.platform.dto.response;

import com.platform.entity.Notification;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private String type;
    private boolean read;
    private Long referenceId;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setType(notification.getType());
        response.setRead(notification.isRead());
        response.setReferenceId(notification.getReferenceId());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}
