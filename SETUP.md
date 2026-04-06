# WhatsApp AI Agent Setup Guide

This application replaces n8n with a custom Next.js app to handle WhatsApp messages, AI responses, and a real-time dashboard.

## 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of `supabase_schema.sql`.
3. Go to **Project Settings > API** and get your:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key (for backend)

## 2. Meta WhatsApp API Setup
1. Create a Meta App at [developers.facebook.com](https://developers.facebook.com).
2. Add **WhatsApp** to your app.
3. In **WhatsApp > Getting Started**, get your:
   - `Phone Number ID`
   - `Temporary Access Token` (get a permanent one via System Users later)
4. In **WhatsApp > Configuration**:
   - Set **Callback URL**: `https://your-domain.com/api/webhook` (or use ngrok for local)
   - Set **Verify Token**: Any string (must match `WHATSAPP_VERIFY_TOKEN` in `.env`)
   - Subscribe to **messages** in Webhook fields.

## 3. AI Setup (OpenRouter)
1. Get an API key from [OpenRouter](https://openrouter.ai).
2. Choose a model (e.g., `openai/gpt-3.5-turbo`).

## 4. Environment Variables
Create a `.env.local` file based on `.env.example` and fill in the values.

```bash
cp .env.example .env.local
```

## 5. Running Locally
```bash
npm install
npm run dev
```

## How it works
- **Agent Mode**: AI automatically responds to incoming WhatsApp messages.
- **Human Mode**: AI is disabled for that conversation; you can reply manually from the dashboard.
- **Real-time**: The dashboard updates instantly when new messages arrive via Supabase Realtime.
