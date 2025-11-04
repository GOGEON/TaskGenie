# Research: AI Task Generator

## Phase 0: Outline & Research

### Research Findings and Decisions

- **Research suitable backend language/framework**:
    - **Decision**: Python with FastAPI.
    - **Rationale**: Python's strength in AI integration combined with FastAPI's modern, high-performance API capabilities makes it ideal for this project. It's also well-suited for a term project due to its ease of use and clear documentation.
    - **Alternatives considered**: Node.js with Express.js, PHP.

- **Research suitable frontend framework**:
    - **Decision**: React with a focus on responsive design using CSS frameworks (e.g., Bootstrap or Tailwind CSS).
    - **Rationale**: React is a popular and powerful library for building interactive user interfaces, offering a component-based approach that aligns with good UI/UX practices and responsive design.
    - **Alternatives considered**: Vue.js, Angular.

- **Research best practices for integrating AI SDK**:
    - **Decision**: Integrate the AI SDK directly within the FastAPI backend.
    - **Rationale**: This approach enhances security by encapsulating AI logic and API keys on the server-side, allowing the frontend to interact solely with the FastAPI backend.
    - **Alternatives considered**: Direct integration in the frontend, a separate microservice for AI.

- **Research implementation details for selected LA topics**:
    - **Decision**: Implement the following two LA topics:
        1.  **(2) 웹 스토리지를 활용한 데이터 저장 및 수정 기능 (Web Storage for data persistence)**: For client-side temporary storage of user preferences or non-critical data.
        2.  **(6) Drag and Drop API + Ajax를 활용한 데이터 저장/삭제/수정 기능 (Drag and Drop API + Ajax for data storage/deletion/modification)**: To provide an interactive and intuitive way for users to reorder or manage to-do items on the frontend, with changes persisted via Ajax calls to the backend.
    - **Rationale**: These options offer a balanced implementation of frontend interactivity and backend persistence, fulfilling the requirement of including at least two LA topics while providing a rich user experience.
    - **Alternatives considered**: DOM manipulation, JSON file-based data storage with PHP/server app, Session.

- **Research authentication and authorization mechanisms**:
    - **Decision**: Token-based authentication (e.g., JWT) implemented in FastAPI.
    - **Rationale**: JWT is a standard, secure, and efficient method for handling authentication in modern web applications, well-supported by FastAPI.
    - **Alternatives considered**: Session-based authentication, OAuth2.