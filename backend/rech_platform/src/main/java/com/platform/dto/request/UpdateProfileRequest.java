package com.platform.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
	@Size(min = 2, max = 150)
	private String name;

	@Size(max = 2000)
	private String bio;

	@Size(max = 255)
	private String affiliation;
}
