# API Contracts: AI Task Generator

## Authentication Endpoints

### POST /auth/register
- **Description**: Registers a new user.
- **Request Body**:
    ```json
    {
        "username": "string",
        "password": "string",
        "email": "string (optional)"
    }
    ```
- **Response**:
    ```json
    {
        "message": "User registered successfully"
    }
    ```

### POST /auth/login
- **Description**: Authenticates a user and returns an access token.
- **Request Body**:
    ```json
    {
        "username": "string",
        "password": "string"
    }
    ```
- **Response**:
    ```json
    {
        "access_token": "string",
        "token_type": "bearer"
    }
    ```

## To-Do List & Item Endpoints (Requires Authentication)

### POST /todos/generate
- **Description**: Generates a new to-do list based on a keyword using AI.
- **Request Body**:
    ```json
    {
        "keyword": "string"
    }
    ```
- **Response**:
    ```json
    {
        "id": "uuid",
        "keyword": "string",
        "created_at": "datetime",
        "updated_at": "datetime",
        "items": [
            {
                "id": "uuid",
                "description": "string",
                "is_completed": "boolean",
                "order": "integer",
                "children": [] 
            }
        ]
    }
    ```

### POST /todos/items/{item_id}/generate-subtasks
- **Description**: Generates sub-tasks for a specific to-do item using AI.
- **Parameters**: 
    - `item_id`: UUID of the parent to-do item.
- **Response**:
    ```json
    {
        "id": "uuid",
        "description": "string",
        "is_completed": "boolean",
        "order": "integer",
        "children": [] 
    }
    ```

### GET /todos
- **Description**: Retrieves all to-do lists for the authenticated user.
- **Response**:
    ```json
    [
        {
            "id": "uuid",
            "keyword": "string",
            "created_at": "datetime",
            "updated_at": "datetime",
            "items": [
                {
                    "id": "uuid",
                    "description": "string",
                    "is_completed": "boolean",
                    "order": "integer",
                    "children": [] 
                }
            ]
        }
    ]
    ```

### GET /todos/{list_id}
- **Description**: Retrieves a specific to-do list by ID for the authenticated user.
- **Parameters**: 
    - `list_id`: UUID of the to-do list.
- **Response**:
    ```json
    {
        "id": "uuid",
        "keyword": "string",
        "created_at": "datetime",
        "updated_at": "datetime",
        "items": [
            {
                "id": "uuid",
                "description": "string",
                "is_completed": "boolean",
                "order": "integer",
                "children": [] 
            }
        ]
    }
    ```

### PUT /todos/items/{item_id}
- **Description**: Updates the description, completion status, or order of a specific to-do item.
- **Parameters**: 
    - `item_id`: UUID of the to-do item.
- **Request Body**:
    ```json
    {
        "description": "string" (optional),
        "is_completed": "boolean" (optional),
        "order": "integer" (optional)
    }
    ```
- **Response**:
    ```json
    {
        "id": "uuid",
        "description": "string",
        "is_completed": "boolean",
        "order": "integer",
        "children": [] 
    }
    ```

### DELETE /todos/items/{item_id}
- **Description**: Deletes a specific to-do item and all its sub-tasks.
- **Parameters**: 
    - `item_id`: UUID of the to-do item.
- **Response**: `204 No Content`

### DELETE /todos/{list_id}
- **Description**: Deletes a specific to-do list and all its items.
- **Parameters**: 
    - `list_id`: UUID of the to-do list.
- **Response**: `204 No Content`