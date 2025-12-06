"""
Firestore 데이터베이스 모듈

Google Cloud Firestore 연결 및 초기화를 담당.

주요 기능:
- Firebase Admin SDK 초기화
- Firestore 클라이언트 생성 및 관리
- 환경별 인증 정보 처리 (로컬/클라우드)

환경 변수:
- GOOGLE_APPLICATION_CREDENTIALS_JSON: 클라우드 배포용 JSON 문자열
- FIRESTORE_KEY_PATH: 로컬 개발용 키 파일 경로
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()


def initialize_firestore():
    """
    Firebase Admin SDK 및 Firestore 초기화.
    
    배포 환경에 따라 다른 인증 방식 사용:
    - 클라우드(Render/Railway): 환경 변수의 JSON 문자열
    - 로컬: firestore-key.json 파일
    
    Returns:
        Firestore 클라이언트 인스턴스
    
    Raises:
        FileNotFoundError: 인증 정보를 찾을 수 없을 때
    """
    if not firebase_admin._apps:
        # 환경변수에서 JSON 문자열 먼저 확인 (Render/Railway용)
        credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
        
        if credentials_json:
            # 클라우드 환경: JSON 문자열 파싱
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


# 싱글톤 Firestore 클라이언트 인스턴스
db = None


def get_firestore_db():
    """
    Firestore 클라이언트 인스턴스 반환.
    
    싱글톤 패턴으로 한 번 생성된 클라이언트를 재사용.
    
    Returns:
        Firestore 클라이언트
    """
    global db
    if db is None:
        db = initialize_firestore()
    return db


def get_db():
    """
    FastAPI Dependency용 Firestore 클라이언트 반환.
    
    FastAPI의 Depends()와 함께 사용하여
    엔드포인트에서 DB 인스턴스 주입.
    
    Returns:
        Firestore 클라이언트
    """
    return get_firestore_db()
