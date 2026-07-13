package com.platform.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
@ConditionalOnProperty(prefix = "minio", name = "endpoint")
public class MinioConfig {

	@Bean
	public MinioClient minioClient(
			@Value("${minio.endpoint}") String endpoint,
			@Value("${minio.access-key}") String accessKey,
			@Value("${minio.secret-key}") String secretKey
	) {
		return MinioClient.builder()
				.endpoint(endpoint)
				.credentials(accessKey, secretKey)
				.build();
	}
}
