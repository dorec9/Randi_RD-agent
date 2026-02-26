# -*- coding: utf-8 -*-
from pathlib import Path
from tempfile import TemporaryDirectory
import os

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


QNA_ITEMS = [
    (
        "정확히 무엇을 자동화하는 서비스인가요?",
        "저희의 서비스는 복잡한 국가 R&D 제안 준비 과정을 전반적으로 자동화해주는 플랫폼입니다. "
        "핵심 기능은 4가지입니다. 1) 공고문 분석 및 체크리스트 생성 2) 유사 RFP 제공 "
        "3) 발표용 PPT 생성 4) PPT 예상 질문 및 답변 대본 생성",
    ),
    (
        "기존 PPT 제작 대비 얼마나 줄이나요?",
        "보통 몇 시간 걸리던 PPT 작업 시간을 크게 줄이는 것이 핵심입니다. "
        "저희 플랫폼은 분 단위 단축을 목표로 만들었고, PPT는 약 10분 정도 소요됩니다.",
    ),
    (
        "PPT 결과 품질은 사람 작업 대비 어느 정도인가요? 바로 사용할 수 있는 완성도인가요?",
        "바로 사용할 수 있을 정도의 완성도를 목표로 진행했고, 실제로도 전체 발표 흐름과 "
        "슬라이드 구성이 자연스럽게 나오도록 구현했습니다. 결과물은 일반 PPT 파일로 생성되기 때문에 "
        "필요하면 사용자가 직접 수정해 맞춤형으로 사용할 수 있습니다.",
    ),
    (
        "PPT는 전체적으로 어떻게 만들었나요?",
        "사용자가 작성한 제안서를 입력받아 텍스트를 추출하고 섹션 분리를 통해 1차 데이터 처리를 합니다. "
        "그 후 제미나이를 통해 전체 슬라이드 구성을 설계하고, 감마가 설계안을 토대로 도형/다이어그램 등 "
        "시각 요소를 추가해 PPT 파일을 만듭니다. 이후 제미나이 이미지 모델로 감마가 생성하지 못하는 "
        "고수준 시각 요소를 보강하고, 후처리로 완성도를 높였습니다.",
    ),
    (
        "왜 특정 부처/기관 양식 기준으로 만들었나요?",
        "처음에는 범용 자동화를 목표로 했지만, 기관마다 양식 차이가 커서 품질이 불안정했습니다. "
        "그래서 현재는 한 개 양식에 맞춰 품질과 재현성을 먼저 확보했고, 이후에는 기관별 "
        "템플릿/프롬프트 분기 방식으로 확장 설계가 가능합니다.",
    ),
    (
        "수정 가능한가요?",
        "일반적으로 사용하는 PPT 파일로 만들어지기 때문에 사용자가 직접 수정 가능합니다.",
    ),
    (
        "API 호출 비용은 어느 정도 드나요?",
        "감마 기준으로 1회 생성에 약 200토큰 정도 사용됩니다. 실제로는 PPT 1회 생성당 "
        "약 1,300원 수준으로 볼 수 있습니다.",
    ),
    (
        "지금 단계가 데모인가요, 상용화인가요?",
        "현재는 특정 양식 기준으로 동작하는 데모 단계입니다. 핵심 생성 흐름은 구현했고, "
        "상용화를 위해서는 보안, 운영, 템플릿 확장이 필요합니다. 핵심 파이프라인은 완성된 상태라 "
        "실제 서비스형으로 확장 가능한 단계입니다.",
    ),
    (
        "하드코딩으로 구현한 이유는 무엇인가요?",
        "현재는 데모 안정성과 품질 확보를 위해 일부 레이아웃/배경/텍스트 위치를 하드코딩했습니다. "
        "향후에는 이 부분을 템플릿 설정값으로 분리해 기관별로 유연하게 바꿀 수 있도록 개선 가능합니다.",
    ),
    (
        "시스템 구성도/조직도도 제미나이가 만들어주나요?",
        "일부 자동 생성을 시도했지만, 복잡한 구성도는 품질과 한글 깨짐 문제가 있어 "
        "이미지 생성 + 텍스트 직접 배치 방식으로 처리했습니다. 이후에는 구성도 전용 템플릿을 만들어 "
        "박스 구조는 고정하고 텍스트만 자동으로 채우는 방식으로 고도화할 수 있습니다.",
    ),
    (
        "한글 깨짐 문제는 어떻게 해결했나요?",
        "AI가 이미지 안에 한글을 직접 넣으면 깨지는 문제가 있어 현재는 이미지와 한글 텍스트를 분리하고, "
        "PPT에서 텍스트를 직접 올리는 방식으로 해결했습니다. AI 이미지 안 한글 텍스트는 별도 분리해 "
        "한글 깨짐을 최소화하도록 처리했습니다.",
    ),
]

SECTIONS = [
    ("서비스 개요", [0]),
    ("PPT 자동화 및 품질", [1, 2, 3]),
    ("적용 범위 및 운영 단계", [4, 5, 6, 7]),
    ("구현 이슈 및 고도화", [8, 9, 10]),
]


def find_target_pdf() -> Path:
    base = Path(r"C:\Users\User\OneDrive")
    candidates = sorted([p for p in base.rglob("*.pdf") if "qna" in p.name.lower()])
    if not candidates:
        raise FileNotFoundError("QnA PDF 파일을 찾을 수 없습니다.")
    return candidates[0]


def register_fonts() -> tuple[str, str]:
    regular_path = Path(r"C:\Windows\Fonts\malgun.ttf")
    bold_path = Path(r"C:\Windows\Fonts\malgunbd.ttf")
    if not regular_path.exists():
        raise FileNotFoundError("malgun.ttf 폰트가 필요합니다.")

    regular_name = "MalgunGothic"
    bold_name = "MalgunGothicBold"
    pdfmetrics.registerFont(TTFont(regular_name, str(regular_path)))
    if bold_path.exists():
        pdfmetrics.registerFont(TTFont(bold_name, str(bold_path)))
    else:
        bold_name = regular_name
    return regular_name, bold_name


def new_page(c: canvas.Canvas, width: float, page_no: int, regular_font: str) -> float:
    c.setFillColor(colors.Color(0.431373, 0.466667, 0.505882))
    c.setFont(regular_font, 9)
    c.drawString(width - 29, 16, str(page_no))
    return 781.8898


def build_append_pages(
    output_path: Path, page_size: tuple[float, float], start_page_number: int
) -> int:
    regular_font, bold_font = register_fonts()
    width, height = page_size
    page_margin_x = 36
    box_width = 523.2756
    text_margin_x = 12
    text_wrap_width = box_width - (text_margin_x * 2)
    bottom_y = 70
    q_font_size = 11.5
    a_font_size = 10.8
    q_line_h = 17
    a_line_h = 16
    section_font_size = 11.0
    section_line_h = 14

    c = canvas.Canvas(str(output_path), pagesize=(width, height))
    page_no = start_page_number
    y = new_page(c, width, page_no, regular_font)

    for section_title, item_indexes in SECTIONS:
        for local_idx, item_idx in enumerate(item_indexes, start=1):
            question, answer = QNA_ITEMS[item_idx]

            section_lines = []
            section_h = 0
            if local_idx == 1:
                section_lines = simpleSplit(
                    section_title, bold_font, section_font_size, text_wrap_width
                )
                section_h = (len(section_lines) * section_line_h) + 10

            q_text = f"Q{local_idx}. {question}"
            a_text = f"A{local_idx}. {answer}"
            q_lines = simpleSplit(q_text, regular_font, q_font_size, text_wrap_width)
            a_lines = simpleSplit(a_text, regular_font, a_font_size, text_wrap_width)
            q_h = (len(q_lines) * q_line_h) + 18
            a_h = (len(a_lines) * a_line_h) + 18
            block_height = section_h + q_h + 4 + a_h + 14

            if y - block_height < bottom_y:
                c.showPage()
                page_no += 1
                y = new_page(c, width, page_no, regular_font)

            if section_lines:
                c.setFont(bold_font, section_font_size)
                c.setFillColor(colors.Color(0.039216, 0.290196, 0.478431))
                sy = y - 11
                for line in section_lines:
                    c.drawString(page_margin_x, sy, line)
                    sy -= section_line_h
                c.setStrokeColor(colors.Color(0.807843, 0.854902, 0.913725))
                c.setLineWidth(0.8)
                c.line(page_margin_x, sy + 4, page_margin_x + box_width, sy + 4)
                y = sy - 8

            q_top = y
            q_bottom = q_top - q_h
            c.setFillColor(colors.Color(0.039216, 0.290196, 0.478431))
            c.rect(page_margin_x, q_bottom, box_width, q_h, stroke=0, fill=1)

            c.setFont(regular_font, q_font_size)
            c.setFillColor(colors.white)
            q_text_obj = c.beginText(page_margin_x + text_margin_x, q_top - 20.5)
            q_text_obj.setLeading(q_line_h)
            for line in q_lines:
                q_text_obj.textLine(line)
            c.drawText(q_text_obj)

            a_top = q_bottom - 4
            a_bottom = a_top - a_h
            c.setFillColor(colors.Color(0.952941, 0.964706, 0.976471))
            c.rect(page_margin_x, a_bottom, box_width, a_h, stroke=0, fill=1)

            c.setFont(regular_font, a_font_size)
            c.setFillColor(colors.Color(0.105882, 0.121569, 0.137255))
            a_text_obj = c.beginText(page_margin_x + text_margin_x, a_top - 19.8)
            a_text_obj.setLeading(a_line_h)
            for line in a_lines:
                a_text_obj.textLine(line)
            c.drawText(a_text_obj)

            y = a_bottom - 14

    c.save()
    return page_no - start_page_number + 1


def main() -> None:
    target_pdf = find_target_pdf()
    reader = PdfReader(str(target_pdf))
    base_page_count = min(3, len(reader.pages))
    first_page = reader.pages[0]
    page_size = (float(first_page.mediabox.width), float(first_page.mediabox.height))

    with TemporaryDirectory() as td:
        append_pdf = Path(td) / "append_clean.pdf"
        build_append_pages(
            append_pdf,
            page_size,
            start_page_number=base_page_count + 1,
        )
        append_reader = PdfReader(str(append_pdf))

        writer = PdfWriter()
        for i in range(base_page_count):
            writer.add_page(reader.pages[i])
        for p in append_reader.pages:
            writer.add_page(p)

        tmp_out = target_pdf.with_suffix(target_pdf.suffix + ".tmp")
        with open(tmp_out, "wb") as f:
            writer.write(f)

        try:
            os.replace(tmp_out, target_pdf)
            final_path = target_pdf
        except PermissionError:
            fallback = target_pdf.with_name(target_pdf.stem + "_수정본" + target_pdf.suffix)
            with open(fallback, "wb") as f:
                writer.write(f)
            tmp_out.unlink(missing_ok=True)
            final_path = fallback

    updated = PdfReader(str(final_path))
    print(f"TARGET={target_pdf}")
    print(f"OUTPUT={final_path}")
    print(f"BASE_PAGES={base_page_count}")
    print(f"TOTAL_PAGES={len(updated.pages)}")


if __name__ == "__main__":
    main()
