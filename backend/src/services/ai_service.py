from typing import List
import google.generativeai as genai
import os
import re

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

import json

def generate_todo_items_from_keyword(keyword: str) -> List[dict]:
    """
    Integrates with Google Gemini API to generate a nested list of todo items.
    Returns a list of dictionaries, where each dictionary can have a 'children' key.
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
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
        model = genai.GenerativeModel('gemini-2.5-pro')
        
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