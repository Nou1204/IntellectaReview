package com.platform.service;

import com.platform.dto.response.ExtractedMetadataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GrobidService {

    @Value("${grobid.url:http://localhost:8070}")
    private String grobidUrl;

    private final RestTemplate restTemplate;

    public ExtractedMetadataResponse extractMetadata(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDF file is required for metadata extraction");
        }

        try {
            ExtractedMetadataResponse headerMetadata = extractFromGrobidEndpoint(file, "/api/processHeaderDocument", "consolidateHeader");
            if (!hasCoreMetadata(headerMetadata)) {
                log.debug("GROBID header extraction was sparse, retrying with full-text extraction");
                ExtractedMetadataResponse fullTextMetadata = extractFromGrobidEndpoint(file, "/api/processFulltextDocument", "consolidateHeader");
                mergeMissingFields(headerMetadata, fullTextMetadata);
            }

            return headerMetadata;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("GROBID extraction failed: {}", e.getMessage(), e);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Failed to call GROBID service: " + e.getMessage(),
                    e
            );
        }
    }

    private ExtractedMetadataResponse extractFromGrobidEndpoint(
            MultipartFile file,
            String endpoint,
            String consolidateFlagName
    ) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setAccept(List.of(MediaType.APPLICATION_XML, MediaType.TEXT_XML, MediaType.ALL));

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("input", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });
        body.add(consolidateFlagName, "1");

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(
                grobidUrl + endpoint,
                request,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GROBID returned non-success status: " + response.getStatusCode().value()
            );
        }

        String xml = response.getBody();
        if (xml == null || xml.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "GROBID returned empty XML response");
        }

        return parseTeiXml(xml);
    }

    private boolean hasCoreMetadata(ExtractedMetadataResponse metadata) {
        return metadata != null
                && metadata.getTitle() != null && !metadata.getTitle().isBlank()
                && metadata.getAbstrakt() != null && !metadata.getAbstrakt().isBlank()
                && metadata.getAuthors() != null && !metadata.getAuthors().isEmpty();
    }

    private void mergeMissingFields(ExtractedMetadataResponse target, ExtractedMetadataResponse fallback) {
        if (target == null || fallback == null) {
            return;
        }

        if ((target.getTitle() == null || target.getTitle().isBlank()) && fallback.getTitle() != null && !fallback.getTitle().isBlank()) {
            target.setTitle(fallback.getTitle());
        }
        if ((target.getAbstrakt() == null || target.getAbstrakt().isBlank()) && fallback.getAbstrakt() != null && !fallback.getAbstrakt().isBlank()) {
            target.setAbstract(fallback.getAbstrakt());
        }
        if ((target.getAuthors() == null || target.getAuthors().isEmpty()) && fallback.getAuthors() != null && !fallback.getAuthors().isEmpty()) {
            target.setAuthors(new ArrayList<>(fallback.getAuthors()));
        }
        if ((target.getKeywords() == null || target.getKeywords().isEmpty()) && fallback.getKeywords() != null && !fallback.getKeywords().isEmpty()) {
            target.setKeywords(new ArrayList<>(fallback.getKeywords()));
        }
        if ((target.getPublicationDate() == null || target.getPublicationDate().isBlank())
                && fallback.getPublicationDate() != null && !fallback.getPublicationDate().isBlank()) {
            target.setPublicationDate(fallback.getPublicationDate());
        }
        if ((target.getArxivId() == null || target.getArxivId().isBlank())
                && fallback.getArxivId() != null && !fallback.getArxivId().isBlank()) {
            target.setArxivId(fallback.getArxivId());
        }
    }

    private ExtractedMetadataResponse parseTeiXml(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes()));
        doc.getDocumentElement().normalize();

        ExtractedMetadataResponse result = new ExtractedMetadataResponse();

        result.setTitle(extractTitle(doc));
        result.setAbstract(extractAbstract(doc));
        result.setAuthors(extractAuthors(doc));
        result.setKeywords(extractKeywords(doc));

        // Extract publication date
        NodeList dates = doc.getElementsByTagNameNS("*", "date");
        for (int i = 0; i < dates.getLength(); i++) {
            Element el = (Element) dates.item(i);
            if ("published".equals(el.getAttribute("type"))) {
                result.setPublicationDate(el.getAttribute("when"));
                break;
            }
        }

        // Extract arXiv ID
        NodeList idnos = doc.getElementsByTagNameNS("*", "idno");
        for (int i = 0; i < idnos.getLength(); i++) {
            Element el = (Element) idnos.item(i);
            if ("arXiv".equals(el.getAttribute("type"))) {
                result.setArxivId(el.getTextContent().trim());
                break;
            }
        }

        return result;
    }

    private String extractTitle(Document doc) {
        NodeList titleStatements = doc.getElementsByTagNameNS("*", "titleStmt");
        for (int i = 0; i < titleStatements.getLength(); i++) {
            Element titleStmt = (Element) titleStatements.item(i);
            String title = findFirstTextByTagName(titleStmt, "title", "main");
            if (!title.isBlank()) {
                return title;
            }
            title = findFirstTextByTagName(titleStmt, "title", null);
            if (!title.isBlank()) {
                return title;
            }
        }

        NodeList titles = doc.getElementsByTagNameNS("*", "title");
        for (int i = 0; i < titles.getLength(); i++) {
            Element el = (Element) titles.item(i);
            String candidate = el.getTextContent() == null ? "" : el.getTextContent().trim();
            if (!candidate.isBlank()) {
                return candidate;
            }
        }
        return "";
    }

    private String extractAbstract(Document doc) {
        NodeList abstracts = doc.getElementsByTagNameNS("*", "abstract");
        for (int i = 0; i < abstracts.getLength(); i++) {
            String candidate = abstracts.item(i).getTextContent() == null ? "" : abstracts.item(i).getTextContent().trim();
            if (!candidate.isBlank()) {
                return candidate;
            }
        }

        NodeList divs = doc.getElementsByTagNameNS("*", "div");
        for (int i = 0; i < divs.getLength(); i++) {
            Element div = (Element) divs.item(i);
            if ("abstract".equalsIgnoreCase(div.getAttribute("type"))) {
                String candidate = div.getTextContent() == null ? "" : div.getTextContent().trim();
                if (!candidate.isBlank()) {
                    return candidate;
                }
            }
        }

        return "";
    }

    private List<String> extractAuthors(Document doc) {
        List<String> authors = new ArrayList<>();

        NodeList titleStatements = doc.getElementsByTagNameNS("*", "titleStmt");
        for (int i = 0; i < titleStatements.getLength(); i++) {
            Element titleStmt = (Element) titleStatements.item(i);

            NodeList authorNodes = titleStmt.getElementsByTagNameNS("*", "author");
            for (int j = 0; j < authorNodes.getLength(); j++) {
                Element author = (Element) authorNodes.item(j);
                String authorName = extractPersonName(author);
                if (!authorName.isBlank() && !authors.contains(authorName)) {
                    authors.add(authorName);
                }
            }

            if (!authors.isEmpty()) {
                return authors;
            }
        }

        NodeList persNames = doc.getElementsByTagNameNS("*", "persName");
        for (int i = 0; i < persNames.getLength(); i++) {
            Element persName = (Element) persNames.item(i);
            String authorName = extractPersonName(persName);
            if (!authorName.isBlank() && !authors.contains(authorName)) {
                authors.add(authorName);
            }
        }
        return authors;
    }

    private List<String> extractKeywords(Document doc) {
        List<String> keywords = new ArrayList<>();

        NodeList keywordGroups = doc.getElementsByTagNameNS("*", "keywords");
        for (int i = 0; i < keywordGroups.getLength(); i++) {
            Element keywordGroup = (Element) keywordGroups.item(i);
            NodeList terms = keywordGroup.getElementsByTagNameNS("*", "term");
            for (int j = 0; j < terms.getLength(); j++) {
                String term = terms.item(j).getTextContent();
                if (term == null) {
                    continue;
                }
                String normalized = term.trim();
                if (!normalized.isEmpty() && !keywords.contains(normalized)) {
                    keywords.add(normalized);
                }
            }
            if (!keywords.isEmpty()) {
                return keywords;
            }
        }

        NodeList terms = doc.getElementsByTagNameNS("*", "term");
        for (int i = 0; i < terms.getLength(); i++) {
            String term = terms.item(i).getTextContent();
            if (term != null) {
                String normalized = term.trim();
                if (!normalized.isEmpty() && !keywords.contains(normalized)) {
                    keywords.add(normalized);
                }
            }
        }
        return keywords;
    }

    private String extractPersonName(Element element) {
        String forename = getFirstTagText(element, "forename");
        String surname = getFirstTagText(element, "surname");
        if (!forename.isEmpty() || !surname.isEmpty()) {
            return (forename + " " + surname).trim();
        }

        String rawName = element.getTextContent() == null ? "" : element.getTextContent().trim();
        return rawName;
    }

    private String findFirstTextByTagName(Element parent, String tagName, String typeValue) {
        NodeList nodes = parent.getElementsByTagNameNS("*", tagName);
        String fallback = "";
        for (int i = 0; i < nodes.getLength(); i++) {
            Element el = (Element) nodes.item(i);
            String candidate = el.getTextContent() == null ? "" : el.getTextContent().trim();
            if (candidate.isBlank()) {
                continue;
            }
            if (typeValue != null && typeValue.equalsIgnoreCase(el.getAttribute("type"))) {
                return candidate;
            }
            if (fallback.isBlank()) {
                fallback = candidate;
            }
        }
        return fallback;
    }

    private String getFirstTagText(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagNameNS("*", tagName);
        if (nodes.getLength() > 0) {
            return nodes.item(0).getTextContent().trim();
        }
        return "";
    }
}