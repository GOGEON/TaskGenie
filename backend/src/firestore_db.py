"""
Firestore 데이터베이스 연결 및 초기화
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# Firestore 초기화
def initialize_firestore():
    """
    Firestore 초기화 함수
    """
    if not firebase_admin._apps:
        # 환경 변수에서 서비스 계정 키 파일 경로 가져오기
        key_path = os.getenv('FIRESTORE_KEY_PATH', 'firestore-key.json')
        
        if not os.path.exists(key_path):
            raise FileNotFoundError(f"Firestore key file not found at {key_path}")
        
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
