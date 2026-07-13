package com.platform.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, Object>> handleResponseStatus(
			ResponseStatusException ex,
			HttpServletRequest request
	) {
		HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
		return ResponseEntity.status(status).body(errorBody(status, ex.getReason(), request.getRequestURI()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(
			MethodArgumentNotValidException ex,
			HttpServletRequest request
	) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(this::formatFieldError)
				.orElse("Validation failed");
		return ResponseEntity.badRequest().body(errorBody(HttpStatus.BAD_REQUEST, message, request.getRequestURI()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex, HttpServletRequest request) {
		log.error("Unhandled exception for path {}: {}", request.getRequestURI(), ex.getMessage(), ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request.getRequestURI()));
	}

	private String formatFieldError(FieldError fieldError) {
		return fieldError.getField() + ": " + fieldError.getDefaultMessage();
	}

	private Map<String, Object> errorBody(HttpStatus status, String message, String path) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("timestamp", OffsetDateTime.now());
		body.put("status", status.value());
		body.put("error", status.getReasonPhrase());
		body.put("message", message == null ? status.getReasonPhrase() : message);
		body.put("path", path);
		return body;
	}
}
