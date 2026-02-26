import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import "../styles/Global.css";

type Slot = {
  id: string;
  file: File | null;
};

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const FileUploadPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Slot[]>([]);

  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [dragOverEmpty, setDragOverEmpty] = useState(false);

  const [showDone, setShowDone] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const hasAnyFile = useMemo(() => slots.some((s) => s.file), [slots]);

  const ensureTrailingEmpty = (arr: Slot[]) => {
    if (arr.length === 0) return arr;
    const last = arr[arr.length - 1];
    if (last.file !== null) arr.push({ id: uid(), file: null });
    return arr;
  };

  const normalizeEmptyState = (arr: Slot[]) => {
    const any = arr.some((s) => s.file);
    if (!any) return [];
    return ensureTrailingEmpty(arr);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const addFilesToSlots = (files: File[], startIndex?: number) => {
    if (!files.length) return;

    setSlots((prev) => {
      let next = [...prev];

      if (next.length === 0) {
        next = files.map((f) => ({ id: uid(), file: f }));
        next.push({ id: uid(), file: null }); 
        return next;
      }

      let idx =
        typeof startIndex === "number"
          ? startIndex
          : next.findIndex((s) => s.file === null);

      if (idx < 0) idx = next.length; 

      const need = idx + files.length;
      while (next.length < need) next.push({ id: uid(), file: null });

      files.forEach((f, i) => {
        next[idx + i] = { ...next[idx + i], file: f };
      });

      return normalizeEmptyState(next);
    });
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    addFilesToSlots(list);
    e.target.value = "";
  };

  const removeAt = (slotId: string) => {
    setSlots((prev) => {
      const next = prev.map((s) => (s.id === slotId ? { ...s, file: null } : s));

      const withFiles = next.filter((s) => s.file !== null);
      if (withFiles.length === 0) return [];

      return [...withFiles, { id: uid(), file: null }];
    });
  };

  const submitFiles = () => {
    const files = slots.filter((s) => s.file).map((s) => s.file!) as File[];
    if (files.length === 0) {
      alert("첨부할 파일이 없습니다.");
      return;
    }

    console.log("제출 파일:", files);

    setSubmittedCount(files.length);
    setShowDone(true);
  };

  const onEmptyDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverEmpty(true);
  };
  const onEmptyDragLeave = () => setDragOverEmpty(false);
  const onEmptyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverEmpty(false);
    const files = Array.from(e.dataTransfer.files || []);
    addFilesToSlots(files);
  };

  const onRowDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlotId(slotId);
  };
  const onRowDragLeave = () => setDragOverSlotId(null);
  const onRowDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setDragOverSlotId(null);
    const files = Array.from(e.dataTransfer.files || []);
    addFilesToSlots(files, slotIndex);
  };

  return (
    <Page>
      <Card>
        <div className="title" style={{ marginLeft: 0, marginBottom: 18 }}>
          문서 파싱 페이지
        </div>

        {!hasAnyFile ? (
          <EmptyStage
            data-dragover={dragOverEmpty}
            onDragOver={onEmptyDragOver}
            onDragLeave={onEmptyDragLeave}
            onDrop={onEmptyDrop}
          >
            <BigBtn type="button" onClick={openFilePicker}>
              파일 등록
            </BigBtn>
            <Hint>또는 파일을 여기에 두기</Hint>

            <Guide>
              텍스트 추출이 어려운 이미지 위주의 파일은
              <br />
              성능이 떨어질 수 있습니다
              <br />
              느낌의 안내말
            </Guide>
          </EmptyStage>
        ) : (
          <ListStage>
            <ListPanel>
              <ListHeader>파일명</ListHeader>

              <Rows>
                {slots.map((slot, idx) => (
                  <Row
                    key={slot.id}
                    data-dragover={dragOverSlotId === slot.id}
                    onDragOver={(e) => onRowDragOver(e, slot.id)}
                    onDragLeave={onRowDragLeave}
                    onDrop={(e) => onRowDrop(e, idx)}
                    onClick={() => {
                      if (slot.file === null) openFilePicker();
                    }}
                    title="이 행에 파일 드롭 가능"
                  >
                    <FileName>
                      {slot.file ? (
                        slot.file.name
                      ) : (
                        <Placeholder>여기에 파일을 드래그해서 추가</Placeholder>
                      )}
                    </FileName>

                    <RowActions>
                      {slot.file ? (
                        <SmallGhostBtn type="button" onClick={() => removeAt(slot.id)}>
                          삭제
                        </SmallGhostBtn>
                      ) : (
                        <SmallGhostBtn type="button" onClick={openFilePicker}>
                          선택
                        </SmallGhostBtn>
                      )}
                    </RowActions>
                  </Row>
                ))}
              </Rows>

              <SubmitArea>
                <SmallBtn type="button" onClick={submitFiles}>
                  첨부파일 제출
                </SmallBtn>
              </SubmitArea>
            </ListPanel>
          </ListStage>
        )}

        {/* 숨김 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          // accept=".hwp,.hwpx,.pdf,.xlsx,.xls,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={onPickFiles}
        />

        {/* 업로드 완료 모달 */}
        {showDone && (
          <ModalOverlay
            onClick={() => {
              setShowDone(false);
            }}
          >
            <ModalCard onClick={(e) => e.stopPropagation()}>
              <ModalTitle>업로드 완료</ModalTitle>
              <ModalDesc>총 {submittedCount}개 파일이 제출되었습니다.</ModalDesc>

              <ModalActions>
                <SmallBtn
                  type="button"
                  onClick={() => {
                    setShowDone(false);
                    navigate("/draft");
                  }}
                >
                  확인
                </SmallBtn>
              </ModalActions>
            </ModalCard>
          </ModalOverlay>
        )}
      </Card>
    </Page>
  );
};

export default FileUploadPage;

const Page = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 30px 0;
  box-sizing: border-box;
`;

const Card = styled.div`
  width: 1100px;
  background: #ffffff;
  border-radius: 12px;
  padding: 28px;
  box-sizing: border-box;
`;

const EmptyStage = styled.div`
  height: 520px;
  border-radius: 12px;
  background: #ffffff;
  border: 2px dashed rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;

  &[data-dragover="true"] {
    background: rgba(0, 0, 0, 0.03);
    border-color: rgba(0, 0, 0, 0.22);
  }
`;

const BigBtn = styled.button`
  width: 260px;
  height: 62px;
  background: #f5f5f7;
  border: 1px solid rgba(0, 0, 0, 0.28);
  border-radius: 2px;
  cursor: pointer;
  font-size: 22px;
  font-weight: 600;

  &:hover {
    background: #eeeeef;
  }
`;

const Hint = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
`;

const Guide = styled.div`
  margin-top: 52px;
  text-align: center;
  font-size: 14px;
  line-height: 1.45;
  color: rgba(0, 0, 0, 0.7);
`;

const ListStage = styled.div`
  margin-top: 8px;
`;

const ListPanel = styled.div`
  position: relative;
  margin-top: 14px;
  background: #d9d9d9;
  border-radius: 0px;
  padding: 26px 28px;
  padding-bottom: 90px;
  min-height: 520px;
  box-sizing: border-box;
`;

const ListHeader = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: default;

  &[data-dragover="true"] {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(0, 0, 0, 0.18);
  }
`;

const FileName = styled.div`
  font-size: 14px;
`;

const Placeholder = styled.span`
  color: rgba(0, 0, 0, 0.55);
`;

const RowActions = styled.div`
  display: flex;
  gap: 8px;
`;

const SubmitArea = styled.div`
  position: absolute;
  display: flex;
  justify-content: flex-end;
  right: 28px;
  bottom: 28px;
`;

const SmallBtn = styled.button`
  width: 130px;
  height: 40px;
  background: #f5f5f7;
  border: 1px solid rgba(0, 0, 0, 0.28);
  border-radius: 2px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background: #eeeeef;
  }
`;

const SmallGhostBtn = styled.button`
  width: 64px;
  height: 34px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f7f7f7;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
`;

const ModalCard = styled.div`
  width: 420px;
  max-width: 92vw;
  background: #ffffff;
  border-radius: 12px;
  padding: 18px;
  box-sizing: border-box;
`;

const ModalTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const ModalDesc = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
`;

const ModalActions = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`;
