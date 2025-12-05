import fs from "fs";
import path from "path";
import { EventItem } from "./mockData";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read events
export function getEvents(): EventItem[] {
    if (!fs.existsSync(EVENTS_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(EVENTS_FILE, "utf-8");
        return JSON.parse(data) as EventItem[];
    } catch (e) {
        console.error("Failed to read events file", e);
        return [];
    }
}

// Helper to save events (append new ones)
export function saveEvents(newEvents: EventItem[]) {
    const current = getEvents();
    // Simple dedup by ID if needed, but for now just append
    const all = [...current, ...newEvents];
    try {
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(all, null, 2), "utf-8");
    } catch (e) {
        console.error("Failed to write events file", e);
    }
}

// Helper to get events filtered by days
export function getEventsLastNDays(days: number): EventItem[] {
    const events = getEvents();
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return events.filter(e => new Date(e.timestamp) >= cutoff);
}
