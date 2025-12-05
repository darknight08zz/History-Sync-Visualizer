// lib/mockData.ts
export type EventItem = {
    id: string;
    timestamp: string; // ISO
    source: "git" | "whatsapp" | "slack" | "discord" | "telegram" | "github-api" | "calendar" | "activity" | "unknown";
    actor: string;
    type: string;
    tags: string[];
    content_snippet: string;
};


