package com.platform.dto.response;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class ExtractedMetadataResponse {
    private String title = "";
    private String abstrakt = "";
    private String correspondingAuthorEmail = "";
    private List<String> authors = new ArrayList<>();
    private List<String> keywords = new ArrayList<>();
    private String publicationDate = "";
    private String arxivId = "";

    public void setAbstract(String text) {
        this.abstrakt = text;
    }
}