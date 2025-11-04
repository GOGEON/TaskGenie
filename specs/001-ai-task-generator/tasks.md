---
description: "Task list template for feature implementation"
---

# Tasks: AI Task Generator

**Input**: Design documents from `/specs/001-ai-task-generator/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure for backend (Python/FastAPI) and frontend (React)
- [X] T002 Initialize Python/FastAPI project with necessary dependencies (e.g., `fastapi`, `uvicorn`, `SQLAlchemy`, `python-jose`, `passlib`)
- [X] T003 Initialize React project with necessary dependencies (e.g., `react`, `react-dom`, `axios`, CSS framework like `tailwindcss` or `bootstrap`)
- [X] T004 [P] Configure linting and formatting tools for Python (e.g., `black`, `flake8`)
- [X] T005 [P] Configure linting and formatting tools for JavaScript/React (e.g., `eslint`, `prettier`)
- [X] T006 [P] Setup Git repository and initial commit (if not already done)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Setup database (e.g., SQLite for development, PostgreSQL for production) and ORM (SQLAlchemy) for FastAPI backend.
- [X] T008 Implement User model and database schema in `backend/src/models/user.py`
- [X] T009 Implement authentication (user registration, login, JWT token generation) in `backend/src/services/auth_service.py` and `backend/src/api/auth.py`
- [X] T010 Implement ToDoList and ToDoItem models and database schemas in `backend/src/models/todo.py`
- [X] T011 Configure error handling and logging infrastructure for backend.
- [X] T012 Configure environment configuration management for backend (e.g., `.env` files).

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI-Generated To-Do List Creation (Priority: P1) 🎯 MVP

**Goal**: User can input a keyword and receive an AI-generated to-do list.

**Independent Test**: Input a keyword and verify a relevant to-do list is displayed.

### Implementation for User Story 1 (Backend)

- [X] T013 [P] [US1] Implement AI SDK integration in `backend/src/services/ai_service.py`
- [X] T014 [US1] Implement ToDoList generation logic using AI service in `backend/src/services/todo_service.py`
- [X] T015 [US1] Create API endpoint `POST /todos/generate` in `backend/src/api/todos.py` to accept keyword and return generated list.

### Implementation for User Story 1 (Frontend)

- [X] T016 [P] [US1] Create a keyword input component in `frontend/src/components/KeywordInput.jsx`
- [X] T017 [P] [US1] Create a ToDoList display component in `frontend/src/components/ToDoListDisplay.jsx`
- [X] T018 [US1] Implement logic to send keyword to backend and display generated list in `frontend/src/pages/HomePage.jsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - To-Do Item Management (Priority: P1)

**Goal**: User can check off completed items on their generated to-do list.

**Independent Test**: Generate a list and mark an item as complete.

### Implementation for User Story 2 (Backend)

- [X] T019 [US2] Implement logic to update `is_completed` status of ToDoItem in `backend/src/services/todo_service.py`
- [X] T020 [US2] Create API endpoint `PUT /todos/{list_id}/items/{item_id}` in `backend/src/api/todos.py` to update item status.

### Implementation for User Story 2 (Frontend)

- [X] T021 [P] [US2] Add checkbox to ToDoItem component in `frontend/src/components/ToDoItem.jsx`
- [X] T022 [US2] Implement logic to update item status via API in `frontend/src/components/ToDoListDisplay.jsx`

---

## Phase 5: User Story 3 - To-Do List Persistence (Priority: P2)

**Goal**: Generated to-do lists and their completion status are saved and can be retrieved later.

**Independent Test**: Generate a list, mark items, close and reopen the application, and verify the list and status are preserved.

### Implementation for User Story 3 (Backend)

- [X] T023 [US3] Implement logic to save and retrieve ToDoLists and ToDoItems from the database in `backend/src/services/todo_service.py`
- [X] T024 [US3] Create API endpoint `GET /todos` in `backend/src/api/todos.py` to retrieve all lists for a user.
- [X] T025 [US3] Create API endpoint `GET /todos/{list_id}` in `backend/src/api/todos.py` to retrieve a specific list.

### Implementation for User Story 3 (Frontend)

- [X] T026 [US3] Implement logic to fetch and display saved ToDoLists on application load in `frontend/src/pages/HomePage.jsx`

---

## Phase 6: User Story 4 - Visual Progress Tracking (Priority: P2)

**Goal**: User can visually see their progress on a to-do list.

**Independent Test**: Mark items as complete and observe the visual representation of progress.

### Implementation for User Story 4 (Frontend)

- [X] T027 [P] [US4] Create a progress indicator component (e.g., progress bar) in `frontend/src/components/ProgressBar.jsx`
- [X] T028 [US4] Integrate progress indicator into `frontend/src/components/ToDoListDisplay.jsx` to reflect completion status.

---

## Phase 7: LA Topic 1 - Web Storage for data persistence (P2)

**Goal**: Utilize Web Storage for client-side temporary data or user preferences.

**Independent Test**: Store and retrieve a preference from Web Storage.

### Implementation for LA Topic 1 (Frontend)

- [X] T029 [P] [LA1] Implement saving/loading user preferences (e.g., last used keyword) to/from Web Storage in `frontend/src/services/localStorageService.js`
- [X] T030 [LA1] Integrate Web Storage service into `frontend/src/components/KeywordInput.jsx` to pre-fill last used keyword.

---

## Phase 8: LA Topic 2 - Drag and Drop API + Ajax for data storage/deletion/modification (P2)

**Goal**: Implement drag-and-drop functionality for reordering to-do items, with changes persisted via Ajax.

**Independent Test**: Drag and drop a to-do item to a new position and verify its order is updated.

### Implementation for LA Topic 2 (Frontend)

- [X] T031 [P] [LA2] Implement Drag and Drop API for reordering ToDoItems in `frontend/src/components/ToDoItem.jsx` and `frontend/src/components/ToDoListDisplay.jsx`
- [X] T032 [LA2] Implement Ajax calls to update item order via `PUT /todos/{list_id}/items/{item_id}` endpoint in `frontend/src/services/todoApiService.js`

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T033 [P] Implement responsive web design for all frontend components using CSS framework.
- [X] T034 [P] Add user registration and login UI in `frontend/src/pages/AuthPage.jsx`
- [X] T035 [P] Implement user logout functionality.
- [X] T036 Code cleanup and refactoring for both backend and frontend.
- [X] T037 Performance optimization for API endpoints and frontend rendering.
- [X] T038 Add unit and integration tests for backend (Pytest).
- [X] T039 Add unit and integration tests for frontend (Jest/React Testing Library).
- [X] T040 Update documentation (e.g., `README.md` with setup instructions).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2/US3 but should be independently testable
- **LA Topic 1 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **LA Topic 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US2/US3/US4 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
