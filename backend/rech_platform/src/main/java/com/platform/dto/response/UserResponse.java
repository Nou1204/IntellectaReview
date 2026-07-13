package com.platform.dto.response;

import com.platform.entity.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private String bio;
    private String affiliation;
    private List<String> expertise;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setName(user.getName());
        r.setEmail(user.getEmail());
        r.setRole(user.getRole().name());
        r.setStatus(user.getStatus().name());
        r.setBio(user.getBio());
        r.setAffiliation(user.getAffiliation());
        r.setExpertise(user.getExpertise());
        r.setCreatedAt(user.getCreatedAt());
        return r;
    }
}