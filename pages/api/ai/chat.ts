
import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "../../../lib/mongodb";
import Event from "../../../models/Event";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).end();
    }

    const { messages, contextFilter, apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: "API Key is required" });
    }

    try {
        await dbConnect();

        // 1. Fetch Context (Optimized RAG)
        // Instead of feeding ALL events, we respect the current filters if provided, 
        // or default to recent N events.
        const limit = 500;
        const query: any = {};

        if (contextFilter) {
            // Apply simple filters if passed from UI
            if (contextFilter.source && contextFilter.source !== "All Sources") query.source = contextFilter.source;
            if (contextFilter.actor && contextFilter.actor !== "All Actors") query.actor = contextFilter.actor;
            // Date range...
        }

        const events = await Event.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .select("timestamp source type content_snippet analysis") // Select analysis too!
            .lean();

        // 2. Format Context
        const contextString = events.map((e: any) => {
            let s = `[${new Date(e.timestamp).toISOString().slice(0, 16)}] ${e.source} (${e.type}): ${e.content_snippet.slice(0, 200)}`;
            if (e.analysis?.impact_label) {
                s += ` [Impact: ${e.analysis.impact_label}]`;
            }
            return s;
        }).join("\n");

        // 3. Construct System Prompt
        const systemPrompt = `
        You are an intelligent Productivity Assistant for the "History Sync Visualizer".
        You have access to the user's recent activity logs (Git commits, chats, etc.).

        Your goal is to answer questions about their work habits, progress, and stress levels based on this data.
        
        Context Data (${events.length} recent events):
        ---
        ${contextString}
        ---

        Rules:
        - Be helpful, professional, and concise.
        - Cite specific dates or events when possible.
        - If the answer isn't in the data, say "I don't see that in the recent logs."
        - If asked about "Impact", refer to the [Impact: ...] tags in the data.
        `;

        // 4. Call Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\n(System Context Set. Awaiting user question.)" }]
                },
                {
                    role: "model",
                    parts: [{ text: "Ready to analyze your history." }]
                },
                // Append previous chat history if needed, but for now we trust the client sends just the new message
                // or we can reconstruct history here. For simplicity, we restart context each turn 
                // but usually you want to maintain history. 
                // Let's assume 'messages' contains only the new user query, or we just append it.
                // For a multi-turn feel, we'd map "messages" to history.
            ]
        });

        // Map client history to Gemini history if provided
        // implementation simplification: Just take the last message for now or simple 1-turn RAG.
        // But to support "messages" array:
        // (Skipping full history reconstruction for this MVP step to keep token usage predictable)

        const lastUserMessage = messages[messages.length - 1].content;

        const result = await chat.sendMessage(lastUserMessage);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });

    } catch (e: any) {
        console.error("Chat API Error:", e);
        res.status(500).json({ error: e.message || "Chat failed" });
    }
}
