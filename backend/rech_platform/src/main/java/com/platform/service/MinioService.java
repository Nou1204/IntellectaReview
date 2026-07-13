package com.platform.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import io.minio.GetObjectArgs;
import java.io.InputStream;
import java.net.URI;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "minio", name = "endpoint")
public class MinioService {

	private final MinioClient minioClient;

	@Value("${minio.bucket-name}")
	private String bucketName;

	@Value("${minio.endpoint}")
	private String endpoint;

	public String uploadPdf(MultipartFile file, String objectName) {
		try {
			ensureBucketExists();
			try (InputStream inputStream = file.getInputStream()) {
				minioClient.putObject(
						PutObjectArgs.builder()
								.bucket(bucketName)
								.object(objectName)
								.stream(inputStream, file.getSize(), -1)
								.contentType(file.getContentType() == null ? "application/pdf" : file.getContentType())
								.build()
				);
			}
			return buildObjectUrl(objectName);
		} catch (Exception ex) {
			log.error("MinIO upload failed. endpoint={}, bucket={}, object={}, reason={}", endpoint, bucketName, objectName, ex.getMessage(), ex);
			throw new ResponseStatusException(
					HttpStatus.SERVICE_UNAVAILABLE,
					"Unable to upload file to storage at " + endpoint + " (bucket: " + bucketName + "). Cause: " + ex.getMessage(),
					ex
			);
		}
	}

	private void ensureBucketExists() throws Exception {
		boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
		if (!exists) {
			minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
		}
	}

	private String buildObjectUrl(String objectName) {
		String base = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
		return base + "/" + bucketName + "/" + objectName;
	}
	public InputStream getFile(String objectName) {
		try {
			return minioClient.getObject(
					GetObjectArgs.builder()
							.bucket(bucketName)
							.object(objectName)
							.build()
			);
		} catch (Exception e) {
			throw new RuntimeException("Failed to get file from MinIO: " + e.getMessage());
		}
	}

	public InputStream getFileByUrl(String fileUrl) {
		String objectName = extractObjectNameFromUrl(fileUrl);
		return getFile(objectName);
	}

	private String extractObjectNameFromUrl(String fileUrl) {
		try {
			String path = URI.create(fileUrl).getPath();
			String prefix = "/" + bucketName + "/";
			int prefixIndex = path.indexOf(prefix);
			if (prefixIndex < 0) {
				throw new IllegalArgumentException("URL does not contain bucket path");
			}

			String objectName = path.substring(prefixIndex + prefix.length());
			if (objectName.isBlank()) {
				throw new IllegalArgumentException("Missing object path in URL");
			}
			return objectName;
		} catch (Exception e) {
			throw new RuntimeException("Invalid file URL for MinIO object extraction", e);
		}
	}
}
