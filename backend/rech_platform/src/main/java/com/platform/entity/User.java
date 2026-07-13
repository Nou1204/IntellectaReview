package com.platform.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User implements UserDetails {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, length = 150)
        private String name;

        @Column(nullable = false, unique = true, length = 255)
        private String email;

        @Column(nullable = false)
        private String password;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        @Builder.Default
        private Role role = Role.RESEARCHER;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        @Builder.Default
        private Status status = Status.PENDING;

        @Column(columnDefinition = "TEXT")
        private String bio;

        @Column(length = 255)
        private String affiliation;
        @JdbcTypeCode(SqlTypes.JSON)
        @Column(columnDefinition = "jsonb", nullable = false)
        @Builder.Default
        private List<String> expertise = new ArrayList<>();

        @Column(name = "avatar_url", length = 500)
        private String avatarUrl;

        @CreatedDate
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @LastModifiedDate
        @Column(name = "updated_at", nullable = false)
        private LocalDateTime updatedAt;

        public enum Role   { RESEARCHER, CHECKER, ADMIN }
        public enum Status { PENDING, ACTIVE, SUSPENDED  }
        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
                return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
        }

        @Override
        public String getPassword() { return password; }

        @Override
        public String getUsername() { return email; }

        @Override
        public boolean isAccountNonExpired() { return true; }

        @Override
        public boolean isAccountNonLocked() { return true; }

        @Override
        public boolean isCredentialsNonExpired() { return true; }

        @Override
        public boolean isEnabled() { return status == Status.ACTIVE; }
}


