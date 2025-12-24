<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Ud3_2NQl-XCxN6I1bakSqGruFQSG8QzM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Skonfiguruj backend:
   - Ustaw `OPENAI_API_KEY` w swoim środowisku (np. `.env` dla backendu).
   - Uruchom API: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`
3. Uruchom frontend:
   - (opcjonalnie) ustaw `VITE_API_BASE_URL=http://localhost:8001` w `.env.local`
   - `npm run dev`
