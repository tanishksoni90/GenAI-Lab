# GenAI Lab - Complete API Reference Documentation

**Base URL:** `/api`

All protected endpoints require an Access Token passed via headers:
`Authorization: Bearer <your_access_token>`

---

## 1. Authentication & User Profile (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user and return JWT tokens |
| POST | `/api/auth/refresh-token` | Refresh an expiring access token |
| POST | `/api/auth/admin/register` | Register a new platform administrator |
| GET | `/api/auth/validate-invite` | Validate an email invitation token |
| POST | `/api/auth/setup-account` | Set up account via invite / OTP |
| GET | `/api/auth/me` | Get the currently authenticated user's profile |
| PUT | `/api/auth/me` | Update the current user's profile / settings |
| POST | `/api/auth/change-password` | Change user password |
| POST | `/api/auth/set-new-password` | Set new password (e.g., forced resets) |
| POST | `/api/auth/logout` | Invalidate current token / end session |

---

## 2. Sessions & Messages (`/api/sessions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all historical sessions for the user |
| POST | `/api/sessions` | Create a new LLM conversation session |
| GET | `/api/sessions/:id` | Get specific session metadata |
| PATCH | `/api/sessions/:id` | Update session properties (e.g., rename title) |
| POST | `/api/sessions/:id/end` | Explicitly terminate a session |
| GET | `/api/sessions/:id/messages` | Retrieve full message history of a session |
| POST | `/api/sessions/:id/messages` | Send a standard text message (non-streaming) |
| POST | `/api/sessions/:id/messages/stream` | Send a message and stream response (SSE) |

---

## 3. Custom Chatbots / Agents (`/api/chatbots`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chatbots/guardrails` | Fetch available system guardrails for agents |
| GET | `/api/chatbots` | List all user-created chatbots / agents |
| POST | `/api/chatbots` | Create a new specialized agent |
| GET | `/api/chatbots/:id` | Retrieve configuration of a specific agent |
| PUT | `/api/chatbots/:id` | Update a specific agent's behavior |
| DELETE | `/api/chatbots/:id` | Delete a specific agent |
| GET | `/api/chatbots/:id/stats` | Retrieve consumption/usage stats for an agent |

---

## 4. Multi-Model Comparison (`/api/comparison`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comparison/categories` | Get all valid prompt/model categories |
| GET | `/api/comparison/models/:category` | Get functional models filtered by category |
| POST | `/api/comparison/start-exchange` | Initialize a synchronous multi-model benchmark |
| POST | `/api/comparison/run-model` | Execute isolated model non-streaming |
| POST | `/api/comparison/stream-model` | Execute isolated model and capture streaming (SSE) |
| POST | `/api/comparison/compare` | Single-shot comparison execution |
| GET | `/api/comparison/sessions` | Retrieve user's past comparison exchanges |
| GET | `/api/comparison/sessions/:sessionId` | Get detail of a specific comparison session |
| DELETE | `/api/comparison/sessions/:sessionId` | Delete a multi-model comparison record |

---

## 5. Administrative Operations (`/api/admin`)

*(Requires ADMIN role-based access control).*

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/students` | Get paginated list of all registered students |
| GET | `/api/admin/students/:id` | Retrieve specific student details |
| POST | `/api/admin/students` | Manually provision a student account |
| PUT | `/api/admin/students/:id` | Update student metrics or profile |
| DELETE | `/api/admin/students/:id` | Remove a student from the platform |
| POST | `/api/admin/students/:id/reset-password` | Force a reset of a student's password |
| POST | `/api/admin/students/bulk` | Execute batch operations on accounts |
| POST | `/api/admin/students/import` | Bulk import users via payload/CSV mappings |
| POST | `/api/admin/students/:id/invite` | Send welcome invitation email to a user |
| GET | `/api/admin/students/:id/invite-status` | Check delivery status of a student invite |
| POST | `/api/admin/students/:id/resend-invite` | Re-trigger invitation mapping |
| POST | `/api/admin/students/bulk-invite` | Mass trigger email invites to a batch list |

### Organization Setup
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/courses` | List active courses / tracks |
| POST | `/api/admin/courses` | Create a new assigned course |
| PUT | `/api/admin/courses/:id` | Update track properties |
| DELETE | `/api/admin/courses/:id` | Remove a course |
| GET | `/api/admin/batches` | List scheduling batches |
| POST | `/api/admin/batches` | Create a new student batch |
| DELETE | `/api/admin/batches/:id` | Remove a batch |

### Platform Config & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics` | Fetch high-level platform $USD/Token metrics |
| GET | `/api/admin/settings` | Retrieve active platform global settings |
| PUT | `/api/admin/settings` | Update platform global parameters |
| GET | `/api/admin/tokens/exceeded` | Flag accounts severely past quota limits |
| POST | `/api/admin/tokens/fix-exceeded` | Clear/Fix invalid accounting or quotas |

### Providers & Guardrails
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/api-keys` | Retrieve statuses of provider integrations |
| PUT | `/api/admin/api-keys/:provider` | Update/Submit a token key (OpenAI/Anthropic) |
| DELETE | `/api/admin/api-keys/:provider` | Remove provider authentication |
| POST | `/api/admin/api-keys/:provider/test` | Run a secure ping to validate key authenticity |
| GET | `/api/admin/guardrails` | Fetch overarching global safety boundaries |
| POST | `/api/admin/guardrails` | Create new instruction limit |
| PUT | `/api/admin/guardrails/:id` | Update an existing safety boundary |
| DELETE | `/api/admin/guardrails/:id` | Remove mapping and constraints |

### Internal Model Targeting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/models` | List all available registered foundation models |
| POST | `/api/admin/models` | Define a new capability map |
| PUT | `/api/admin/models/:modelId` | Refine active model's cost map or config |
| DELETE | `/api/admin/models/:modelId` | Permanently detach a model configuration |
| POST | `/api/admin/models/:modelId/toggle` | Soft disable/enable model access globally |
| POST | `/api/admin/models/:modelId/test` | Dispatch ping to ensure model connects cleanly |
| GET | `/api/admin/models/:modelId/access` | Check specific token distribution routes |
| POST | `/api/admin/models/access` | Lock model access strictly to a specific course |
| DELETE | `/api/admin/models/access/:id` | Drop restrictive lock / rule on model |

---

## 6. Student Dashboard & Activity (`/api/students`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/dashboard` | Generate summary token & prompt metrics |
| GET | `/api/students/recent-sessions` | Fetch user's most recent interaction lists |
| GET | `/api/students/leaderboard` | View platform-wide or batch-level ranking |
| GET | `/api/students/rank` | Get granular user comparative performance |
| GET | `/api/students/activity-calendar` | Extract timeline events for UI contribution graph |

---

## 7. Foundation Models (User Specific) (`/api/models`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | Get list of user's globally accessible models |
| GET | `/api/models/:id` | Get static limits and parameters of specific model |
| GET | `/api/models/category/:category` | View AI's grouped by specialty (Coding, Image, Text) |
| GET | `/api/models/stats/usage` | Extract specific model token efficiency analytics |

---

## 8. Artifacts (`/api/artifacts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/artifacts` | Log a new artifact generated from a session |
| GET | `/api/artifacts` | List all saved fragments (Code, Text blocks) |
| GET | `/api/artifacts/:id` | Retrieve precise artifact contents |
| POST | `/api/artifacts/:id/bookmark` | Toggle active bookmark |
| DELETE | `/api/artifacts/:id` | Permanent record detachment |
<br>

# Detailed Endpoint Specifications

## 1. Authentication & User Profile (`/api/auth`)

---

### `POST /api/auth/login`
Authenticates a user (Student or Admin) and issues a JWT access token alongside a refresh token.
* **Important Constraint:** The platform uses an exponential lockout policy if too many incorrect password attempts are made across short periods (rate limited). User tokens must be stored client-side securely. 
* **Auth Required:** No

**Request Structure:**
```json
{
  "email": "student@example.com",
  "password": "StrongPassword123!"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "student@example.com",
      "name": "Jane Student",
      "role": "STUDENT",
      "usdQuota": 5.00,
      "usdUsed": 0.50,
      "tokenLimit": 50000,
      "tokenUsed": 1000,
      "forcePasswordChange": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
}
```

---

### `POST /api/auth/refresh-token`
Rotates an expired short-lived access token by submitting a valid unexpired refresh token.
* **Important Constraint:** If the refresh token is expired or manipulated, the user must re-authenticate entirely. 
* **Auth Required:** No

**Request Structure:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "new_eyJhbGciOi...",
      "refreshToken": "new_eyJhbGciOi..."
    }
  }
}
```

---

### `POST /api/auth/admin/register`
Provisions a new `ADMIN` capable account.
* **Important Constraint:** Security requires passing the strict `adminCode` variable defined natively in your `.env` configuration file (`ADMIN_REGISTRATION_CODE`). If the code is missing or incorrect, it aggressively rejects via 403.
* **Auth Required:** No

**Request Structure:**
```json
{
  "email": "sysadmin@lab.internal",
  "password": "SuperSecretPassword123!",
  "name": "System Administrator",
  "adminCode": "env_secret_123"
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Admin registration successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "sysadmin@lab.internal",
      "role": "ADMIN"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

### `GET /api/auth/validate-invite`
Validates a Magic Link / Invite token specifically generated by an administrator for a new student registration.
* **Important Constraint:** Invite tokens must not be expired. This route is typically hit by the UI exactly when a student clicks an invitation URL. Pass token as query parameter.
* **Auth Required:** No

**Request Query Parameters:**
`?token=magic_token_string_here`

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "email": "invited@student.com",
      "name": "New Student"
    }
  }
}
```

---

### `POST /api/auth/setup-account`
Consumes a valid Magic Link / Invite token and finalizes account creation by configuring a mandatory password.
* **Important Constraint:** Password must pass Zod complexity validation (Min 8 chars, 1 Uppercase, 1 Lowercase, 1 Number, 1 Special Char). Once used, the token is permanently invalidated.
* **Auth Required:** No

**Request Structure:**
```json
{
  "token": "magic_token_string_here",
  "password": "NewStrongPassword123!"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Account setup successfully",
  "data": {
     "user": {
       "id": "uuid",
       "email": "invited@student.com",
       "role": "STUDENT"
     },
     "tokens": {
       "accessToken": "...",
       "refreshToken": "..."
     }
  }
}
```

---

### `GET /api/auth/me`
Retrieves the active profile of the current JWT-verified user.
* **Important Constraint:** Crucial endpoint utilized by the front-end router to rebuild context on page refresh and securely sync virtual `usdUsed` against `usdQuota` limits.
* **Auth Required:** Yes (`Bearer <token>`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "role": "STUDENT",
      "usdQuota": 5.0,
      "usdUsed": 4.12,
      "tokenLimit": 50000,
      "tokenUsed": 42000,
      "streak": 5,
      "totalSessions": 12
    }
  }
}
```

---

### `PUT /api/auth/me`
Updates user-specific profile configurations (e.g., UI preferences or display names).
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "name": "Updated Name"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
       "id": "...", 
       "name": "Updated Name"
    }
  }
}
```

---

### `POST /api/auth/change-password`
Allows an already authenticated user to swap out their working password.
* **Important Constraint:** User must provide their existing exact password string. Both properties are strongly validated for matching algorithms.
* **Auth Required:** Yes 

**Request Structure:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewStrongPassword456!"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": null
}
```

---

### `POST /api/auth/set-new-password`
Consumed by user sessions when an admin flags `forcePasswordChange = true`. Allows forced resets.
* **Important Constraint:** Overrides existing passwords without requiring `currentPassword`. User cannot utilize platform LLM routes until this resolves into `false`.
* **Auth Required:** Yes 

**Request Structure:**
```json
{
  "newPassword": "MandatoryNewPassword789!"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Password set successfully",
  "data": null
}
```

---

### `POST /api/auth/logout`
Destroys the current authentication state natively on the request vector.
* **Auth Required:** Yes

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```


## 2. Sessions & Messages (`/api/sessions`)

---

### `GET /api/sessions`
List all historical sessions tied to the authenticated user. Includes pagination.
* **Auth Required:** Yes (`Bearer <token>`)

**Request Query Parameters:**
* `?page=1` (default: 1)
* `?limit=20` (default: 20)
* `?modelId=uuid-string` (optional filter)
* `?chatbotId=uuid-string` (optional filter)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
         "id": "uuid-string",
         "title": "Chat about React Hooks",
         "modelId": "uuid-string",
         "chatbotId": null,
         "status": "COMPLETED",
         "createdAt": "2026-03-25T14:48:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

### `POST /api/sessions`
Creates a brand new LLM conversation session.
* **Important Constraint:** Requires a valid `modelId` (UUID) that the user is authorized to use.
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "modelId": "uuid-string",
  "chatbotId": "uuid-string" // (Optional) Specific agent configuration
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "session": {
       "id": "uuid-string",
       "title": "New Chat",
       "modelId": "uuid-string",
       "userId": "uuid-string",
       "status": "ACTIVE",
       "createdAt": "2026-03-25T14:48:00Z"
    }
  }
}
```

---

### `GET /api/sessions/:id`
Retrieves metadata properties and context boundaries for a specific active session.
* **Auth Required:** Yes

**Request Path Parameter:**
* `:id` - The UUID of the session

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid-string",
      "title": "New Chat",
      "model": { 
          "id": "uuid-string", 
          "name": "GPT-4",
          "provider": "OPENAI"
      },
      "status": "ACTIVE",
      "createdAt": "2026-03-25T14:48:00Z"
    }
  }
}
```

---

### `PATCH /api/sessions/:id`
Update session properties, predominantly the session title. Useful for UI auto-naming after initial message generation.
* **Important Constraint:** Title must be between 1 and 200 characters string.
* **Auth Required:** Yes 

**Request Structure:**
```json
{
  "title": "Updated Title for Chat"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
       "id": "uuid-string", 
       "title": "Updated Title for Chat"
    }
  }
}
```

---

### `POST /api/sessions/:id/end`
Explicitly terminates a session. Once a session is `COMPLETED`, no more messages can be appended.
* **Auth Required:** Yes 

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Session ended successfully",
  "data": null
}
```

---

### `GET /api/sessions/:id/messages`
Retrieves the full message history in chronological order for the requested session.
* **Auth Required:** Yes 

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "messages": [
       {
          "id": "uuid-string",
          "role": "USER",
          "content": "Hello world",
          "tokensUsed": 15,
           "createdAt": "2026-03-25T14:48:00Z"
       },
       {
          "id": "uuid-string",
          "role": "ASSISTANT",
          "content": "Hello! How can I help you?",
          "tokensUsed": 20,
          "createdAt": "2026-03-25T14:48:05Z"
       }
    ]
  }
}
```

---

### `POST /api/sessions/:id/messages`
Send a standard text message for non-streaming scenarios.
* **Important Constraint:** Message block length must be between 1 and 10000 characters. Rejects if session is `COMPLETED`. User account will be debited for token consumed.
* **Auth Required:** Yes 

**Request Structure:**
```json
{
  "content": "What is the capital of France?"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": {
        "id": "uuid-string",
        "role": "ASSISTANT",
        "content": "The capital of France is Paris.",
        "tokensUsed": 17,
        "createdAt": "2026-03-25T14:50:00Z"
    }
  }
}
```

---

### `POST /api/sessions/:id/messages/stream`
Send a textual message block and utilize Server-Sent Events (SSE) to stream the resulting character chunks back.
* **Important Constraint:** Client must handle `text/event-stream` stream payloads. Emits strictly formatted events (`chunk`, `done`, `error`). The UI token deduction occurs lazily in the background to ensure latency is decoupled from analytics writes.
* **Auth Required:** Yes 

**Request Structure:**
```json
{
  "content": "Write a poem about Paris."
}
```

**Response Structure (SSE Event Stream):**
```text
event: chunk
data: {"text": "In"}

event: chunk
data: {"text": " Paris"}

event: done
data: {"messageId": "uuid-string", "usage": {"promptTokens": 10, "completionTokens": 30, "totalTokens": 40}}
```


## 3. Custom Chatbots / Agents (`/api/chatbots`)

---

### `GET /api/chatbots/guardrails`
Fetch globally available system guardrails that can be attached to custom agents to enforce safety boundaries.
* **Auth Required:** Yes (`Bearer <token>`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "guardrails": [
      {
        "id": "uuid-string",
        "name": "Refuse Code Execution",
        "description": "Prevents the agent from writing executable code.",
        "configuration": { "action": "block", "regex": ["eval\(", "exec\("] }
      }
    ]
  }
}
```

---

### `GET /api/chatbots`
Returns a list of all custom specialized agents/chatbots created by the authenticated user.
* **Auth Required:** Yes

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "chatbots": [
      {
        "id": "uuid-string",
        "name": "SQL Code Reviewer",
        "description": "Reviews SQL queries for performance bottlenecks.",
        "modelId": "uuid-string",
        "strictMode": true,
        "createdAt": "2026-03-25T14:48:00Z"
      }
    ]
  }
}
```

---

### `POST /api/chatbots`
Create a newly specialized agent.
* **Important Constraint:** `name` and `modelId` are strictly required. You may optionally supply `behaviorPrompt`, `strictMode`, knowledge base files, or `guardrailIds`.
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "name": "SQL Code Reviewer",
  "description": "Reviews SQL queries.",
  "modelId": "uuid-string",
  "behaviorPrompt": "You are a senior database administrator...",
  "strictMode": true,
  "knowledgeBase": [
     "internal-guidelines.pdf"
  ],
  "guardrailIds": ["uuid-string-1", "uuid-string-2"]
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Chatbot created successfully",
  "data": {
    "chatbot": {
       "id": "uuid-string",
       "name": "SQL Code Reviewer",
       "modelId": "uuid-string",
       "behaviorPrompt": "You are a senior database administrator...",
       "strictMode": true,
       "userId": "uuid-string",
       "createdAt": "2026-03-25T15:00:00Z"
    }
  }
}
```

---

### `GET /api/chatbots/:id`
Retrieves the deep configuration and metadata of a specific custom agent.
* **Auth Required:** Yes

**Request Path Parameter:**
* `:id` - The UUID of the chatbot

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "chatbot": {
       "id": "uuid-string",
       "name": "SQL Code Reviewer",
       "description": "Reviews SQL queries.",
       "model": { "id": "uuid-string", "name": "Claude 3 Opus" },
       "guardrails": [
          { "id": "uuid-string", "name": "Sanitize Outputs" }
       ],
       "createdAt": "2026-03-25T15:00:00Z"
    }
  }
}
```

---

### `PUT /api/chatbots/:id`
Update a specific custom agent's behavior, name, or attached guardrails. All payload fields are optional constraints.
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "name": "Updated SQL Reviewer",
  "strictMode": false
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Chatbot updated successfully",
  "data": {
    "chatbot": {
       "id": "uuid-string",
       "name": "Updated SQL Reviewer",
       "strictMode": false
    }
  }
}
```

---

### `DELETE /api/chatbots/:id`
Permanently delete an agent. All past chat histories using this agent remain intact but point to a nullified `chatbotId`.
* **Auth Required:** Yes

**Request Structure:** *None*

**Response Structure (204 No Content):**
*(Empty Response Body)*

---

### `GET /api/chatbots/:id/stats`
Retrieves aggregate token consumption and overall usage analytics strictly originating from this targeted agent.
* **Auth Required:** Yes

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": {
       "totalSessions": 42,
       "totalMessages": 315,
       "totalTokens": 850020,
       "estimatedCostUsd": 12.50
    }
  }
}
```


## 4. Multi-Model Comparison (`/api/comparison`)

---

### `GET /api/comparison/categories`
Retrieve all available valid categories configured in the platform (e.g., General, Coding, Data Analysis) that can be used to bucket models for comparison.
* **Auth Required:** Yes (`Bearer <token>`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": [
    "General",
    "Coding",
    "Creative",
    "Data Analysis"
  ],
  "message": "Categories retrieved successfully"
}
```

---

### `GET /api/comparison/models/:category`
Retrieve all functional, accessible models filtered down to a specific category.
* **Auth Required:** Yes

**Request Path Parameter:**
* `:category` - Name of the category (e.g., "Coding")

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "GPT-4",
      "provider": "OPENAI",
      "category": "Coding"
    },
    {
      "id": "uuid-string",
      "name": "Claude 3.5 Sonnet",
      "provider": "ANTHROPIC",
      "category": "Coding"
    }
  ],
  "message": "Models retrieved successfully"
}
```

---

### `POST /api/comparison/start-exchange`
Initializes a new synchronous multi-model comparison benchmark. Creates the parent `ComparisonSession` (if one isn't provided) and the `ComparisonExchange` record for this specific turn, returning the IDs needed to execute the models.
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "category": "Coding",
  "modelIds": ["uuid-model-1", "uuid-model-2"],
  "prompt": "Write a python script to reverse a string.",
  "comparisonSessionId": "uuid-session-id" // Optional: Omit to create a new session
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-id",
    "exchangeId": "uuid-exchange-id",
    "models": [ "uuid-model-1", "uuid-model-2" ]
  },
  "message": "Exchange started successfully"
}
```

---

### `POST /api/comparison/run-model`
Executes an isolated, single model request as part of a multi-model benchmark. This is called independently for each model in the exchange so that one slow model doesn't block the faster ones. Returns the finalized response non-streamed.
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "modelId": "uuid-model-1",
  "exchangeId": "uuid-exchange-id"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "responseId": "uuid-response-id",
    "content": "def reverse_string(s):\n    return s[::-1]",
    "tokensUsed": 45,
    "executionTimeMs": 1200
  },
  "message": "Model comparison completed"
}
```

---

### `POST /api/comparison/stream-model`
Similar to `/run-model`, but executes the isolated model request using Server-Sent Events (SSE) for streaming text generation directly into the multi-pane UI.
* **Important Constraint:** Client must handle `text/event-stream` payloads. It streams text chunks, then a final metadata event (`done`).
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "modelId": "uuid-model-1",
  "exchangeId": "uuid-exchange-id"
}
```

**Response Structure (SSE Event Stream):**
```text
event: chunk
data: {"text": "def"}

event: chunk
data: {"text": " reverse_string(s):\n"}

event: done
data: {"responseId": "uuid-response", "tokensUsed": 45, "executionTimeMs": 1100}
```

---

### `POST /api/comparison/compare`
Legacy monolithic route: Submits a single-shot prompt to multiple models concurrently and waits for all of them to finish generating before returning the payload. Not recommended for slow models or high concurrency.
* **Auth Required:** Yes

**Request Structure:**
```json
{
  "category": "Coding",
  "modelIds": ["uuid-model-1", "uuid-model-2"],
  "prompt": "Write a fast sorting algorithm.",
  "comparisonSessionId": "uuid-optional-session"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "exchangeId": "uuid-exchange",
    "results": [
      {
         "modelId": "uuid-model-1",
         "content": "def quicksort(arr): ...",
         "tokensUsed": 120,
         "executionTimeMs": 1800
      },
      {
         "modelId": "uuid-model-2",
         "content": "function quickSort(arr) { ... }",
         "tokensUsed": 105,
         "executionTimeMs": 1400
      }
    ]
  },
  "message": "Comparison completed successfully"
}
```

---

### `GET /api/comparison/sessions`
Retrieves a paginated/listed history of the user's past multi-model comparison exchanges.
* **Auth Required:** Yes

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-session",
      "title": "Sorting Algorithms",
      "category": "Coding",
      "createdAt": "2026-03-25T14:00:00Z"
    }
  ],
  "message": "Sessions retrieved successfully"
}
```

---

### `GET /api/comparison/sessions/:sessionId`
Extracts the deeply detailed breakdown of a specific comparison session, including all the cascading exchanges, models used, and full textual outputs.
* **Auth Required:** Yes

**Request Path Parameter:**
* `:sessionId` - The UUID of the Comparison Session

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-session",
    "title": "Sorting Algorithms",
    "category": "Coding",
    "exchanges": [
      {
        "id": "uuid-exchange",
        "prompt": "Write a python script to reverse a string.",
        "responses": [
          {
            "model": { "name": "GPT-4" },
            "content": "def reverse_string(s)...",
            "tokensUsed": 45
          },
          {
            "model": { "name": "Claude 3.5 Sonnet" },
            "content": "return s[::-1]",
            "tokensUsed": 40
          }
        ]
      }
    ]
  },
  "message": "Session details retrieved successfully"
}
```

---

### `DELETE /api/comparison/sessions/:sessionId`
Permenantly deletes a specific multi-model comparison session and cascades the deletion to all its exchanges and response data.
* **Auth Required:** Yes

**Request Path Parameter:**
* `:sessionId` - The UUID of the session

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Session deleted successfully"
}
```


## 5. Administrative Operations (`/api/admin`)

*(Requires ADMIN role-based access control. All requests must provide an `Authorization: Bearer <token>` of an admin user).*

### User Management

---

#### `GET /api/admin/students`
Retrieves a paginated list of all registered student accounts.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Query Parameters:**
* `?page=1` (default: 1)
* `?limit=20` (default: 20)
* `?courseId=uuid-string` (optional filter)
* `?batchId=uuid-string` (optional filter)
* `?search=term` (optional search by name/email/registrationId)
* `?isActive=true|false` (optional filter)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "email": "student@example.com",
      "name": "Jane Student",
      "registrationId": "STU12345",
      "role": "STUDENT",
      "isActive": true,
      "usdQuota": 5.00,
      "usdUsed": 0.50,
      "tokenLimit": 50000,
      "tokenUsed": 1000,
      "createdAt": "2026-03-25T14:48:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

#### `GET /api/admin/students/:id`
Retrieve detailed metadata and linked properties (like course and batch info) for a specific student.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Path Parameter:**
* `:id` - Student UUID

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid-string",
      "email": "student@example.com",
      "name": "Jane Student",
      "registrationId": "STU12345",
      "course": { "id": "uuid-string", "name": "GenAI 101" },
      "batch": { "id": "uuid-string", "name": "Morning Batch" }
    }
  }
}
```

---

#### `POST /api/admin/students`
Manually provisions a single student account directly into the database. Often used alongside email invitations.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "email": "new.student@example.com",
  "name": "John Doe",
  "registrationId": "STU99999",
  "courseId": "uuid-string", // Optional
  "batchId": "uuid-string",  // Optional
  "tokenLimit": 100000       // Optional
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
     "student": {
       "id": "uuid-string",
       "email": "new.student@example.com",
       "registrationId": "STU99999"
     }
  }
}
```

---

#### `PUT /api/admin/students/:id`
Modify bounds (like tokenQuotas), state (like isActive), or mapped metadata for a student.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure (All Optional):**
```json
{
  "name": "Updated Name",
  "email": "updated.student@example.com",
  "courseId": "uuid-string",
  "batchId": "uuid-string",
  "tokenQuota": 150000,
  "isActive": false
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": { "student": { "id": "...", "isActive": false } },
  "message": "Student updated successfully"
}
```

---

#### `DELETE /api/admin/students/:id`
Hard delete a student from the platform. Cascades usage data safely depending on referential rules.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK or 204 No Content):**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "data": null
}
```

---

#### `POST /api/admin/students/:id/reset-password`
Forces a password reset flag onto the student. Will intercept their next login.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Password reset enforced"
}
```

---

#### `POST /api/admin/students/bulk`
Executes an atomic batch operation onto a designated selection of registration IDs.
* **Important Constraint:** Supported operations reflect: `update_status`, `update_tokens`, `reset_passwords`, `delete`.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "operation": "update_tokens",
  "registrationIds": ["STU123", "STU124", "STU125"],
  "value": 200000
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
     "affected": 3
  },
  "message": "Bulk operation successful"
}
```

---

#### `POST /api/admin/students/import`
Bulk imports users mapping properties via an ingested JSON payload array (often parsed from CSV UI).
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "batchId": "uuid-string", // Optional default for all
  "students": [
    {
      "email": "batch1@test.com",
      "name": "Batch User 1",
      "registrationId": "REG001"
    },
    {
      "email": "batch2@test.com",
      "name": "Batch User 2",
      "registrationId": "REG002"
    }
  ]
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "data": { "imported": 2, "failed": 0 },
  "message": "Students imported successfully"
}
```

---

#### `POST /api/admin/students/:id/invite`
Issues and routes an initial welcome registration email / magic link.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": { "inviteToken": "magic-uuid-string" },
  "message": "Invite generated and mapped successfully"
}
```

---

#### `GET /api/admin/students/:id/invite-status`
Checks if the Magic Link delivery logic has pending or completed status markers.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "SENT",
    "sentAt": "2026-03-25T10:00:00Z"
  }
}
```

---

#### `POST /api/admin/students/:id/resend-invite`
Re-triggers the transport mapping / email sending service if the student lost their previous token or expiry lapsed.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": { "inviteToken": "new-magic-uuid" },
  "message": "Invite resent successfully"
}
```

---

#### `POST /api/admin/students/bulk-invite`
Mass issues trigger commands off a defined array of Student Registration IDs.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "registrationIds": ["STU123", "STU124", "STU125"]
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": { "invitesSent": 3 },
  "message": "Bulk invites executed successfully"
}
```


### Organization Setup

---

#### `GET /api/admin/courses`
Lists all active structural courses / tracks registered on the platform. Includes nested arrays mapping attached batches.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "uuid-string",
        "name": "Generative AI Foundations",
        "description": "Introductory concepts for AI logic.",
        "instructor": "Dr. Smith",
        "duration": 40,
        "createdAt": "2026-03-25T14:00:00Z",
        "batches": [
          {
            "id": "uuid-string",
            "name": "Alpha Intake",
            "_count": { "students": 45 }
          }
        ],
        "_count": { "students": 120 }
      }
    ]
  }
}
```

---

#### `POST /api/admin/courses`
Creates a brand new learning track/course. Overarching properties applied here trickle down to user routing.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "name": "Advanced Prompt Engineering",
  "description": "Deep dive into ReAct and Chain-of-Thought",
  "instructor": "Jane Doe",
  "duration": 60
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "course": {
       "id": "uuid-string",
       "name": "Advanced Prompt Engineering",
       "instructor": "Jane Doe"
    }
  }
}
```

---

#### `PUT /api/admin/courses/:id`
Updates high-level constraints mapping an existing course.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure (All Optional):**
```json
{
  "name": "Updated Format Name",
  "description": "Updated Description"
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
     "course": { "id": "uuid", "name": "Updated Format Name" }
  }
}
```

---

#### `DELETE /api/admin/courses/:id`
Permenantly removes a course structure. 
* **Important Constraint:** Usually rejected by the DB if there are still active students attached to its nested child batches to prevent orphaned users.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Course deleted successfully"
}
```

---

#### `GET /api/admin/batches`
Retrieves granular scheduling groupings under courses. Extensively used for access-control partitioning.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Query Parameters:**
* `?courseId=uuid-string` (optional filter)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "id": "uuid-string",
        "name": "Weekend Track A",
        "courseId": "uuid-string",
        "course": { "name": "GenAI Foundations" },
        "_count": { "students": 25 }
      }
    ]
  }
}
```

---

#### `POST /api/admin/batches`
Binds a new organizational batch to an existing overarching `courseId`.
* **Important Constraint:** Both `courseId` and `name` are strictly required by the Zod Schema.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "courseId": "uuid-string-course",
  "name": "Spring 2026 Virtual Intake"
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Batch created successfully",
  "data": {
    "batch": {
       "id": "uuid-string",
       "courseId": "uuid-string-course",
       "name": "Spring 2026 Virtual Intake"
    }
  }
}
```

---

#### `DELETE /api/admin/batches/:id`
Permenantly deletes an organizational grouping. 
* **Important Constraint:** Often fails if constraint keys tie students to this batch, students must be re-routed first.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Batch deleted successfully"
}
```

### Platform Config & Analytics

---

#### `GET /api/admin/analytics`
Fetches a high-level real-time snapshot of the platform's overall consumption, token metrics, $USD usage, and user growth distributions.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "activeStudents": 120,
    "totalSessions": 4500,
    "totalPrompts": 18000,
    "totalTokensUsed": 45000000,
    "totalEstimatesUSD": 124.50,
    "modelUsage": {
       "uuid-gpt4": 25000000,
       "uuid-claude": 20000000
    },
    "recentActivity": [
       { "date": "2026-03-25", "tokens": 150000 }
    ]
  }
}
```

---

#### `GET /api/admin/settings`
Retrieves the overarching global safety rules, default quotas for new students, and system threshold flags.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
     "id": "default",
     "defaultTokenQuota": 100000,
     "autoRefill": false,
     "lowBalanceAlert": true,
     "hardLimitEnforcement": true,
     "lowBalanceThreshold": 20,
     "maxTokensPerRequest": 4000,
     "maxRequestsPerMinute": 30,
     "aiIntentDetection": true,
     "strictMode": false
  }
}
```

---

#### `PUT /api/admin/settings`
Updates the global settings. These changes take effect immediately across all newly created sessions or newly created students.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure (All Optional):**
```json
{
  "defaultTokenQuota": 150000,
  "maxTokensPerRequest": 5000,
  "hardLimitEnforcement": false
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
     "id": "default",
     "defaultTokenQuota": 150000,
     "maxTokensPerRequest": 5000,
     "hardLimitEnforcement": false
  }
}
```

---

#### `GET /api/admin/tokens/exceeded`
Extracts a list of student accounts that have breached their hard token/USD allocation boundaries. Often used to debug negative balances.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
       {
         "id": "uuid-string",
         "email": "breach@example.com",
         "tokenLimit": 50000,
         "tokenUsed": 55000
       }
    ]
  }
}
```

---

#### `POST /api/admin/tokens/fix-exceeded`
A system reconciliation endpoint. It automatically zeroes out or aligns negative boundary limits so a student's quota accurately reflects maximum threshold locks.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Fixed 12 exceeded quotas successfully",
  "data": { "fixedCount": 12 }
}
```


### Providers & Guardrails

---

#### `GET /api/admin/api-keys`
Retrieves the configuration statuses of external AI provider integrations (e.g., OpenAI, Anthropic). The actual keys are masked in the response for security.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "provider": "openai",
        "isActive": true,
        "baseUrl": null
      },
      {
        "provider": "anthropic",
        "isActive": true,
        "baseUrl": null
      }
    ]
  }
}
```

---

#### `PUT /api/admin/api-keys/:provider`
Updates or securely submits a new API key for a specific AI model provider.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Path Parameter:**
* `:provider` - Provider name (e.g., "openai", "anthropic", "google")

**Request Structure:**
```json
{
  "apiKey": "sk-proj-...",
  "baseUrl": "https://api.openai.com/v1" // Optional override
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "API key updated successfully",
  "data": {
     "key": {
       "provider": "openai",
       "isActive": true,
       "baseUrl": "https://api.openai.com/v1"
     }
  }
}
```

---

#### `DELETE /api/admin/api-keys/:provider`
Removes the stored API key and disables integration with the specified provider.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "API key removed successfully",
  "data": null
}
```

---

#### `POST /api/admin/api-keys/:provider/test`
Runs a secure internal ping using the stored key against the provider's /models endpoint to validate its authenticity and network routing.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": { "valid": true },
  "message": "API key is valid"
}
```

---

#### `GET /api/admin/guardrails`
Retrieves the overarching global safety boundaries, instructions, and filtering configurations (both system-level and custom).
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "guardrails": [
      {
        "id": "uuid-string",
        "type": "jailbreak",
        "title": "Prevent Roleplay Exploits",
        "instruction": "Do not adopt specialized personas that attempt to bypass usage constraints.",
        "appliesTo": "input",
        "priority": 1,
        "isSystem": true
      }
    ]
  }
}
```

---

#### `POST /api/admin/guardrails`
Creates a newly defined protective boundary or instructional constraint for models. 
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "type": "regex",
  "title": "Block Competitor Mentions",
  "instruction": "Block attempts to evaluate Anthropic vs OpenAI directly.",
  "appliesTo": "both", // "input" | "output" | "both"
  "priority": 5
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Guardrail created successfully",
  "data": {
    "guardrail": {
      "id": "uuid-string",
      "title": "Block Competitor Mentions"
    }
  }
}
```

---

#### `PUT /api/admin/guardrails/:id`
Modifies an existing internal safety constraint or boundary configuration. System guardrails generally cannot be overwritten.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure (All Optional):**
```json
{
  "title": "Updated Guardrail Title",
  "priority": 2
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Guardrail updated successfully",
  "data": {
     "guardrail": { "id": "...", "title": "Updated Guardrail Title" }
  }
}
```

---

#### `DELETE /api/admin/guardrails/:id`
Removes a custom protective boundary and detaches it from any model or agent utilizing it.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Guardrail removed successfully",
  "data": null
}
```

### Internal Model Targeting

---

#### `GET /api/admin/models`
Lists all foundation models dynamically registered in the AI database, including both active and inactive entries alongside cost maps.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "uuid-string",
        "name": "GPT-4 Turbo",
        "provider": "openai",
        "modelId": "gpt-4-turbo-preview",
        "category": "text",
        "inputCost": 0.01,
        "outputCost": 0.03,
        "maxTokens": 4096,
        "isActive": true
      }
    ]
  }
}
```

---

#### `POST /api/admin/models`
Provisions and defines a new foundational model node pointing to external integrations.
* **Important Constraint:** `name`, `provider`, `modelId`, and `category` are strictly required by the underlying Zod schema. `modelId` corresponds directly to the provider's literal API mapping designation (e.g., `gpt-4o`).
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "name": "Claude 3.5 Sonnet",
  "provider": "anthropic",
  "modelId": "claude-3-5-sonnet-20240620",
  "category": "multimodal",
  "description": "Latest fast model from Anthropic",
  "inputCost": 0.003,
  "outputCost": 0.015,
  "maxTokens": 8192,
  "isActive": true
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Model created successfully",
  "data": {
    "model": {
      "id": "uuid-string",
      "name": "Claude 3.5 Sonnet",
      "category": "multimodal"
    }
  }
}
```

---

#### `PUT /api/admin/models/:modelId`
Refines an existing active model's routing designations, capabilities classification, or USD cost map mapping algorithms.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "inputCost": 0.002,
  "outputCost": 0.01,
  "maxTokens": 16000
}
```

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "uuid-string",
      "inputCost": 0.002,
      "maxTokens": 16000
    }
  }
}
```

---

#### `DELETE /api/admin/models/:modelId`
Permanently detaches and eliminates the configuration entry for a linked foundational model. 
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Model deleted successfully",
  "data": null
}
```

---

#### `POST /api/admin/models/:modelId/toggle`
Soft switches a registered model's global access status without permanently discarding it. Will interrupt access for currently connected students relying on it if disabled.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Model deactivated",
  "data": {
    "model": { "id": "...", "isActive": false }
  }
}
```

---

#### `POST /api/admin/models/:modelId/test`
Dispatches a secure non-billed ping specifically testing this model's mapping capability using the stored provider keys, ensuring it replies.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Model connection is highly stable",
  "data": { "valid": true }
}
```

---

#### `GET /api/admin/models/:modelId/access`
Examines all current access locks defining what constraints limit routing to this specific model ID globally (mapped to Groups, Courses, Batches, or individual students).
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Path Parameter:**
* `:modelId` - UUID of the AI Model

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "access": [
      {
        "id": "uuid-access-rule",
        "modelId": "uuid-model",
        "course": { "id": "uuid-course", "name": "GenAI Fundamentals" },
        "createdAt": "2026-03-25T14:48:00Z"
      }
    ]
  }
}
```

---

#### `POST /api/admin/models/access`
Generates a specific relational lock restricting or enabling model routing constrained dynamically to the supplied hierarchy context (e.g. locks an expensive model only to a specific user batch).
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Structure:**
```json
{
  "modelId": "uuid-model-string",
  "courseId": "uuid-course-string" // OR batchId, studentId
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Access granted",
  "data": {
     "access": {
        "id": "uuid-access-rule",
        "modelId": "uuid-model-string",
        "courseId": "uuid-course-string"
     }
  }
}
```

---

#### `DELETE /api/admin/models/access/:id`
Drops and drops a restrictive mapping node off a model routing table.
* **Auth Required:** Yes (`ROLE: ADMIN`)

**Request Path Parameter:**
* `:id` - UUID of the specific restricted Access Rule item (not the model UUID)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Access removed successfully",
  "data": null
}
```


## 6. Student Dashboard & Activity (`/api/students`)

---

### `GET /api/students/dashboard`
Generates top-level summary token constraints, session usage stats, prompt volume metrics, and low-balance UI alerts for the logged-in student.
* **Auth Required:** Yes (`ROLE: STUDENT`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "name": "Jane Student",
      "course": { "id": "uuid-string", "name": "GenAI 101" },
      "batch": { "id": "uuid-string", "name": "Morning Intake" }
    },
    "stats": {
      "sessions": 45,
      "avgScore": 8.5,
      "prompts": 120,
      "artifacts": 12,
      "chatbots": 3
    },
    "tokens": {
      "quota": 100000,
      "used": 45000,
      "remaining": 55000,
      "usagePercent": 45.0,
      "lowBalanceAlert": {
        "show": false,
        "threshold": 10,
        "remainingPercent": 55.0,
        "message": "Your token balance is low (55% remaining)."
      }
    },
    "recentActivity": [
      { "date": "2026-03-25", "count": 12 }
    ]
  }
}
```

---

### `GET /api/students/recent-sessions`
Fetches the user's most recent interactions and their attached metadata. Good for the UI sidebar or "Continue Chat" displays.
* **Auth Required:** Yes (`ROLE: STUDENT`)

**Request Query Parameters:**
* `?limit=10` (default: 10)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid-string",
        "title": "React Hook Explanations",
        "modelId": "uuid-string",
        "createdAt": "2026-03-25T14:48:00Z",
        "updatedAt": "2026-03-26T10:00:00Z",
        "model": {
          "id": "uuid-string",
          "name": "GPT-4",
          "provider": "openai",
          "category": "text"
        },
        "chatbot": null,
        "_count": {
          "messages": 5
        }
      }
    ]
  }
}
```

---

### `GET /api/students/leaderboard`
View performance rankings mapped either platform-wide (`institutional`) or scoped strictly to their `course` enrollment.
* **Auth Required:** Yes (`ROLE: STUDENT`)

**Request Query Parameters:**
* `?type=institutional` (`institutional` | `course`, default: `institutional`)
* `?courseId=uuid` (optional)
* `?limit=20` (default: 20)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "institutional",
    "leaderboard": [
      {
        "rank": 1,
        "id": "uuid-string",
        "name": "Jane Student",
        "registrationId": "STU123",
        "course": "GenAI 101",
        "avgScore": 9.2,
        "sessions": 50,
        "tokensUsed": 85000
      }
    ]
  }
}
```

---

### `GET /api/students/rank`
Extracts a granular calculation reflecting the student's comparative placement strictly inside their currently enrolled course.
* **Auth Required:** Yes (`ROLE: STUDENT`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "rank": 5,
    "total": 120
  }
}
```

---

### `GET /api/students/activity-calendar`
Extracts structural boolean timeline events representing days the user operated the platform (like GitHub's contribution graph UI block). Generates a dynamic user streak metric.
* **Auth Required:** Yes (`ROLE: STUDENT`)

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "month": 3,
    "year": 2026,
    "activeDays": [1, 2, 3, 5, 8, 12, 13, 14, 25],
    "totalActiveDays": 9,
    "currentStreak": 1
  }
}
```


## 7. Foundation Models (User Specific) (`/api/models`)

---

### `GET /api/models`
Retrieves a list of all universally active models on the platform that the authenticated user is currently permitted to interact with.
* **Auth Required:** Yes 

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "uuid-string",
        "name": "GPT-4 Turbo",
        "provider": "openai",
        "modelId": "gpt-4-turbo-preview",
        "category": "text",
        "inputCost": 0.01,
        "outputCost": 0.03,
        "maxTokens": 4096,
        "isActive": true
      }
    ]
  }
}
```

---

### `GET /api/models/:id`
Fetch strict parametric bounds and detailed constraints mapping (like parameter limits, max tokens) for a specific foundational model.
* **Auth Required:** Yes 

**Request Path Parameter:**
* `:id` - The UUID of the Model

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "uuid-string",
      "name": "Claude 3 Opus",
      "provider": "anthropic",
      "category": "text",
      "description": "Powerful model for complex tasks",
      "inputCost": 0.015,
      "outputCost": 0.075,
      "maxTokens": 4096,
      "isActive": true
    }
  }
}
```

---

### `GET /api/models/category/:category`
Filter and extract all models belonging specifically to a particular task domain like textual analysis, coding, or image generation.
* **Auth Required:** Yes 

**Request Path Parameter:**
* `:category` - Category name (e.g., `text`, `image`, `multimodal`, `code`)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "category": "code",
    "models": [
      {
        "id": "uuid-string",
        "name": "CodeLlama",
        "provider": "meta",
        "category": "code",
        "maxTokens": 8000
      }
    ]
  }
}
```

---

### `GET /api/models/stats/usage`
Aggregates token consumption history exclusively grouped by distinct models dynamically utilized by the logged-in user across all conversations.
* **Auth Required:** Yes 

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "model": {
          "id": "uuid-string",
          "name": "GPT-4",
          "provider": "openai",
          "category": "text"
        },
        "sessions": 12,
        "tokensUsed": 450000
      },
      {
        "model": {
          "id": "uuid-string",
          "name": "Claude 3.5 Sonnet",
          "provider": "anthropic",
          "category": "text"
        },
        "sessions": 25,
        "tokensUsed": 85000
      }
    ]
  }
}
```


## 8. Artifacts (`/api/artifacts`)

---

### `POST /api/artifacts`
Logs and persists a new artifact (such as standalone code blocks, generated text, images, or audio snippets) originating from an active LLM session.
* **Important Constraint:** The provided `sessionId` must belong to the logged-in user. The `type` must strictly match one of: `'text' | 'code' | 'image' | 'audio'`. 
* **Auth Required:** Yes 

**Request Structure:**
```json
{
  "sessionId": "uuid-string",
  "type": "code",
  "title": "React Login Component",
  "content": "export const Login = () => { ... }",
  "modelUsed": "claude-3-opus", // Optional
  "score": 95 // Optional 0-100 quality metric
}
```

**Response Structure (201 Created):**
```json
{
  "success": true,
  "message": "Artifact saved",
  "data": {
    "artifact": {
       "id": "uuid-string",
       "userId": "uuid-string",
       "sessionId": "uuid-string",
       "type": "code",
       "title": "React Login Component",
       "content": "export const Login = () => { ... }",
       "modelUsed": "claude-3-opus",
       "isBookmarked": false,
       "createdAt": "2026-03-25T14:48:00Z"
    }
  }
}
```

---

### `GET /api/artifacts`
List all saved and persisting fragments belonging to the authenticated user. Includes robust array-filtering and pagination logic.
* **Auth Required:** Yes 

**Request Query Parameters:**
* `?page=1` (default: 1)
* `?limit=20` (default: 20)
* `?type=code` (optional filter by type)
* `?sessionId=uuid` (optional filter to a specific session)
* `?bookmarked=true` (optional filter for only bookmarked)

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": [
      {
         "id": "uuid-string",
         "type": "code",
         "title": "React Login Component",
         "isBookmarked": true,
         "createdAt": "2026-03-25T14:48:00Z"
      }
  ],
  "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
  }
}
```

---

### `GET /api/artifacts/:id`
Retrieve the precise unaltered contents of an artifact object.
* **Auth Required:** Yes 

**Request Path Parameter:**
* `:id` - The UUID of the Artifact

**Response Structure (200 OK):**
```json
{
  "success": true,
  "data": {
    "artifact": {
       "id": "uuid-string",
       "type": "code",
       "title": "React Login Component",
       "content": "export const Login = () => { ... }",
       "isBookmarked": true,
       "createdAt": "2026-03-25T14:48:00Z",
       "session": {
         "id": "uuid-string",
         "title": "React Component Help"
       }
    }
  }
}
```

---

### `POST /api/artifacts/:id/bookmark`
Atomically toggles the active bookmark boolean state on a specific retained artifact. Helpful for organizing favorites.
* **Auth Required:** Yes 

**Request Path Parameter:**
* `:id` - The UUID of the Artifact

**Request Structure:** *None*

**Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Bookmarked",
  "data": {
    "artifact": {
       "id": "uuid-string",
       "isBookmarked": true
    }
  }
}
```

---

### `DELETE /api/artifacts/:id`
Issues a permanent record detachment natively deleting the fragment object from the database entirely.
* **Important Constraint:** If the artifact does not belong to the user, the DB raises a Forbidden exception.
* **Auth Required:** Yes 

**Request Structure:** *None*

**Response Structure (204 No Content):**
*(Empty Response Body)*
