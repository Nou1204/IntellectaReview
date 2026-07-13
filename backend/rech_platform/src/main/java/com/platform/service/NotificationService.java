package com.platform.service;

import com.platform.dto.response.NotificationResponse;
import com.platform.entity.Notification;
import com.platform.entity.User;
import com.platform.exception.ResourceNotFoundException;
import com.platform.repository.NotificationRepository;
import com.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(Long userId, String title, String message, String type, Long referenceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listCurrentUserNotifications(String email) {
        Long userId = getUserByEmail(email).getId();
        return notificationRepository.findTop100ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnread(String email) {
        Long userId = getUserByEmail(email).getId();
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markOneRead(String email, Long notificationId) {
        Long userId = getUserByEmail(email).getId();
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public int markAllRead(String email) {
        Long userId = getUserByEmail(email).getId();
        return notificationRepository.markAllReadByUserId(userId);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
