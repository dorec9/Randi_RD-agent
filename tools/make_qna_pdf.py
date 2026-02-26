import re
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def register_korean_font() -> str:
    font_candidates = [
        (r"C:\Windows\Fonts\malgun.ttf", "MalgunGothic"),
        (r"C:\Windows\Fonts\malgunbd.ttf", "MalgunGothicBold"),
        (r"C:\Windows\Fonts\gulim.ttf", "Gulim"),
    ]
    for path, name in font_candidates:
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))
            return name
    return "Helvetica"


def parse_qna(text: str):
    items = []
    current = None
    mode = None

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue

        q_match = re.match(r"^Q(\d+)\.\s*(.*)$", line)
        if q_match:
            if current:
                items.append(current)
            current = {
                "num": int(q_match.group(1)),
                "q": [q_match.group(2).strip()] if q_match.group(2).strip() else [],
                "a": [],
            }
            mode = "q"
            continue

        a_match = re.match(r"^A(\d+)\.\s*(.*)$", line)
        if a_match:
            if current is None:
                current = {"num": int(a_match.group(1)), "q": [], "a": []}
            if a_match.group(2).strip():
                current["a"].append(a_match.group(2).strip())
            mode = "a"
            continue

        if current is None:
            continue
        if mode == "a":
            current["a"].append(line)
        else:
            current["q"].append(line)

    if current:
        items.append(current)

    return items


def build_pdf(input_path: Path, output_path: Path):
    font_name = register_korean_font()
    text = input_path.read_text(encoding="utf-8")
    items = parse_qna(text)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=28,
        title="전체 QnA 합본",
        author="Codex",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleK",
        parent=styles["Title"],
        fontName=font_name,
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0A4A7A"),
        alignment=1,
        spaceAfter=6,
    )
    sub_style = ParagraphStyle(
        "SubK",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#5E6A73"),
        alignment=1,
        spaceAfter=20,
    )
    q_style = ParagraphStyle(
        "QStyle",
        parent=styles["BodyText"],
        fontName=font_name,
        fontSize=11.5,
        leading=17,
        textColor=colors.white,
    )
    a_style = ParagraphStyle(
        "AStyle",
        parent=styles["BodyText"],
        fontName=font_name,
        fontSize=10.8,
        leading=16,
        textColor=colors.HexColor("#1B1F23"),
    )
    note_style = ParagraphStyle(
        "NoteStyle",
        parent=styles["BodyText"],
        fontName=font_name,
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#8A949E"),
        alignment=1,
    )

    story = []
    story.append(Paragraph("전체 Q&amp;A 합본", title_style))
    story.append(
        Paragraph(
            f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')} / 총 {len(items)}개 질문",
            sub_style,
        )
    )
    story.append(Paragraph("발표용 요약본", note_style))
    story.append(Spacer(1, 14))

    card_width = doc.width
    for item in items:
        q_text = " ".join(item["q"]).strip()
        a_text = " ".join(item["a"]).strip() if item["a"] else "답변 미작성"

        q_para = Paragraph(f"<b>Q{item['num']}.</b> {q_text}", q_style)
        q_table = Table([[q_para]], colWidths=[card_width])
        q_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0A4A7A")),
                    ("BOX", (0, 0), (-1, -1), 0, colors.HexColor("#0A4A7A")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ]
            )
        )
        story.append(q_table)
        story.append(Spacer(1, 4))

        a_para = Paragraph(f"<b>A{item['num']}.</b> {a_text}", a_style)
        a_table = Table([[a_para]], colWidths=[card_width])
        a_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F6F9")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7DEE5")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ]
            )
        )
        story.append(a_table)
        story.append(Spacer(1, 12))

    def draw_page_num(canvas, _doc):
        canvas.saveState()
        canvas.setFont(font_name, 9)
        canvas.setFillColor(colors.HexColor("#6E7781"))
        canvas.drawRightString(A4[0] - 24, 16, f"{canvas.getPageNumber()}")
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_page_num, onLaterPages=draw_page_num)


if __name__ == "__main__":
    input_txt = Path(
        r"C:\Users\User\OneDrive\문서\카카오톡 받은 파일\전체_QnA_합본.txt"
    )
    output_pdf = input_txt.with_suffix(".pdf")
    build_pdf(input_txt, output_pdf)
    print(f"PDF generated: {output_pdf}")
