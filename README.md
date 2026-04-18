# Indian Stock News Aggregator

Search NSE-listed Indian stocks and get the latest news — powered by Finnhub & NewsAPI.

## Stack

| Layer    | Tech                        |
|----------|-----------------------------|
| Frontend | React 18 + Vite + Tailwind  |
| Backend  | Node.js + Express           |
| APIs     | Finnhub + NewsAPI (free)    |
| Hosting  | Vercel (FE) + Railway (BE)  |

## Quick Start (Local)

### 1. Get API keys (free)
- Finnhub: https://finnhub.io/register
- NewsAPI: https://newsapi.org

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys
npm install
npm run dev   # → http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # → http://localhost:5173
```

The frontend Vite dev server proxies `/api` to `localhost:3001` automatically.

### Test

- Health: http://localhost:3001/health
- News: http://localhost:3001/api/stock-news?symbol=TCS
- List: http://localhost:3001/api/stocks/list

---

## Deploy

### Backend → Railway.app

1. Push code to GitHub
2. New project → Deploy from GitHub repo
3. Set env vars: `FINNHUB_API_KEY`, `NEWSAPI_API_KEY`, `NODE_ENV=production`
4. Railway auto-deploys — copy the URL (e.g. `https://xxx.up.railway.app`)

### Frontend → Vercel

1. Import repo on vercel.com
2. Framework: **Vite**
3. Root directory: `frontend`
4. Add env var: `VITE_API_URL=https://xxx.up.railway.app`
5. Deploy — done

---

## Supported Stocks

TCS, INFY, RELIANCE, HDFCBANK, ICICIBANK, AXISBANK, BAJAJFINSV, MARUTI, SBIN,
WIPRO, HCLTECH, TECHM, LT, ITC, SUNPHARMA, DMART, NESTLEIND, ADANIPORTS,
BHARTIARTL, JSWSTEEL

---

## API Endpoints

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/health`                     | Health check             |
| GET    | `/api/stock-news?symbol=TCS`  | News + stock info        |
| GET    | `/api/stocks/list`            | All supported stocks     |
