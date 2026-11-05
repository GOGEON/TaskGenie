"""
AI 서비스 모듈

Google Gemini AI를 활용한 작업 생성 및 자연어 파싱 기능 제공.

주요 기능:
- 키워드 기반 할 일 목록 자동 생성
- 메인 작업에서 세부 작업(서브태스크) 분해
- 자연어 문장에서 작업 속성 추출 (날짜, 우선순위 등)
"""
from datetime import datetime, timedelta
from typing import Any, List, Optional
from zoneinfo import ZoneInfo
import json
import logging
import os
import re

import google.generativeai as genai
from dotenv import load_dotenv

# 환경 변수 로드 및 Gemini API 키 설정
load_dotenv()
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

logger = logging.getLogger(__name__)

MODEL_NAME = 'gemini-2.5-flash'
KST = ZoneInfo("Asia/Seoul")


# ==================== 내부 헬퍼 ====================

def _generate(prompt: str) -> str:
    """Gemini 모델에 프롬프트를 보내고 응답 텍스트 반환."""
    return genai.GenerativeModel(MODEL_NAME).generate_content(prompt).text


def _parse_json_response(text: str) -> Any:
    """마크다운 코드 블록(```json ... ```)을 제거하고 JSON 파싱."""
    return json.loads(text.strip().replace('```json', '').replace('```', '').strip())


_NUMBERED_LINE = re.compile(r'^\s*\d+[.)]\s+(.*\S)')


def _parse_numbered_list(text: str) -> List[str]:
    """
    "1. 할 일" 형식의 번호 목록에서 항목만 추출.
    줄 단위로 파싱하므로 항목 안의 숫자("1.5km 달리기")는 그대로 유지된다.
    """
    return [m.group(1).strip() for m in map(_NUMBERED_LINE.match, text.splitlines()) if m]


def _round_up_to_half_hour(dt: datetime) -> datetime:
    """30분 단위로 올림 (초 이하 버림)."""
    if dt.minute % 30:
        dt += timedelta(minutes=30 - dt.minute % 30)
    return dt.replace(second=0, microsecond=0)


# ==================== 공개 함수 ====================


def generate_todo_items_from_keyword(keyword: str) -> List[dict]:
    """
    키워드 기반 계층적 할 일 목록 생성.
    
    Gemini AI를 호출하여 주어진 키워드에 대한
    상위/하위 구조의 할 일 목록을 자동 생성.
    
    Args:
        keyword: 프로젝트 또는 작업의 핵심 키워드 (예: "웹사이트 개발")
    
    Returns:
        계층적 할 일 목록. 각 항목은 description과 선택적 children 포함.
        예: [{"description": "기획", "children": [{"description": "목표 정의"}]}]
    
    Note:
        API 오류 시 기본 폴백 응답 반환
    """
    # AI 프롬프트: 한국어로 계층적 할 일 목록 생성 요청
    prompt = f"""Generate a hierarchical list of to-do items for the keyword '{keyword}'.

IMPORTANT RULES:
- All descriptions must be in Korean (한국어)
- DO NOT use parentheses with English translations like "작업 (task)" or "계획 (planning)"
- Keep descriptions simple and clean in Korean only
- Each description should be under 50 characters

Return the output as a valid JSON array ONLY, with no other text or explanations.

Each object in the array should have a "description" (string) and an optional "children" (array of objects) key.

Example for keyword 'Build a website':
[
  {{
    "description": "기획",
    "children": [
      {{ "description": "웹사이트 목표 정의" }},
      {{ "description": "사이트맵 작성" }}
    ]
  }},
  {{
    "description": "디자인",
    "children": [
      {{ "description": "와이어프레임 제작" }},
      {{ "description": "UI 목업 디자인" }}
    ]
  }},
  {{ "description": "개발" }},
  {{ "description": "배포" }}
]
"""
    try:
        return _parse_json_response(_generate(prompt))
    except Exception:
        logger.exception("Gemini 할 일 목록 생성 실패 (keyword=%s)", keyword)
        # API 오류 시 기본 폴백 응답 반환
        return [
            {
                "description": f"{keyword} 관련 작업 브레인스토밍",
                "children": [
                    { "description": "세부 아이디어 1" },
                    { "description": "세부 아이디어 2" }
                ]
            },
            { "description": f"가장 중요한 {keyword} 작업 우선순위 지정" }
        ]

def generate_sub_tasks_from_main_task(
    main_task_description: str, 
    project_keyword: Optional[str] = None,
    context_path: Optional[List[str]] = None
) -> List[str]:
    """
    메인 작업에서 세부 작업(서브태스크) 목록 생성.
    
    상위 작업의 맥락을 고려하여 3~5개의 구체적이고
    실행 가능한 세부 작업을 AI로 생성.
    
    Args:
        main_task_description: 분해할 현재 작업의 설명
        project_keyword: 전체 프로젝트의 핵심 키워드 (맥락 제공용)
        context_path: 현재 작업까지의 상위 작업 경로 목록
    
    Returns:
        세부 작업 문자열 목록 (3~5개)
    
    Note:
        API 오류 시 기본 폴백 응답 반환
    """
    # 맥락 정보 구성: 프로젝트명과 상위 작업 경로 (현재 작업 제외)
    context_info = ""
    if project_keyword:
        context_info += f"프로젝트: {project_keyword}\n"
    if context_path and len(context_path) > 1:
        context_info += f"상위 작업: {' > '.join(context_path[:-1])}\n"

    prompt = f"""Given the following context, generate a list of 3 to 5 detailed, actionable sub-tasks for the current task.

{context_info}
현재 작업: {main_task_description}

IMPORTANT RULES:
- All sub-tasks must be in Korean (한국어)
- DO NOT use parentheses with English translations like "작업 (task)" or "계획 (planning)"
- Keep descriptions simple and clean in Korean only
- Each sub-task should be under 50 characters
- Consider the project context and parent tasks when generating sub-tasks
- Make sub-tasks specific and actionable

Return the list as a numbered list, e.g.,
1. 첫 번째 세부 작업
2. 두 번째 세부 작업
..."""
    try:
        sub_tasks = _parse_numbered_list(_generate(prompt))
        if sub_tasks:
            return sub_tasks
        logger.warning("Gemini 하위 작업 응답에서 항목을 찾지 못함: %s", main_task_description)
    except Exception:
        logger.exception("Gemini 하위 작업 생성 실패: %s", main_task_description)
    # API 오류 또는 빈 응답 시 기본 폴백 응답 반환
    return [
        f"'{main_task_description}'에 대한 첫 번째 세부 계획",
        f"'{main_task_description}'에 대한 두 번째 세부 계획",
        f"'{main_task_description}'에 대한 세 번째 세부 계획"
    ]


def analyze_task_from_natural_language(natural_language_text: str) -> dict:
    """
    자연어 문장에서 작업 속성 추출.
    
    사용자가 입력한 자연어 문장(예: "내일까지 보고서 제출")을
    분석하여 구조화된 작업 정보로 변환.
    
    Args:
        natural_language_text: 사용자가 입력한 자연어 작업 문장
    
    Returns:
        추출된 작업 속성 딕셔너리:
        - description: 핵심 작업 내용
        - due_date: 마감일 (ISO 8601 형식 또는 None)
        - priority: 우선순위 (high/medium/low/none)
        - estimated_time_minutes: 예상 소요 시간 (분)
        - category: 카테고리 (업무/개인/운동/학습 등)
    
    Note:
        API 오류 시 원본 텍스트를 description으로 반환
    """
    # AI에게 현재 시각(KST)을 맥락으로 제공
    now = datetime.now(KST)
    current_time_str = now.strftime("%Y-%m-%d %H:%M")
    # 예시용 "내일까지": 지금부터 24시간 뒤를 30분 단위로 올림
    tomorrow_due_date_str = _round_up_to_half_hour(now + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")

    prompt = f"""You are a sophisticated task parser. Analyze the following to-do item and return its components as a JSON object.

Current date and time for context: {current_time_str}

To-do item: "{natural_language_text}"

Analyze the text and provide the following information in a valid JSON object format ONLY. Do not include any other text, explanations, or markdown formatting.

1.  `description`: (string) The core action or task to be done.
2.  `due_date`: (string, ISO 8601 format YYYY-MM-DD HH:MM:SS or YYYY-MM-DD) The deadline for the task. Infer from relative terms like '내일', '오늘 저녁 6시', '다음 주 수요일'. If no date is mentioned, return null.
3.  `priority`: (string) The priority of the task. Infer from keywords like '긴급', '중요'. Can be 'high', 'medium', 'low', 'none'. If not specified, default to 'none'.
4.  `estimated_time_minutes`: (integer) The estimated time required to complete the task in minutes. Infer from the task's complexity and description. Examples: '5분 스트레칭' -> 5, '보고서 작성' -> 120. If not clear, return null.
5.  `category`: (string) The category of the task. Infer from the content. Examples: '업무', '개인', '운동', '학습'. If not clear, return null.

Example 1:
Input: "내일까지 운동하기"
Output:
{{
  "description": "운동하기",
  "due_date": "{tomorrow_due_date_str}",
  "priority": "none",
  "estimated_time_minutes": 60,
  "category": "운동"
}}

Example 2:
Input: "긴급! 오늘 저녁 6시까지 보고서 제출"
Output:
{{
  "description": "보고서 제출",
  "due_date": "{now.strftime('%Y-%m-%d')} 18:00:00",
  "priority": "high",
  "estimated_time_minutes": 180,
  "category": "업무"
}}

Example 3:
Input: "책 읽기"
Output:
{{
  "description": "책 읽기",
  "due_date": null,
  "priority": "none",
  "estimated_time_minutes": 90,
  "category": "개인"
}}
"""
    try:
        return _parse_json_response(_generate(prompt))
    except Exception:
        logger.exception("Gemini 자연어 분석 실패")
        # 폴백: 원문을 그대로 description으로 사용
        return {
            "description": natural_language_text,
            "due_date": None,
            "priority": "none",
            "estimated_time_minutes": None,
            "category": None
        }