# History Sync Visualizer
### Universal Timeline, Heatmap & Activity Insights from Git Logs, Chats, and Activity Files

## 📌 Overview
History Sync Visualizer transforms raw chronological data into interactive heatmaps, timelines, and streak maps.  
It aggregates logs from:

- Git commit logs
- WhatsApp/Slack chat exports
- Activity files (CSV/JSON)

The goal is to help developers, students, and knowledge workers discover patterns in productivity, study habits, or communication behavior.

## 📊 Key Features

### Data Ingestion
- Git log parser (`git log --pretty`)
- WhatsApp TXT or Slack JSON parser
- Duplicate removal & metadata extraction
- Auto-tagging using keyword heuristics

### Analytics Dashboard
- Heatmap (Hours × Days)
- Timeline with zoom & pan
- Activity streak visualization
- Tag-cloud for selected ranges
- Event-level drill-down

### Search, Filter & Export
- Filter by sources, tags, actors
- Full-text search on content
- Export CSV & PDF insights

### Engineering Quality
- Modular ingestion adapters
- Normalized event schema
- Pre-aggregated time-series buckets
- Background workers for heavy tasks

## 🖼 Demo Screenshots
(Add when ready)

<!-- (Screenshots to be added) -->
<!-- 
/assets/heatmap.png
/assets/timeline.png
/assets/streaks.png
/assets/details-pane.png
-->

## 🚀 Live Demo
Frontend: https://your-demo.vercel.app  
Backend API: https://your-api.example.com

## 🧩 Architecture
```
                   ┌──────────────────────────┐
                   │        Raw Data           │
                   │  Git | WhatsApp | Slack   │
                   └─────────────┬────────────┘
                                 │
                                 ▼
                      ┌───────────────────┐
                      │     Ingestors     │
                      │ (Git / Chat / CSV)│
                      └──────────┬────────┘
                                 │
                                 ▼
                     ┌────────────────────┐
                     │ Normalizer &       │
                     │ Event Enrichment   │
                     └──────────┬─────────┘
                                │
                                ▼
             ┌─────────────────────────────────────────┐
             │                MongoDB                  │
             │       (Mongoose Schemas: Events)        │
             └───────────┬──────────────┬──────────────┘
                         │              │
                         ▼              ▼
                ┌─────────────┐   ┌─────────────┐
                │   API Layer │   │  Background  │
                │(Queries,Auth│   │   Worker     │
                └──────┬──────┘   └──────┬──────┘
                       │                │
                       └────────┬───────┘
                                ▼
                     ┌──────────────────────┐
                     │  React + D3/Visx UI  │
                     │ Heatmaps | Timeline  │
                     └──────────────────────┘
```

## 📦 Tech Stack
| Area | Technologies |
|------|--------------|
| Frontend | React, Next.js/Vite, D3.js / visx, TailwindCSS |
| Backend | Node.js (Express) or Python (FastAPI) |
| Database | MongoDB (Mongoose), Redis (optional) |
| Workers | BullMQ (Node) or Celery (Python) |
| Exports | Puppeteer/Playwright for PDF |
| Deployment | Vercel, Render, Railway, Supabase |

## 📁 Event Model
```json
{
  "id": "uuid",
  "timestamp": "2024-01-20T14:10:42Z",
  "source": "git | whatsapp | slack | activity",
  "actor": "username or phone number",
  "type": "code.commit | chat.message | activity.event",
  "tags": ["bugfix", "feature"],
  "content_snippet": "Fixed login issue",
  "metadata": {
    "loc_added": 12,
    "loc_removed": 3
  }
}
```

## 📡 API Endpoints

### Ingestion
```
POST /ingest/git
POST /ingest/chat
GET  /ingest/status/:id
```

### Query
```
GET /events?start=&end=&source=&tags=
GET /aggregates?start=&end=&resolution=hour|day
GET /events/:eventId
```

### Export
```
GET  /export/csv
POST /export/pdf
```

## 📂 Project Structure
root
│
├── components/     # React UI components (Charts, Widgets, Modals)
├── lib/            # Shared logic, parsers, and helpers
├── models/         # Mongoose database schemas
├── pages/          # Next.js Pages Router
│   ├── api/        # Backend API endpoints
│   └── ...         # Frontend routes
├── public/         # Static assets
└── styles/         # Global styles & Tailwind config

## 📥 Installation & Setup

### Clone the repo
```
git clone https://github.com/yourname/history-sync-visualizer
cd history-sync-visualizer
```

### Backend setup
```
cd backend
npm install
npm run dev
```

### Frontend setup
```
cd frontend
npm install
npm start
```

### Environment Variables
Create `.env`:

```
MONGODB_URI=mongodb+srv://...
# REDIS_URL=redis://...
JWT_SECRET=supersecret
GEMINI_API_KEY=... (Client-side or Server-side proxy)
```

## 🎯 Usage Guide

### Upload Data
- Git repository (.zip)
- WhatsApp/Slack chat export
- Activity logs (CSV)

### Explore
- Heatmap: find activity bursts
- Timeline: zoom/pan across weeks
- Streaks: analyze consistency
- Tag cloud: summarize themes

### Drill Down
Click any cell or timeline point to see detailed events.

### Export
Download PDF or CSV summaries.

## 🗺 Roadmap
| Phase | Features |
|-------|----------|
| MVP | Git + WhatsApp ingestion, heatmap, timeline, CSV export |
| Phase 2 | Streaks, tag cloud, PDF reports, full-text search |
| Phase 3 | Discord, Telegram, Gmail adapters + anomaly detection |
| Phase 4 | Sharing dashboards + team mode |

## 🤝 Contributing
Pull requests are welcome.

## 📄 License
MIT License.

## 🙏 Acknowledgements
- D3.js / visx visualization libraries  
- Mongoose for elegant MongoDB modeling  
- Public Git & WhatsApp export samples  
