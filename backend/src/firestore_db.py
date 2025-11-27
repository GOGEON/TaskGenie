"""
Firestore 데이터베이스 연결 및 초기화
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# Firestore 초기화
# [수정] SQLite → Firestore 전환 – 클라우드 데이터베이스 도입
def initialize_firestore():
    """
    Firestore 초기화 함수
    """
    if not firebase_admin._apps:
        # 환경변수에서 JSON 문자열 먼저 확인 (Render/Railway용)
        credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
        
        if credentials_json:
            # JSON 문자열을 파싱하여 credential 생성
            cred_dict = json.loads(credentials_json)
            cred = credentials.Certificate(cred_dict)
        else:
            # 로컬 개발: 파일에서 로드
            key_path = os.getenv('FIRESTORE_KEY_PATH', 'firestore-key.json')
            
            if not os.path.exists(key_path):
                raise FileNotFoundError(
                    f"Firestore credentials not found. "
                    f"Set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable "
                    f"or provide firestore-key.json file at {key_path}"
                )
            
            cred = credentials.Certificate(key_path)
        
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

# Firestore 클라이언트 인스턴스
db = None

def get_firestore_db():
    """
    Firestore 데이터베이스 인스턴스 반환
    """
    global db
    if db is None:
        db = initialize_firestore()
    return db

def get_db():
    """
    FastAPI dependency로 사용할 함수
    """
    return get_firestore_db()
