"""
자연어 파싱 모듈

사용자가 입력한 자연어 문장을 구조화된 작업 데이터로 변환.

주요 기능:
- AI 서비스를 통한 자연어 분석
- 추출된 데이터의 유효성 검증 및 정제
- 기본값 처리 및 폴백 로직
"""
from datetime import datetime
from .ai_service import analyze_task_from_natural_language


class NaturalLanguageParser:
    """
    자연어 작업 파서 클래스.
    
    자연어 문장을 분석하여 description, due_date, priority 등
    구조화된 작업 속성으로 변환.
    """
    
    def parse_task(self, text: str) -> dict:
        """
        자연어 문장을 구조화된 작업 딕셔너리로 변환.
        
        AI 서비스를 호출하여 핵심 분석을 수행하고,
        결과 데이터를 검증/정제하여 반환.
        
        Args:
            text: 사용자가 입력한 자연어 문장
                  예: "내일까지 보고서 제출 긴급!"
        
        Returns:
            구조화된 작업 딕셔너리:
            - description: 작업 내용
            - due_date: 마감일 (ISO 형식 또는 None)
            - priority: 우선순위 (high/medium/low/none)
            - estimated_time_minutes: 예상 시간 (분)
            - category: 카테고리
            
            입력이 비어있으면 None 반환
        """
        if not text:
            return None

        # AI 서비스를 통한 자연어 분석
        ai_result = analyze_task_from_natural_language(text)

        # ==================== 데이터 정제 및 검증 ====================
        
        # description: 빈 값이면 원본 텍스트로 대체
        if not ai_result.get("description"):
            ai_result["description"] = text

        # priority: 유효 값 검증
        valid_priorities = ["high", "medium", "low", "none"]
        if ai_result.get("priority") not in valid_priorities:
            ai_result["priority"] = "none"

        # due_date: ISO 형식 검증
        due_date_str = ai_result.get("due_date")
        if due_date_str:
            try:
                datetime.fromisoformat(due_date_str.replace(" ", "T"))
            except (ValueError, TypeError):
                ai_result["due_date"] = None

        # estimated_time_minutes: 정수 변환
        estimated_time = ai_result.get("estimated_time_minutes")
        if estimated_time is not None and not isinstance(estimated_time, int):
            try:
                ai_result["estimated_time_minutes"] = int(estimated_time)
            except (ValueError, TypeError):
                ai_result["estimated_time_minutes"] = None

        return ai_result


# 싱글톤 인스턴스 (전역 사용)
nlp_parser = NaturalLanguageParser()