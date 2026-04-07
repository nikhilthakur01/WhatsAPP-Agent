# 🤖 WhatsApp AI Chatbot

🚀 Built for automation, lead generation & real-time customer support

![Next.js](https://img.shields.io/badge/Next.js-13-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![WhatsApp API](https://img.shields.io/badge/WhatsApp-Cloud_API-25D366?logo=whatsapp)
![AI](https://img.shields.io/badge/AI-OpenRouter-blue)

---

## 🚀 About Project

A full-stack AI-powered WhatsApp chatbot with real-time dashboard and automation.

---

## 🔥 Features

* 💬 Real-time WhatsApp chat integration
* 🤖 AI auto replies (Agent Mode)
* 👨 Human takeover mode
* 📊 Live dashboard for conversations
* 🔗 Webhook integration with Meta API

---

## 🛠️ Tech Stack

* ⚡ Next.js (Frontend + Backend API)
* 🗄️ Supabase (Database)
* 📲 WhatsApp Cloud API
* 🧠 OpenRouter (AI Models)

---

## 🔥 Use Cases

* Real estate lead generation
* Customer support automation
* WhatsApp marketing
* AI sales assistant

---

## 📸 Screenshots

![Dashboard](./dashboard.png)

---

## ⚙️ Setup Instructions

### 1. Clone repo

```bash
git clone https://github.com/nikhilthakur01/WhatsAPP-Agent.git
cd WhatsAPP-Agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=

OPENROUTER_API_KEY=
```

### 4. Run project

```bash
npm run dev
```

---

## 🌐 Webhook Setup

```bash
ngrok http 3000
```

Webhook URL:

```
https://your-ngrok-url/api/webhook
```

---

## 🧪 Testing

* Add tester number in Meta Dashboard
* Send message from WhatsApp
* Check dashboard

---

## 👨‍💻 Author

**Nikhil Kumar**
