package com.platform.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignCheckerRequest {

    @NotNull
    private Long checkerId;

    private String notes;
}
