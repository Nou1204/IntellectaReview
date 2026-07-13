package com.platform.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class UpdateExpertiseRequest {
	private List<String> expertise;
}
