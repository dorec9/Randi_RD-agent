package com.example.agent_rnd.domain.notice;

import com.example.agent_rnd.domain.enums.ChecklistType;
import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@Entity
@Table(name = "checklists")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
public class ChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "checklist_id")
    private Long checklistId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    @Setter
    private ProjectNotice projectNotice;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private ChecklistType type;

    @Column(name = "content", nullable = false, length = 500)
    private String content;

    /* =========================
       정적 팩토리 메서드
       ========================= */

    public static ChecklistItem of(
            ProjectNotice projectNotice,
            ChecklistType type,
            String content
    ) {
        ChecklistItem checklistItem = ChecklistItem.builder()
                .projectNotice(projectNotice)
                .type(type)
                .content(content)
                .build();

        if (projectNotice != null) {
            projectNotice.addChecklistItem(checklistItem);
        }

        return checklistItem;
    }

    /* =========================
       동등성 비교 (PK 기준)
       ========================= */

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ChecklistItem)) return false;
        ChecklistItem that = (ChecklistItem) o;
        return checklistId != null && checklistId.equals(that.checklistId);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(checklistId);
    }
}