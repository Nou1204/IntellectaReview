package com.platform.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class BulkAssignmentRequest {
    private List<Long> reviewerIds;
}
