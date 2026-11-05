from datetime import datetime

import pytest

from src.services import ai_service


def test_parse_json_response_strips_code_fence():
    assert ai_service._parse_json_response('```json\n[{"description": "a"}]\n```') == [{"description": "a"}]


def test_parse_numbered_list_keeps_numbers_inside_items():
    text = "다음은 작업입니다:\n1. 1.5km 달리기\n2) 스트레칭 10분\n\n3. 물 2.5L 마시기"
    assert ai_service._parse_numbered_list(text) == ["1.5km 달리기", "스트레칭 10분", "물 2.5L 마시기"]


@pytest.mark.parametrize("minute, expected", [(0, (10, 0)), (1, (10, 30)), (30, (10, 30)), (45, (11, 0))])
def test_round_up_to_half_hour(minute, expected):
    result = ai_service._round_up_to_half_hour(datetime(2026, 1, 1, 10, minute, 17))
    assert (result.hour, result.minute, result.second) == (*expected, 0)


def test_sub_tasks_fallback_on_api_error(monkeypatch):
    def boom(prompt):
        raise RuntimeError("quota")
    monkeypatch.setattr(ai_service, "_generate", boom)
    result = ai_service.generate_sub_tasks_from_main_task("보고서")
    assert len(result) == 3 and all("보고서" in r for r in result)


def test_sub_tasks_fallback_on_unparseable_response(monkeypatch):
    monkeypatch.setattr(ai_service, "_generate", lambda prompt: "죄송합니다. 생성할 수 없습니다.")
    assert len(ai_service.generate_sub_tasks_from_main_task("보고서")) == 3


def test_keyword_items_fallback_on_invalid_json(monkeypatch):
    monkeypatch.setattr(ai_service, "_generate", lambda prompt: "not json")
    result = ai_service.generate_todo_items_from_keyword("운동")
    assert result[0]["description"] == "운동 관련 작업 브레인스토밍"
