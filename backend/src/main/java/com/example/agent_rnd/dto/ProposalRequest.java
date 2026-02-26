package com.example.agent_rnd.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProposalRequest {
    private Long noticeId;
    private Long userId;
    private String title;
    private String fileName;
    private String parsedJson; // 프론트에서 파싱된 JSON 문자열을 보냄
}