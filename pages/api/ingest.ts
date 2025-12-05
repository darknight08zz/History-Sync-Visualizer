import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { parseGitLogText, parseWhatsAppText, parseTelegramJson, parseSlackJson, parseDiscordJson, parseIcsText } from "../../lib/parsers";
import { EventItem } from "../../lib/mockData";
import dbConnect from "../../lib/mongodb";
import Event from "../../models/Event";

export const config = {
    api: {
        bodyParser: false, // required for formidable
    },
};

// ... Parser helpers (omitted for brevity, keep existing parseUploadedFile) ...
// (We will reuse the chunk view to restore the parseUploadedFile function exactly, 
//  but since I am replacing the whole file I need to Include it. 
//  Actually, I should use multi_replace to only replace the imports and the handler Logic, 
//  keeping parseUploadedFile intact.)

// Helper to parse file based on content (Copied from previous state for safety if replacing whole file, 
// but I will try to target specific blocks to be safer and smaller).

// WAIT. replace_file_content replaces a RANGE. 
// I will just replace the imports and the Handler logic.

// ... 


// Helper to parse file based on content
async function parseUploadedFile(file: File): Promise<{ events: EventItem[]; info: any }> {
    const buffer = fs.readFileSync(file.filepath);

    // Simple charset detection
    let text = "";
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        text = buffer.toString("utf16le");
    } else {
        text = buffer.toString("utf8");
    }

    // 1. JSON Detection
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
            const json = JSON.parse(text);

            if (json.messages && Array.isArray(json.messages) && json.name) {
                return { events: parseTelegramJson(text), info: { detected: "telegram" } };
            }
            if (Array.isArray(json) && json.length > 0 && json[0].ts && json[0].user) {
                return { events: parseSlackJson(text), info: { detected: "slack" } };
            }
            const list = Array.isArray(json) ? json : (json.messages || []);
            if (list.length > 0 && list[0].timestamp && list[0].author) {
                return { events: parseDiscordJson(text), info: { detected: "discord" } };
            }
        } catch (e) { }
    }

    // 2. ICS Detection
    if (text.includes("BEGIN:VCALENDAR")) {
        return { events: parseIcsText(text), info: { detected: "calendar" } };
    }

    // 3. Text Logic
    const linesSample = text.split(/\r?\n/).slice(0, 20).join("\n");
    const looksLikeWhatsApp = /-\s+[^:]+:\s+/.test(linesSample) && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(linesSample);
    const looksLikeGitLog = /\b[0-9a-f]{7,40}\b/.test(linesSample) || linesSample.includes("|");

    if (looksLikeWhatsApp) {
        return { events: parseWhatsAppText(text), info: { detected: "whatsapp" } };
    } else if (looksLikeGitLog) {
        return { events: parseGitLogText(text), info: { detected: "git" } };
    } else {
        const gitE = parseGitLogText(text);
        if (gitE.length > 0) return { events: gitE, info: { detected: "git_fallback" } };
        const waE = parseWhatsAppText(text);
        if (waE.length > 0) return { events: waE, info: { detected: "whatsapp_fallback" } };

        return {
            events: [{
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                source: "unknown",
                actor: "uploader",
                type: "raw",
                tags: [],
                content_snippet: text.slice(0, 1000),
            }],
            info: { detected: "raw" },
        };
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).end();
    }

    const form = formidable({ multiples: false, keepExtensions: true, maxFileSize: 50 * 1024 * 1024 });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("formidable error", err);
            return res.status(500).json({ error: "Failed to parse upload" });
        }

        const uploaded = (Array.isArray(files.file) ? files.file[0] : files.file) as File | undefined;
        if (!uploaded) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            const { events, info } = await parseUploadedFile(uploaded);

            // PERSISTENCE: Insert into MongoDB
            if (events.length > 0) {
                await dbConnect();

                // Prepare docs (ensure ID and types)
                const docs = events.map(e => ({
                    id: e.id || uuidv4(),
                    timestamp: new Date(e.timestamp),
                    source: e.source || "unknown",
                    actor: e.actor || "unknown",
                    type: e.type || "unknown",
                    tags: e.tags || [], // Mongoose handles array
                    content_snippet: e.content_snippet || ""
                }));

                // insertMany with ordered: false to skip duplicates (if ID exists)
                // Note: Mongoose throws on duplicate if unique index exists. 
                // ordered: false continues inserting others.
                try {
                    await Event.insertMany(docs, { ordered: false });
                } catch (e: any) {
                    // Ignore duplicate key errors (code 11000)
                    if (e.code !== 11000 && !e.result) {
                        throw e; // Real error
                    }
                    // If some inserted, that's fine.
                }
            }

            res.status(200).json({
                message: "File ingested successfully",
                count: events.length,
                detectedType: info.detected
            });

        } catch (e: any) {
            console.error(e);
            res.status(500).json({ error: e.message || "Ingestion failed" });
        }
    });
}
