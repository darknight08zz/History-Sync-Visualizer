
import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "../../../lib/mongodb";
import Event from "../../../models/Event";
import { EventItem } from "../../../lib/mockData";

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

    const { eventIds, apiKey } = req.body as { eventIds: string[]; apiKey: string };

    if (!apiKey) {
        return res.status(400).json({ error: "API Key is required" });
    }

    if (!eventIds || eventIds.length === 0) {
        return res.status(400).json({ error: "No event IDs provided" });
    }

    try {
        await dbConnect();

        // 1. Fetch events
        const events = await Event.find({ id: { $in: eventIds } }).lean();
        if (events.length === 0) {
            return res.status(404).json({ error: "No matching events found" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // 2. Prepare payload for AI
        // Limit context to relevant string fields
        const eventsForPrompt = events.map((e: any) => ({
            id: e.id,
            source: e.source,
            type: e.type,
            content: (e.content_snippet || "").slice(0, 300) // Truncate for token efficiency
        }));

        const prompt = `
        You are a Senior Engineering Manager and Productivity Expert.
        Analyze the "impact" and "quality" of the following work events (commits, messages, logs).
        
        For EACH event, provide:
        1. Impact Score (1-10): 1=Trivial/Noise, 5=Routine, 10=Critical/Game-changing.
        2. Impact Label: "Low", "Medium", "High".
        3. Sentiment: "Positive", "Neutral", "Negative".
        4. Summary: Super concise 1-sentence summary (max 10 words).

        JSON Output Schema (Array of objects):
        [
          { 
            "id": "event_uuid", 
            "analysis": { 
              "impact_score": 8, 
              "impact_label": "High", 
              "sentiment": "Neutral", 
              "summary": "Refactored core login logic" 
            } 
          }
        ]

        Events:
        ${JSON.stringify(eventsForPrompt)}
        `;

        // 3. Generate
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const analysisResults = JSON.parse(responseText);

        // 4. Update DB (Bulk Write)
        if (Array.isArray(analysisResults)) {
            const operations = analysisResults.map((item: any) => ({
                updateOne: {
                    filter: { id: item.id },
                    update: { $set: { analysis: item.analysis } }
                }
            }));

            if (operations.length > 0) {
                await Event.bulkWrite(operations);
            }
        }

        res.status(200).json({ message: "Enrichment complete", count: analysisResults.length });

    } catch (e: any) {
        console.error("Enrichment Error:", e);
        res.status(500).json({ error: e.message || "Failed to enrich events" });
    }
}
