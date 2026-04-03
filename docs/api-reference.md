# API Reference

Base URL: `http://localhost:3001`

All endpoints under `/api` return JSON. Authenticated endpoints require a session cookie (set via GitHub OAuth sign-in).

## Health

### `GET /health`

Health check. No authentication required.

**Response** `200 OK`

```json
{ "status": "ok" }
```

## Authentication

### `ALL /api/auth/*`

Handled by [Better Auth](https://www.better-auth.com/) with GitHub OAuth.

Key routes:
- `GET /api/auth/signin/github` — Initiate GitHub OAuth flow
- `GET /api/auth/callback/github` — OAuth callback
- `POST /api/auth/signout` — Sign out

### `GET /api/me`

Get the current authenticated user session.

**Response** `200 OK`

```json
{
  "user": {
    "id": "abc123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "image": "https://avatars.githubusercontent.com/u/12345"
  }
}
```

## Pipelines

### `POST /api/pipelines`

Create a new pipeline.

**Request body**

```json
{
  "name": "my-pipeline",
  "description": "Optional description",
  "config": {
    "steps": [
      {
        "name": "design",
        "agent": "claude",
        "prompt": "Design the architecture"
      },
      {
        "name": "implement",
        "agent": "claude",
        "prompt": "Implement the design",
        "dependsOn": ["design"]
      }
    ]
  }
}
```

**Validation rules:**
- `name` — Required, non-empty string
- `config.steps` — At least one step required
- Step names must be unique
- `dependsOn` references must point to existing step names
- Circular dependencies are rejected

**Response** `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "my-pipeline",
  "description": null,
  "ownerId": "user-id",
  "config": { "steps": [...] },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### `GET /api/pipelines`

List all pipelines owned by the authenticated user.

**Response** `200 OK`

```json
[
  {
    "id": "550e8400-...",
    "name": "my-pipeline",
    "description": null,
    "config": { "steps": [...] },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### `GET /api/pipelines/:id`

Get a specific pipeline by ID.

**Response** `200 OK` — Same shape as list item.

### `PATCH /api/pipelines/:id`

Update a pipeline's name, description, or config.

**Request body** (all fields optional)

```json
{
  "name": "updated-name",
  "description": "Updated description",
  "config": { "steps": [...] }
}
```

**Response** `200 OK` — Updated pipeline object.

### `DELETE /api/pipelines/:id`

Delete a pipeline.

**Response** `204 No Content`

## Pipeline Runs

### `POST /api/pipelines/:id/runs`

Trigger a new run for a pipeline. Checks usage limits before allowing execution.

**Response** `201 Created`

```json
{
  "id": "run-uuid",
  "pipelineId": "pipeline-uuid",
  "status": "pending",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Error** `429 Too Many Requests` — Usage limits exceeded for current billing tier.

### `GET /api/pipelines/:id/runs`

List all runs for a pipeline.

**Response** `200 OK`

```json
[
  {
    "id": "run-uuid",
    "pipelineId": "pipeline-uuid",
    "status": "completed",
    "startedAt": "2025-01-01T00:00:00.000Z",
    "completedAt": "2025-01-01T00:05:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### `GET /api/pipelines/:id/runs/:runId`

Get run details with inline step logs.

**Response** `200 OK`

```json
{
  "id": "run-uuid",
  "pipelineId": "pipeline-uuid",
  "status": "completed",
  "startedAt": "2025-01-01T00:00:00.000Z",
  "completedAt": "2025-01-01T00:05:00.000Z",
  "steps": [
    {
      "id": "step-uuid",
      "stepName": "design",
      "status": "completed",
      "output": "Architecture designed successfully...",
      "error": null,
      "startedAt": "2025-01-01T00:00:01.000Z",
      "completedAt": "2025-01-01T00:02:00.000Z"
    },
    {
      "id": "step-uuid-2",
      "stepName": "implement",
      "status": "completed",
      "output": "Implementation complete...",
      "error": null,
      "startedAt": "2025-01-01T00:02:01.000Z",
      "completedAt": "2025-01-01T00:05:00.000Z"
    }
  ]
}
```

### `GET /api/pipelines/:id/runs/:runId/stream`

Server-Sent Events stream for real-time run progress.

**Headers:** `Content-Type: text/event-stream`

**Events:**

```
data: {"type":"steps","steps":[{"stepName":"design","status":"running",...}]}

data: {"type":"steps","steps":[{"stepName":"design","status":"completed",...}]}

data: {"type":"done","status":"completed"}
```

The stream polls every 1 second and closes when the run reaches `completed` or `failed`.

### `GET /api/pipelines/:id/runs/:runId/logs`

Fetch aggregated logs for a run.

**Response** `200 OK`

```json
{
  "runId": "run-uuid",
  "logs": [
    {
      "stepName": "design",
      "status": "completed",
      "output": "...",
      "error": null,
      "startedAt": "...",
      "completedAt": "..."
    }
  ]
}
```

## Analytics

### `GET /api/analytics`

Get dashboard statistics for the authenticated user.

**Response** `200 OK`

```json
{
  "totalPipelines": 5,
  "totalRuns": 42,
  "completionRate": 95.2,
  "agentMinutes": 128
}
```

## Billing

### `GET /api/billing`

Get billing dashboard with subscription, usage, limits, and invoices.

**Response** `200 OK`

```json
{
  "subscription": {
    "tier": "pro",
    "status": "active",
    "currentPeriodEnd": "2025-02-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  },
  "usage": {
    "pipelineRuns": 42,
    "agentMinutes": 128
  },
  "limits": {
    "pipelineRuns": 5000,
    "agentMinutes": 500
  },
  "invoices": [
    {
      "id": "inv-uuid",
      "amountCents": 4900,
      "currency": "usd",
      "status": "paid",
      "paidAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/billing/checkout`

Create a Stripe checkout session to upgrade plans.

**Request body**

```json
{
  "tier": "pro"
}
```

**Response** `200 OK`

```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

Redirect the user to the returned URL.

### `POST /api/billing/portal`

Create a Stripe billing portal session for managing subscriptions.

**Response** `200 OK`

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

### `GET /api/billing/usage`

Get current month usage vs plan limits.

**Response** `200 OK`

```json
{
  "pipelineRuns": { "used": 42, "limit": 5000 },
  "agentMinutes": { "used": 128, "limit": 500 }
}
```

### `GET /api/billing/metrics`

Financial reporting metrics.

**Response** `200 OK`

```json
{
  "mrr": 24500,
  "tierBreakdown": {
    "pro": { "count": 4, "revenue": 19600 },
    "enterprise": { "count": 1, "revenue": 49900 }
  },
  "subscriptionStatusCounts": {
    "active": 5,
    "canceled": 1,
    "past_due": 0
  },
  "churnRate": 0.05,
  "revenueThisMonth": 24500
}
```

## Waitlist

### `POST /api/waitlist`

Add an email to the waitlist.

**Request body**

```json
{
  "email": "user@example.com"
}
```

**Response** `201 Created`

```json
{
  "id": "entry-uuid",
  "email": "user@example.com",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

## Webhooks

### `POST /api/webhooks/stripe`

Stripe webhook endpoint. Requires valid Stripe signature.

**Handled events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link Stripe subscription, set tier from price ID |
| `customer.subscription.updated` | Sync tier, status, and period dates |
| `customer.subscription.deleted` | Downgrade to free tier |
| `invoice.paid` | Create invoice record |
| `invoice.payment_failed` | Mark invoice failed, set subscription to `past_due` |

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| 400 | Invalid request body or parameters |
| 401 | Not authenticated |
| 403 | Not authorized (not the resource owner) |
| 404 | Resource not found |
| 429 | Usage limits exceeded |
| 500 | Internal server error |
