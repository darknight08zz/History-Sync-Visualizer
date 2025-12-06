import { createHash } from "crypto";
import { EventItem } from "./mockData";

// Helper to generate deterministic ID based on content
function generateEventId(source: string, timestamp: string, actor: string, content: string): string {
    const data = `${source}|${timestamp}|${actor}|${content}`;
    return createHash("sha256").update(data).digest("hex");
}

export function parseGitLogText(text: string): EventItem[] {
    // Expect lines like: <hash>|<author>|<iso-timestamp>|<message>
    // or attempt to heuristically parse common formats.
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const events: EventItem[] = [];
    for (const line of lines) {
        // basic pipe-separated parser (safe fallback)
        if (line.includes("|")) {
            const parts = line.split("|").map(p => p.trim());
            const [hash, author, iso, ...rest] = parts;
            const message = rest.join("|") || "";
            const d = new Date(iso);
            if (!isNaN(d.getTime())) {
                events.push({
                    id: hash || generateEventId("git", d.toISOString(), author || "unknown", message), // Use git hash if available
                    timestamp: d.toISOString(),
                    source: "git",
                    actor: author || "unknown",
                    type: "code.commit",
                    tags: /fix|bug|bugfix|hotfix/i.test(message) ? ["bugfix"] : ["feature"],
                    content_snippet: message.slice(0, 200),
                });
                continue;
            }
        }

        // fallback: try a regex for `commit <hash>` lines with author and date
        const simpleMatch = line.match(/([0-9a-f]{7,40})\s+\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.*)/i);
        if (simpleMatch) {
            const [_all, hash, author, iso, msg] = simpleMatch;
            const d = new Date(iso);
            if (!isNaN(d.getTime())) {
                events.push({
                    id: hash || generateEventId("git", d.toISOString(), author || "unknown", msg),
                    timestamp: d.toISOString(),
                    source: "git",
                    actor: author || "unknown",
                    type: "code.commit",
                    tags: /fix|bug/i.test(msg) ? ["bugfix"] : ["feature"],
                    content_snippet: msg.slice(0, 200),
                });
                continue;
            }
        }

        // As last fallback, create an event with unknown timestamp (skip if no date)
    }
    return events;
}

export function parseWhatsAppText(text: string): EventItem[] {
    // WhatsApp exported .txt lines usually look like:
    // "12/05/2024, 21:03 - Alice: Message text..."
    // or "5/12/2024, 9:03 PM - Name: message"
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const events: EventItem[] = [];
    const waRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s?[APMapm]{2})?)\s+-\s+([^:]+):\s+(.*)$/;

    for (const line of lines) {
        const m = line.match(waRegex);
        if (m) {
            let [_, datePart, timePart, sender, message] = m;
            // Try to parse the date/time into ISO
            let dt = new Date(`${datePart} ${timePart}`);
            if (isNaN(dt.getTime())) {
                // Try swapping day/month in case locale difference
                const [d, mo, y] = datePart.split("/");
                const swapped = `${mo}/${d}/${y} ${timePart}`;
                dt = new Date(swapped);
            }
            if (!isNaN(dt.getTime())) {
                const cleanSender = sender.trim();
                const cleanMsg = message.slice(0, 300);
                events.push({
                    id: generateEventId("whatsapp", dt.toISOString(), cleanSender, cleanMsg),
                    timestamp: dt.toISOString(),
                    source: "whatsapp",
                    actor: cleanSender,
                    type: "chat.message",
                    tags: /study|session|exam|revision|homework/i.test(message) ? ["study"] : [],
                    content_snippet: cleanMsg,
                });
                continue;
            }
        }
        // Could be a continuation line (multi-line message) — naive append to previous event
        if (events.length > 0) {
            events[events.length - 1].content_snippet += " " + line.slice(0, 200);
            // Re-hash ID if content changes? ideally yes, but simplistic append makes it hard.
            // For now, let's accept that multiline might not change hash, or we re-hash.
            // Actually, we can't easily re-hash without rebuilding. 
            // Better to rely on the first line for uniqueness or accept small issue.
        }
    }


    return events;
}

export function parseSlackJson(text: string): EventItem[] {
    // Slack export is usually an array of message objects
    let data_json: any;
    try {
        data_json = JSON.parse(text);
    } catch (e) {
        return [];
    }

    // If it's a list of messages (typical for channel export)
    if (!Array.isArray(data_json)) return [];

    const events: EventItem[] = [];
    for (const msg of data_json) {
        if (!msg.ts || !msg.user) continue; // Basic validation

        // Slack ts is "1234567890.123456"
        const tsMillis = parseFloat(msg.ts) * 1000;
        const dt = new Date(tsMillis);
        const actor = msg.user_profile?.real_name || msg.user || "unknown";
        const content = (msg.text || "").slice(0, 300);

        events.push({
            id: generateEventId("slack", dt.toISOString(), actor, content),
            timestamp: dt.toISOString(),
            source: "slack",
            actor: actor, // user is ID, need profile for name usually, but fallback ok
            type: "chat.message",
            tags: [],
            content_snippet: content
        });
    }
    return events;
}

export function parseDiscordJson(text: string): EventItem[] {
    // DiscordChatExporter format: array of { author: { name: .. }, timestamp: .., content: .. }
    let data_json: any;
    try {
        data_json = JSON.parse(text);
    } catch (e) {
        return [];
    }

    const messages = Array.isArray(data_json) ? data_json : (data_json.messages || []);
    if (!Array.isArray(messages)) return [];

    const events: EventItem[] = [];
    for (const msg of messages) {
        // Check for common fields
        const dateStr = msg.timestamp || msg.date;
        const content = (msg.content || "").slice(0, 300);
        const authorName = msg.author?.name || msg.author?.username || msg.author || "unknown";

        if (!dateStr) continue;

        const dt = new Date(dateStr);
        if (isNaN(dt.getTime())) continue;

        events.push({
            id: generateEventId("discord", dt.toISOString(), authorName, content),
            timestamp: dt.toISOString(),
            source: "discord",
            actor: authorName,
            type: "chat.message",
            tags: [],
            content_snippet: content
        });
    }
    return events;
}

export function parseTelegramJson(text: string): EventItem[] {
    // Telegram Desktop Export "result.json": { name: "Chat", messages: [ ... ] }
    let data_json: any;
    try {
        data_json = JSON.parse(text);
    } catch (e) {
        return [];
    }

    const messages = data_json.messages || [];
    if (!Array.isArray(messages)) return [];

    const events: EventItem[] = [];
    for (const msg of messages) {
        if (msg.type !== "message" || !msg.date || !msg.text) continue;

        // msg.text can be a string or array of entities. Flatten it.
        const contentRaw = Array.isArray(msg.text)
            ? msg.text.map((t: any) => typeof t === 'string' ? t : t.text).join("")
            : msg.text;

        const content = (contentRaw || "").slice(0, 300);

        const dt = new Date(msg.date);
        if (isNaN(dt.getTime())) continue;

        const actor = msg.from || "unknown";

        events.push({
            id: generateEventId("telegram", dt.toISOString(), actor, content),
            timestamp: dt.toISOString(),
            source: "telegram",
            actor: actor,
            type: "chat.message",
            tags: [],
            content_snippet: content
        });
    }
    return events;
}

export function parseIcsText(text: string): EventItem[] {
    // Simple regex-based ICS parser for VEVENTs
    // Matches BEGIN:VEVENT ... END:VEVENT
    const events: EventItem[] = [];
    const eventBlocks = text.split(/BEGIN:VEVENT/i).slice(1); // skip header

    for (const block of eventBlocks) {
        // Extract fields
        // DTSTART can be DTSTART:2023... or DTSTART;VALUE=DATE:2023...
        const dtStartMatch = block.match(/DTSTART(?:;[^:]*)?:(\S+)/i);
        const summaryMatch = block.match(/SUMMARY:(.*)/i);
        const descriptionMatch = block.match(/DESCRIPTION:(.*)/i);

        if (!dtStartMatch) continue;

        let dateStr = dtStartMatch[1].trim();
        let dt: Date;

        // Parse ICS date formats: YYYYMMDD or YYYYMMDDTHHMMSSZ
        if (dateStr.length === 8) {
            // value=date, e.g. 20230501
            const y = dateStr.slice(0, 4);
            const m = dateStr.slice(4, 6);
            const d = dateStr.slice(6, 8);
            dt = new Date(`${y}-${m}-${d}T00:00:00Z`);
        } else {
            // value=date-time, e.g. 20230501T120000Z
            // basic cleanup
            dateStr = dateStr.replace("T", "").replace("Z", "");
            if (dateStr.length >= 14) {
                const y = dateStr.slice(0, 4);
                const m = dateStr.slice(4, 6);
                const d = dateStr.slice(6, 8);
                const h = dateStr.slice(8, 10);
                const min = dateStr.slice(10, 12);
                const s = dateStr.slice(12, 14);
                dt = new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));
            } else {
                dt = new Date(); // fallback
            }
        }

        if (isNaN(dt.getTime())) continue;

        const summary = summaryMatch ? summaryMatch[1].trim() : "Untitled Event";
        const description = descriptionMatch ? descriptionMatch[1].trim() : "";
        const content = `${summary} - ${description}`.slice(0, 300);

        events.push({
            id: generateEventId("calendar", dt.toISOString(), "me", content),
            timestamp: dt.toISOString(),
            source: "calendar",
            actor: "me", // Calendar is usually personal
            type: "calendar.event",
            tags: ["meeting"],
            content_snippet: content
        });
    }
    return events;
}
