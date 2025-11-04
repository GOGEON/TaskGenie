"""
데이터베이스 마이그레이션 스크립트: color와 icon 컬럼 추가
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    with engine.connect() as conn:
        # 컬럼이 이미 있는지 확인
        result = conn.execute(text("PRAGMA table_info(todo_lists)"))
        columns = [row[1] for row in result]
        
        # color 컬럼 추가
        if 'color' not in columns:
            print("Adding 'color' column...")
            conn.execute(text("ALTER TABLE todo_lists ADD COLUMN color VARCHAR DEFAULT '#3b82f6'"))
            conn.commit()
            print("'color' column added successfully!")
        else:
            print("'color' column already exists.")
        
        # icon 컬럼 추가
        if 'icon' not in columns:
            print("Adding 'icon' column...")
            conn.execute(text("ALTER TABLE todo_lists ADD COLUMN icon VARCHAR DEFAULT '📋'"))
            conn.commit()
            print("'icon' column added successfully!")
        else:
            print("'icon' column already exists.")
        
        # 기존 레코드 업데이트
        print("Updating existing records...")
        conn.execute(text("UPDATE todo_lists SET color = '#3b82f6' WHERE color IS NULL"))
        conn.execute(text("UPDATE todo_lists SET icon = '📋' WHERE icon IS NULL"))
        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
