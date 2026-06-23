# Daily AI Puzzle

A Next.js 14-style daily AI puzzle app powered by DeepSeek and Vercel KV.

## Features

- Daily puzzle homepage with frosted-glass UI and dark gradient background
- `/api/daily` route generates a fresh puzzle and stores it in Vercel KV
- `/api/answer` route validates user answers
- Client-side feedback with motion-friendly state changes

## Environment Variables

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
KV_REST_API_URL=your_vercel_kv_rest_url
KV_REST_API_TOKEN=your_vercel_kv_rest_token
KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_only_token
```

## Run Locally

```bash
npm install
npm run dev
```

## API

### GET `/api/daily`
Generates or returns today's puzzle.

### POST `/api/answer`
Body:

```json
{
  "answerIndex": 1,
  "date": "2026-06-23"
}
```

Response includes whether the answer is correct and the correct option text.
