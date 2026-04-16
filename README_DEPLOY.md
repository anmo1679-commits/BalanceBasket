# Deployment Guide for BalanceBasket

This guide will help you deploy **BalanceBasket** to the web for free.

## 1. Backend (FastAPI) on [Render](https://render.com)
1.  **Create a Web Service** and connect your GitHub repo.
2.  **Environment:** Python
3.  **Build Command:** `pip install -r requirements.txt` (or if using uv: `uv sync`)
4.  **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables:**
    *   `DATABASE_URL`: (Optional) Connect a Supabase or Render PostgreSQL URL. If left empty, it will use a local `app.db` (but this will reset every time you deploy).
    *   `AI_BASE_URL`: Get this from [Groq](https://groq.com) or [OpenAI](https://openai.com).
    *   `AI_API_KEY`: Your API key.
    *   `AI_MODEL`: e.g., `llama-3.3-70b-versatile` (for Groq) or `gpt-4o-mini` (for OpenAI).
    *   `CORS_ORIGINS`: Set this to your frontend URL (e.g., `https://balancebasket.vercel.app`).

## 2. Frontend (React/Vite) on [Vercel](https://vercel.com)
1.  **Import your project** and select the `frontend` directory.
2.  **Framework Preset:** Vite
3.  **Environment Variables:**
    *   `VITE_API_URL`: Set this to your **Render** backend URL (e.g., `https://balancebasket-api.onrender.com`).

## 3. Database on [Supabase](https://supabase.com)
1.  Create a project on Supabase.
2.  Copy the **Connection String** (Transaction mode).
3.  Paste it into Render's `DATABASE_URL` environment variable.

---

### Local Development vs. Production
*   **Local:** Uses your local Mac's **Ollama** and **SQLite**.
*   **Production:** Uses **Groq/OpenAI** and **PostgreSQL**.
