from typing import List
import google.generativeai as genai
import os
import re
from dotenv import load_dotenv
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import json

# .env 파일에서 환경 변수 로드
load_dotenv()

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

def generate_todo_items_from_keyword(keyword: str) -> List[dict]:
    """
    Integrates with Google Gemini API to generate a nested list of todo items.
    Returns a list of dictionaries, where each dictionary can have a 'children' key.
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
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
        response = model.generate_content(prompt)
        
        # Clean the response to get only the JSON part
        json_str = response.text.strip().replace('```json', '').replace('```', '').strip()
        
        # Parse the JSON string into a Python list of dictionaries
        todo_items_json = json.loads(json_str)
        return todo_items_json
    except Exception as e:
        print(f"Error calling Gemini API or parsing JSON: {e}")
        # Fallback to a generic nested response
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
    project_keyword: str = None,
    context_path: List[str] = None
) -> List[str]:
    """
    Generates sub-tasks based on a main task description with full context.
    
    Args:
        main_task_description: The current task to break down
        project_keyword: The main project keyword for overall context
        context_path: List of parent task descriptions leading to this task
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # 맥락 정보 구성
        context_info = ""
        if project_keyword:
            context_info += f"프로젝트: {project_keyword}\n"
        
        if context_path and len(context_path) > 1:
            # 현재 작업을 제외한 상위 항목들
            parent_items = context_path[:-1]
            if parent_items:
                context_info += f"상위 작업: {' > '.join(parent_items)}\n"
        
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
        
        response = model.generate_content(prompt)
        
        # Use the same robust parsing logic
        parts = re.split(r'\d+\.\s*', response.text)
        sub_tasks = [part.strip() for part in parts[1:] if part.strip()]
        return sub_tasks
    except Exception as e:
        print(f"Error calling Gemini API for sub-tasks: {e}")
        # Fallback response
        return [
            f"'{main_task_description}'에 대한 첫 번째 세부 계획",
            f"'{main_task_description}'에 대한 두 번째 세부 계획",
            f"'{main_task_description}'에 대한 세 번째 세부 계획"
        ]

def analyze_task_from_natural_language(natural_language_text: str) -> dict:
    """
    Analyzes a natural language string to extract structured task information
    using the Gemini API.
    # [추가] 자연어 문장 파싱 및 속성 추출 – Gemini API 활용
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Get current date and time to provide context to the AI
        
        # Set timezone to Seoul
        kst = ZoneInfo("Asia/Seoul")
        now = datetime.now(kst)
        current_time_str = now.strftime("%Y-%m-%d %H:%M")

        # New rule for "by tomorrow": 24 hours from now, rounded up to the nearest 30 mins
        target_time = now + timedelta(hours=24)
        if target_time.minute % 30 != 0:
            minutes_to_add = 30 - (target_time.minute % 30)
            target_time += timedelta(minutes=minutes_to_add)
        # Reset seconds for a clean time
        target_time = target_time.replace(second=0, microsecond=0)
        tomorrow_due_date_str = target_time.strftime("%Y-%m-%d %H:%M:%S")

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
        response = model.generate_content(prompt)
        
        # Clean the response to get only the JSON part
        json_str = response.text.strip().replace('```json', '').replace('```', '').strip()
        
        parsed_data = json.loads(json_str)
        return parsed_data

    except Exception as e:
        print(f"Error in analyze_task_from_natural_language: {e}")
        # Fallback to a simple parsing
        return {
            "description": natural_language_text,
            "due_date": None,
            "priority": "none",
            "estimated_time_minutes": None,
            "category": None
        }