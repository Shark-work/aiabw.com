# Daily AI Puzzle

A Next.js 14 daily AI puzzle app powered by DeepSeek and Supabase.

## Features

- Daily puzzle homepage with frosted-glass UI and dark gradient background
- `/api/daily` route returns today's published puzzle from Supabase
- `/api/cron/generate` route generates a draft puzzle and stores it in `daily_quests`
- `/api/answer` route validates user answers
- Admin pages for topic management, weekly scheduling, and publishing today's draft

## Environment Variables

```bash
DATABASE_URL=your_supabase_postgres_connection_string
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
ADMIN_EMAIL=your_admin_email
NEXT_PUBLIC_SITE_URL=https://aiabw.com
```

## Run Locally

```bash
npm install
npm run dev
```

## API

### GET `/api/daily`
Returns today's published puzzle, or a friendly waiting message if none is published yet.

### POST `/api/cron/generate`
Generates today's draft puzzle based on the weekly schedule.

### PUT `/api/admin/quests/publish`
Publishes today's draft puzzle.

### POST `/api/answer`
Body:

```json
{
  "answerIndex": 1,
  "date": "2026-06-23"
}
```

Response includes whether the answer is correct and the correct option text.
