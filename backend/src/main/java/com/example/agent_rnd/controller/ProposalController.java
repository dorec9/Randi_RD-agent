package com.example.agent_rnd.controller;

import com.example.agent_rnd.dto.ProposalRequest;
import com.example.agent_rnd.service.ProposalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/proposals")
public class ProposalController {

    private final ProposalService proposalService;

    /**
     * 제안서 파일 업로드 API (DOCX, PDF 지원)
     * RequestPart: file(실제파일), data(JSON 데이터)
     */
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<Long> uploadProposal(
            @RequestPart("file") MultipartFile file,
            @RequestPart("data") ProposalRequest request
    ) {
        // 서비스에게 파일 처리를 맡김
        Long savedId = proposalService.processProposalFile(file, request);
        return ResponseEntity.ok(savedId);
    }

    // 조회 API
    @GetMapping("/{proposalId}")
    public ResponseEntity<?> getProposal(@PathVariable Long proposalId) {
        return ResponseEntity.ok(proposalService.getProposal(proposalId));
    }
}