# 소셜 로그인 설정 가이드

TaskGenie는 Google, 네이버, 카카오 소셜 로그인을 지원합니다.

## 📋 목차
1. [Firebase Authentication 설정 (Google)](#firebase-authentication-설정-google)
2. [Google 로그인 설정](#google-로그인-설정)
3. [네이버 로그인 설정](#네이버-로그인-설정)
4. [카카오 로그인 설정](#카카오-로그인-설정)
5. [프론트엔드 환경 변수 설정](#프론트엔드-환경-변수-설정)
6. [백엔드 환경 변수 설정](#백엔드-환경-변수-설정)
7. [테스트](#테스트)

---

## 🔥 Firebase Authentication 설정 (Google)

### 1. Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택: `taskgenie-477403`

### 2. Authentication 활성화
1. 좌측 메뉴에서 **Build** > **Authentication** 클릭
2. **시작하기** 버튼 클릭 (처음인 경우)

### 3. Google 제공업체 활성화
- **Google** 제공업체 활성화

---

## 🔐 Google 로그인 설정

### 1. Firebase Console에서 Google 활성화
1. Authentication > Sign-in method 탭
2. **Google** 클릭
3. **사용 설정** 토글 ON
4. 프로젝트 공개용 이름 입력: `TaskGenie`
5. 프로젝트 지원 이메일 선택
6. **저장** 클릭

### 2. 승인된 도메인 확인
- `localhost` (로컬 개발용)
- 배포 후 실제 도메인 추가

✅ **완료!** 추가 설정 불필요 (Firebase가 자동 처리)

---

## 🟢 네이버 로그인 설정

### 1. 네이버 개발자 센터 애플리케이션 등록

1. [네이버 개발자 센터](https://developers.naver.com/)에 접속
2. **Application > 애플리케이션 등록** 클릭

3. 애플리케이션 정보 입력:
   ```
   애플리케이션 이름: TaskGenie
   사용 API: 네이버 로그인
   ```

4. **서비스 환경** 설정:
   - **PC 웹**: `http://localhost:5173/auth/naver/callback`
   - **모바일 웹**: 필요 시 추가

5. **제공 정보 선택**:
   - [필수] 이메일 주소
   - [선택] 닉네임
   - [선택] 프로필 사진

6. **등록하기** 클릭

### 2. Client ID/Secret 확인

1. 등록한 애플리케이션 선택
2. **Client ID** 복사
3. **Client Secret** 복사

### 3. 백엔드 환경 변수 설정

`backend/.env` 파일에 추가:
```env
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

---

## 🟡 카카오 로그인 설정

### 1. 카카오 개발자 콘솔 앱 생성

1. [카카오 개발자 콘솔](https://developers.kakao.com/)에 접속
2. **내 애플리케이션** > **애플리케이션 추가하기** 클릭

3. 앱 정보 입력:
   ```
   앱 이름: TaskGenie
   사업자명: 개인 (또는 회사명)
   ```

4. **저장** 클릭

### 2. 플랫폼 설정

1. 생성한 앱 선택
2. **플랫폼 설정 > Web** 선택
3. **사이트 도메인** 등록:
   ```
   http://localhost:5173
   ```

### 3. Redirect URI 설정

1. **제품 설정 > 카카오 로그인** 선택
2. **카카오 로그인 활성화** ON
3. **Redirect URI 등록**:
   ```
   http://localhost:5173/auth/kakao/callback
   ```

### 4. 동의항목 설정

1. **제품 설정 > 카카오 로그인 > 동의항목**
2. 필수 동의 설정:
   - **닉네임**: 필수 동의
   - **카카오계정(이메일)**: 필수 동의

### 5. REST API 키 확인

1. **앱 설정 > 요약 정보** 또는 **앱 키**
2. **REST API 키** 복사

### 6. 백엔드 환경 변수 설정

`backend/.env` 파일에 추가:
```env
KAKAO_CLIENT_ID=your_kakao_rest_api_key
# Client Secret은 선택사항 (보안 강화 시 사용)
KAKAO_CLIENT_SECRET=your_kakao_client_secret_optional
```

---

## ⚙️ 프론트엔드 환경 변수 설정

### 1. Firebase 웹 앱 설정 정보 가져오기

1. Firebase Console > 프로젝트 설정 (⚙️ 아이콘)
2. **일반** 탭 스크롤 다운
3. **내 앱** 섹션에서 웹 앱 선택 (없으면 추가)
4. **SDK 설정 및 구성** 선택
5. **구성** 라디오 버튼 선택
6. `firebaseConfig` 객체 정보 복사

### 2. `.env` 파일 생성

`frontend/.env` 파일 생성:

```bash
cd frontend
cp .env.example .env
```

### 3. 환경 변수 입력

```env
# Firebase 설정 (Google 로그인용)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=taskgenie-477403.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taskgenie-477403
VITE_FIREBASE_STORAGE_BUCKET=taskgenie-477403.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# 네이버 로그인 설정
VITE_NAVER_CLIENT_ID=your_naver_client_id

# 카카오 로그인 설정
VITE_KAKAO_CLIENT_ID=your_kakao_rest_api_key
```

> ⚠️ **중요**: `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

---

## 🔧 백엔드 환경 변수 설정

`backend/.env` 파일 확인/추가:

```env
USE_FIRESTORE=true

# 네이버 OAuth 설정
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 카카오 OAuth 설정
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret_optional
```

---

## 🧪 테스트

### 1. 개발 서버 재시작

```bash
# 백엔드 (환경 변수 변경 시)
cd backend
uvicorn src.main:app --reload

# 프론트엔드 (환경 변수 변경 시)
cd frontend
npm run dev
```

### 2. 소셜 로그인 테스트

1. 브라우저에서 `http://localhost:5173` 접속
2. 로그인/회원가입 페이지 확인

**Google 로그인**:
- **Google로 로그인** 버튼 클릭
- Google 계정 선택
- 권한 허용
- 로그인 성공 확인

**네이버 로그인**:
- **네이버로 로그인** 버튼 클릭 (초록색)
- 네이버 로그인 페이지로 리디렉션
- 네이버 계정 입력
- 동의 및 계속하기
- 로그인 성공 확인

**카카오 로그인**:
- **카카오로 로그인** 버튼 클릭 (노란색)
- 카카오 로그인 페이지로 리디렉션
- 카카오 계정 입력
- 동의 및 계속하기
- 로그인 성공 확인

### 3. 모바일 테스트

모바일 기기에서도 정상 작동합니다:
- iOS Safari, Chrome
- Android Chrome

---

## 🔧 문제 해결

### Google 로그인 팝업이 차단되는 경우
- 브라우저 팝업 차단 해제
- 또는 모바일처럼 리디렉션 방식 사용

### 네이버 로그인 실패: "redirect_uri_mismatch"
- 네이버 개발자 센터에서 등록한 Redirect URI 확인
- `http://localhost:5173/auth/naver/callback`과 정확히 일치하는지 확인

### 카카오 로그인 실패: "KOE006"
- 카카오 개발자 콘솔에서 Redirect URI 등록 확인
- `http://localhost:5173/auth/kakao/callback`과 정확히 일치하는지 확인
- 카카오 로그인 활성화 상태 확인

### Firebase 초기화 오류
- `.env` 파일이 `frontend/` 디렉토리에 있는지 확인
- 환경 변수 이름이 `VITE_`로 시작하는지 확인
- 개발 서버 재시작

### "Social login is only supported with Firestore" 오류
- `backend/.env` 파일에서 `USE_FIRESTORE=true` 확인
- 백엔드 서버 재시작

### 백엔드 OAuth 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Client ID/Secret이 정확한지 확인
- 네이버/카카오 개발자 콘솔에서 앱 상태 확인

---

## 📚 참고 자료

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [네이버 로그인 API](https://developers.naver.com/docs/login/api/)
- [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)

---

**작성일**: 2025년 1월 6일  
**최종 업데이트**: 2025년 1월 6일  
**버전**: 2.0

5. 프로젝트 지원 이메일 선택
6. **저장** 클릭

### 2. 승인된 도메인 확인
- `localhost` (로컬 개발용)
- 배포 후 실제 도메인 추가

✅ **완료!** 추가 설정 불필요 (Firebase가 자동 처리)

---

## 🐙 GitHub 로그인 설정

### 1. GitHub OAuth App 생성

1. GitHub 설정 페이지 이동:
   - [GitHub Developer Settings](https://github.com/settings/developers)
   - 또는: GitHub 프로필 > Settings > Developer settings > OAuth Apps

2. **New OAuth App** 클릭

3. 앱 정보 입력:
   ```
   Application name: TaskGenie
   Homepage URL: http://localhost:5173
   Authorization callback URL: https://taskgenie-477403.firebaseapp.com/__/auth/handler
   ```
   
   > 💡 **Authorization callback URL**은 Firebase Console에서 확인:
   > Firebase Console > Authentication > Sign-in method > GitHub > "승인된 리디렉션 URI" 복사

4. **Register application** 클릭

5. **Client ID** 복사
6. **Generate a new client secret** 클릭 후 **Client Secret** 복사

### 2. Firebase Console에서 GitHub 설정

1. Authentication > Sign-in method 탭
2. **GitHub** 클릭
3. **사용 설정** 토글 ON
4. 위에서 복사한 정보 입력:
   - Client ID: `복사한 Client ID`
   - Client Secret: `복사한 Client Secret`
5. **저장** 클릭

---

## ⚙️ 프론트엔드 환경 변수 설정

### 1. Firebase 웹 앱 설정 정보 가져오기

1. Firebase Console > 프로젝트 설정 (⚙️ 아이콘)
2. **일반** 탭 스크롤 다운
3. **내 앱** 섹션에서 웹 앱 선택 (없으면 추가)
4. **SDK 설정 및 구성** 선택
5. **구성** 라디오 버튼 선택
6. `firebaseConfig` 객체 정보 복사

### 2. `.env` 파일 생성

`frontend/.env` 파일 생성:

```bash
cd frontend
cp .env.example .env
```

### 3. 환경 변수 입력

```env
# Firebase 설정
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=taskgenie-477403.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taskgenie-477403
VITE_FIREBASE_STORAGE_BUCKET=taskgenie-477403.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> ⚠️ **중요**: `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

---

## 🧪 테스트

### 1. 개발 서버 재시작

```bash
# 백엔드 (환경 변수 변경 시)
cd backend
uvicorn src.main:app --reload

# 프론트엔드 (환경 변수 변경 시)
cd frontend
npm run dev
```

### 2. 소셜 로그인 테스트

1. 브라우저에서 `http://localhost:5173` 접속
2. 로그인/회원가입 페이지에서 **Google로 로그인** 버튼 클릭
3. Google 계정 선택
4. 권한 허용
5. 로그인 성공 확인

**GitHub 로그인도 동일하게 테스트**

### 3. 모바일 테스트

모바일 기기에서는 리디렉션 방식으로 자동 전환됩니다:
- iOS Safari, Chrome
- Android Chrome

---

## 🔧 문제 해결

### Google 로그인 팝업이 차단되는 경우
- 브라우저 팝업 차단 해제
- 또는 모바일처럼 리디렉션 방식 사용

### GitHub 로그인 실패: "redirect_uri_mismatch"
- Firebase Console에서 GitHub 설정의 "승인된 리디렉션 URI" 복사
- GitHub OAuth App의 "Authorization callback URL"과 정확히 일치하는지 확인

### Firebase 초기화 오류
- `.env` 파일이 `frontend/` 디렉토리에 있는지 확인
- 환경 변수 이름이 `VITE_`로 시작하는지 확인
- 개발 서버 재시작

### "Social login is only supported with Firestore" 오류
- `backend/.env` 파일에서 `USE_FIRESTORE=true` 확인
- 백엔드 서버 재시작

---

## 📚 참고 자료

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

**작성일**: 2025년 1월 6일  
**버전**: 1.0
