import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import "../styles/Global.css";

type FieldKey = "need1" | "need2" | "need3" | "need4";

const DraftPage: React.FC = () => {
  const navigate = useNavigate();

  const [need1, setNeed1] = useState("");
  const [need2, setNeed2] = useState("");
  const [need3, setNeed3] = useState("");
  const [need4, setNeed4] = useState("");

  const need1Ref = useRef<HTMLTextAreaElement | null>(null);
  const need2Ref = useRef<HTMLTextAreaElement | null>(null);
  const need3Ref = useRef<HTMLTextAreaElement | null>(null);
  const need4Ref = useRef<HTMLTextAreaElement | null>(null);

  const requiredFields = useMemo(
    () => [
      { key: "need1" as FieldKey, label: "필요 내용 1", value: need1, ref: need1Ref },
      { key: "need2" as FieldKey, label: "필요 내용 2", value: need2, ref: need2Ref },
      { key: "need3" as FieldKey, label: "필요 내용 3", value: need3, ref: need3Ref },
      { key: "need4" as FieldKey, label: "필요 내용 4", value: need4, ref: need4Ref },
    ],
    [need1, need2, need3, need4]
  );

  const isEmpty = (v: string) => !v.trim();

  const focusFirstEmpty = () => {
    const firstEmpty = requiredFields.find((f) => isEmpty(f.value));
    if (!firstEmpty) return false;

    alert(`${firstEmpty.label}를 적어 주세요`);

    const el = firstEmpty.ref.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus(), 150);
    }
    return true;
  };

  const submitDraft = () => {
    if (focusFirstEmpty()) return;

    const toLines = (v: string) =>
      v
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

    const payload = {
      need1: toLines(need1),
      need2: toLines(need2),
      need3: toLines(need3),
      need4: toLines(need4),
    };

    console.log("초안 제출:", payload);
    alert("초안이 제출되었습니다. (콘솔 확인)");
  };

  return (
    <Page>
      <Card>
        <Inner>
          <SectionTitle>초안 작성</SectionTitle>

          <FormArea>
            <FormInner>
              <Field>
                <Label>필요 내용 1</Label>
                <TextArea
                  ref={need1Ref}
                  value={need1}
                  onChange={(e) => setNeed1(e.target.value)}
                />
              </Field>

              <Field>
                <Label>필요 내용 2</Label>
                <TextArea
                  ref={need2Ref}
                  value={need2}
                  onChange={(e) => setNeed2(e.target.value)}
                />
              </Field>

              <Field>
                <Label>필요 내용 3</Label>
                <TextArea
                  ref={need3Ref}
                  value={need3}
                  onChange={(e) => setNeed3(e.target.value)}
                />
              </Field>

              <Field>
                <Label>필요 내용 4</Label>
                <TextArea
                  ref={need4Ref}
                  value={need4}
                  onChange={(e) => setNeed4(e.target.value)}
                />
              </Field>

              <SubmitRow>
                <SmallBtn type="button" onClick={submitDraft}>
                  초안 제출
                </SmallBtn>
              </SubmitRow>
            </FormInner>
          </FormArea>

          <BackRow>
            <GhostBtn type="button" onClick={() => navigate(-1)}>
              뒤로
            </GhostBtn>
          </BackRow>
        </Inner>
      </Card>
    </Page>
  );
};

export default DraftPage;

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
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
`;

const Inner = styled.div`
  padding: 18px;
`;

const SectionTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const FormArea = styled.div`
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
`;

const FormInner = styled.div`
  padding: 22px;
  box-sizing: border-box;
`;

const Field = styled.div`
  margin-bottom: 22px;
`;

const Label = styled.div`
  font-size: 13px;
  margin-bottom: 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  background: #d9d9d9;
  border: none;
  outline: none;
  padding: 12px;
  border-radius: 2px;
  box-sizing: border-box;
  resize: vertical;
  line-height: 1.4;
`;

const SubmitRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`;

const SmallBtn = styled.button`
  width: 110px;
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

const BackRow = styled.div`
  margin-top: 10px;
`;

const GhostBtn = styled.button`
  height: 34px;
  padding: 0 10px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f7f7f7;
  }
`;
