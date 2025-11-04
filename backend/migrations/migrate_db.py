"""
SQLite 데이터베이스에 color, icon, priority 컬럼 추가
"""
import sqlite3
import os

# 데이터베이스 파일 경로 (backend 폴더 내부 또는 상위 폴더에서 찾기)
db_path_backend = os.path.join(os.path.dirname(__file__), 'sql_app.db')
db_path_parent = os.path.join(os.path.dirname(__file__), '..', 'sql_app.db')

if os.path.exists(db_path_backend):
    db_path = db_path_backend
elif os.path.exists(db_path_parent):
    db_path = db_path_parent
else:
    print("데이터베이스 파일이 존재하지 않습니다!")
    print("다음 위치를 확인했습니다:")
    print(f"  1. {db_path_backend}")
    print(f"  2. {db_path_parent}")
    print("\n백엔드 서버를 먼저 실행하여 데이터베이스를 생성하세요:")
    print("  uvicorn src.main:app --reload")
    exit(1)

print(f"데이터베이스 경로: {db_path}")

# 연결
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # todo_lists 테이블 컬럼 확인 및 추가
    print("\n[todo_lists 테이블 마이그레이션]")
    cursor.execute("PRAGMA table_info(todo_lists)")
    todo_lists_columns = [row[1] for row in cursor.fetchall()]
    print(f"현재 컬럼: {todo_lists_columns}")
    
    # color 컬럼 추가
    if 'color' not in todo_lists_columns:
        print("'color' 컬럼 추가 중...")
        cursor.execute("ALTER TABLE todo_lists ADD COLUMN color VARCHAR DEFAULT '#3b82f6'")
        print("✓ 'color' 컬럼 추가됨")
    else:
        print("'color' 컬럼이 이미 존재합니다.")
    
    # icon 컬럼 추가
    if 'icon' not in todo_lists_columns:
        print("'icon' 컬럼 추가 중...")
        cursor.execute("ALTER TABLE todo_lists ADD COLUMN icon VARCHAR DEFAULT '📋'")
        print("✓ 'icon' 컬럼 추가됨")
    else:
        print("'icon' 컬럼이 이미 존재합니다.")
    
    # 기존 레코드 업데이트
    cursor.execute("UPDATE todo_lists SET color = '#3b82f6' WHERE color IS NULL")
    cursor.execute("UPDATE todo_lists SET icon = '📋' WHERE icon IS NULL")
    
    # todo_items 테이블 컬럼 확인 및 추가
    print("\n[todo_items 테이블 마이그레이션]")
    cursor.execute("PRAGMA table_info(todo_items)")
    todo_items_columns = [row[1] for row in cursor.fetchall()]
    print(f"현재 컬럼: {todo_items_columns}")
    
    # priority 컬럼 추가
    if 'priority' not in todo_items_columns:
        print("'priority' 컬럼 추가 중...")
        cursor.execute("ALTER TABLE todo_items ADD COLUMN priority VARCHAR DEFAULT 'none'")
        print("✓ 'priority' 컬럼 추가됨")
        
        # 인덱스 생성
        print("'priority' 인덱스 생성 중...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_todo_items_priority ON todo_items(priority)")
        print("✓ 'priority' 인덱스 생성됨")
    else:
        print("'priority' 컬럼이 이미 존재합니다.")
    
    # 기존 레코드 업데이트 (NULL 또는 기존 'medium'을 'none'으로)
    cursor.execute("UPDATE todo_items SET priority = 'none' WHERE priority IS NULL OR priority = 'medium'")
    
    # due_date, reminder_date 컬럼 추가
    print("\n[todo_items 날짜 컬럼 추가]")
    if 'due_date' not in todo_items_columns:
        print("'due_date' 컬럼 추가 중...")
        cursor.execute("ALTER TABLE todo_items ADD COLUMN due_date DATETIME NULL")
        print("✓ 'due_date' 컬럼 추가됨")
        
        print("'due_date' 인덱스 생성 중...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_todo_items_due_date ON todo_items(due_date)")
        print("✓ 'due_date' 인덱스 생성됨")
    else:
        print("'due_date' 컬럼이 이미 존재합니다.")
    
    if 'reminder_date' not in todo_items_columns:
        print("'reminder_date' 컬럼 추가 중...")
        cursor.execute("ALTER TABLE todo_items ADD COLUMN reminder_date DATETIME NULL")
        print("✓ 'reminder_date' 컬럼 추가됨")
        
        print("'reminder_date' 인덱스 생성 중...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_todo_items_reminder_date ON todo_items(reminder_date)")
        print("✓ 'reminder_date' 인덱스 생성됨")
    else:
        print("'reminder_date' 컬럼이 이미 존재합니다.")
    
    conn.commit()
    print("\n✓ 마이그레이션 완료!")
    
except Exception as e:
    print(f"에러 발생: {e}")
    conn.rollback()
finally:
    conn.close()
