"""
데이터베이스 초기화 스크립트
"""
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(__file__))

from src.database import engine, Base
from src.models.user import User
from src.models.todo import ToDoList, ToDoItem

print("데이터베이스 테이블 생성 중...")
Base.metadata.create_all(bind=engine)
print("✓ 데이터베이스가 생성되었습니다!")
print(f"위치: {os.path.join(os.path.dirname(__file__), '..', 'sql_app.db')}")
