# WhatsApp AI Agent - Next.js Application

## Overview
Build a production-ready WhatsApp AI agent using the official Meta WhatsApp Business API with a Next.js app. This replaces n8n — our app handles the webhook, AI responses, and provides a frontend dashboard to view all conversations.

## Architecture

```
User sends WhatsApp message
  → Meta forwards to our webhook (POST /api/webhook)
  → App extracts message, stores in DB
  → App sends message to AI model (OpenRouter/OpenAI)
  → App sends AI response back via Meta Graph API
  → App stores AI response in DB
  → Frontend dashboard shows all conversations in real-time
```

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL) with Supabase JS client
- **AI**: OpenRouter API (OpenAI-compatible SDK)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel or any Node.js host

## Meta WhatsApp API Reference

### Webhook Verification (GET /api/webhook)
Meta sends a GET request to verify the webhook. Must return the `hub.challenge` value if `hub.verify_token` matches.

```
Query params: hub.mode, hub.verify_token, hub.challenge
Response: hub.challenge (plain text) if token matches, else 403
```

### Receiving Messages (POST /api/webhook)
Meta sends incoming messages as POST to the webhook.

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "type": "text",
          "text": { "body": "Hello" },
          "timestamp": "1234567890",
          "id": "wamid.xxx"
        }],
        "contacts": [{
          "profile": { "name": "User Name" },
          "wa_id": "919876543210"
        }]
      }
    }]
  }]
}
```

### Sending Messages (POST)
```
POST https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "{recipient_phone}",
  "type": "text",
  "text": { "body": "Response message here" }
}
```

## Implementation Plan

### Step 1: Project Setup
- Initialize Next.js project with TypeScript, Tailwind, App Router
- Install dependencies: `@supabase/supabase-js`, `openai` (for OpenRouter compatibility)
- Set up `.env` from `.env.example`

### Step 2: Database Schema (Supabase via MCP)
Use the Supabase MCP server (configured in `.mcp.json` as HTTP type) to apply migrations directly. The MCP tool `apply_migration` runs DDL against the project.

```
MCP Tool: apply_migration
Name: create_conversations_and_messages
Query:
```
```sql
create table conversations (
  id uuid default gen_random_uuid() primary key,
  phone text unique not null,
  name text,
  mode text not null default 'agent' check (mode in ('agent', 'human')),
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  whatsapp_msg_id text unique,
  created_at timestamp with time zone default now()
);

create index idx_messages_conversation on messages(conversation_id);
create index idx_conversations_updated on conversations(updated_at desc);
```

> **Note:** The `mode` column is included from the start (no separate ALTER needed). Use `list_tables` to verify after applying.

### Step 3: Webhook API Route (`/api/webhook`)
- **GET handler**: Verify webhook with Meta (check verify_token, return challenge)
- **POST handler**:
  1. Parse incoming message from Meta's webhook payload
  2. Ignore status updates (only process `messages`)
  3. Find or create conversation by phone number
  4. Store user message in DB
  5. Fetch conversation history from DB
  6. Send to AI model via OpenRouter (OpenAI SDK with custom baseURL)
  7. Send AI response back to user via Meta Graph API
  8. Store AI response in DB
  9. Return 200 immediately (process in background if needed)

### Step 4: Send Message Utility
```typescript
async function sendWhatsAppMessage(to: string, body: string) {
  const res = await fetch(
    `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );
  return res.json();
}
```

### Step 5: Webhook - Respect mode
In the POST webhook handler, before calling the AI:
1. Check the conversation's `mode` field
2. If `mode = 'agent'` → send message to AI, auto-reply via WhatsApp
3. If `mode = 'human'` → store the message only, do NOT auto-reply (human replies from the dashboard)

### Step 6: Frontend Dashboard

#### Layout
- **Sidebar (left)**: List of all conversations sorted by latest message
  - Show contact name/phone, last message preview, timestamp
  - Unread indicator for new messages in human mode
  - Active conversation highlighted
- **Chat panel (right)**: Full message history for selected conversation

#### Chat Panel Features
- WhatsApp-style chat bubbles (user messages on left, bot/human replies on right)
- Messages show timestamp, role label ("AI" or "You" for human replies)
- **Mode toggle (top of chat panel)**: Switch between "Agent" and "Human" per conversation
  - Toggle calls API to update `conversations.mode` in Supabase
  - Visual indicator: green badge = Agent mode, orange badge = Human mode
- **Message input (bottom)**: Text input + send button, visible in BOTH modes
  - In Human mode: human types reply, sends via Meta WhatsApp API, stores in DB with role "assistant"
  - In Agent mode: input still available so human can override/send manual messages if needed
- Real-time updates via Supabase Realtime subscriptions (new messages appear instantly)

#### API Routes for Frontend
- `GET /api/conversations` — list all conversations with last message
- `GET /api/conversations/[id]/messages` — get messages for a conversation
- `PATCH /api/conversations/[id]` — update mode (agent/human)
- `POST /api/conversations/[id]/send` — send a manual message from dashboard (calls Meta API + stores in DB)

### Step 7: Deployment & Webhook Setup
- Deploy to Vercel (or use ngrok for local testing)
- Set the production webhook URL in Meta App > WhatsApp > Configuration
- Verify webhook with the chosen verify token
- Subscribe to "messages" event

## Key Considerations
- Always return 200 to Meta webhook quickly (within 5 seconds) to avoid retries
- Handle duplicate messages (Meta may retry) using `whatsappMsgId`
- Store conversation history for AI context (send last N messages)
- Escape special characters in AI responses before sending to WhatsApp
- The permanent access token from Meta System Users never expires
