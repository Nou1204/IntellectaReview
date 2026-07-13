package com.platform.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UpdateMetadataRequest {
    private String title;
    private String abstrakt;
    private List<String> authors;
    private List<String> keywords;
    private String correspondingAuthorEmail;
    private String publicationDate;
}