package com.platform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
public class FileStorageService {

    private final Path basePath;

    public FileStorageService(@Value("${storage.local.path:./storage}") String storagePath) throws IOException {
        this.basePath = Paths.get(storagePath).toAbsolutePath().normalize();
        if (!Files.exists(this.basePath)) {
            Files.createDirectories(this.basePath);
        }
        log.info("Local storage base path set to {}", this.basePath);
    }

    public String store(MultipartFile file, String relativeObjectPath) {
        try {
            Path target = basePath.resolve(relativeObjectPath).normalize();
            Path parent = target.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target);
            }
            return target.toAbsolutePath().toString();
        } catch (IOException ex) {
            log.error("Failed to store file {}: {}", relativeObjectPath, ex.getMessage(), ex);
            throw new RuntimeException("Failed to store file: " + ex.getMessage(), ex);
        }
    }

    public InputStream getFileByPath(String absolutePath) {
        try {
            Path p = Paths.get(absolutePath);
            return Files.newInputStream(p);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to read file: " + ex.getMessage(), ex);
        }
    }

    public void delete(String absolutePath) {
        try {
            Path p = Paths.get(absolutePath);
            if (Files.exists(p)) {
                Files.delete(p);
            }
        } catch (IOException ex) {
            log.warn("Failed to delete file {}: {}", absolutePath, ex.getMessage());
        }
    }
}
