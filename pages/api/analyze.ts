
import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EventItem } from "../../lib/mockData";

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

    const { events, apiKey } = req.body as { events: EventItem[]; apiKey: string };

    if (!apiKey) {
        return res.status(400).json({ error: "API Key is required" });
    }

    if (!events || events.length === 0) {
        return res.status(400).json({ error: "No events to analyze" });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use the model version confirmed by the user's API key capabilities
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Summarize events closely to save context window
        // Group by day and source
        const summaryObj: Record<string, Record<string, number>> = {};
        const sources = new Set<string>();

        // Limit to last 30 days to ensure we fit in context window and stay relevant
        const recentEvents = events
            .filter(e => new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        recentEvents.forEach(e => {
            const date = e.timestamp.slice(0, 10);
            const source = e.source || "unknown";
            sources.add(source);

            if (!summaryObj[date]) summaryObj[date] = {};
            summaryObj[date][source] = (summaryObj[date][source] || 0) + 1;
        });

        // Construct prompt
        const prompt = `
        Role: Productivity Analyst. 
        Task: Analyze this user's work log (daily event counts by source) and provide a professional, encouraging report.
        
        Sources: ${Array.from(sources).join(", ")}

        Daily Activity Summary (JSON):
        ${JSON.stringify(summaryObj, null, 2)}

        Output: A concise Markdown report with:
        
        ### **📊 Executive Summary**
        (3-4 bullet points)
        
        ### **📈 Key Trends**
        - **Peak Performance**
        - **Work-Life Balance**
        - **Focus**
        - **Consistency**
        
        ### **💡 Recommendations**
        (Top 3 actionable tips)
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ analysis: text });

    } catch (e: any) {
        console.error("Gemini API Error:", e);

        // Propagate 429 status for client-side handling
        if (e.message?.includes("429") || e.status === 429 || e.message?.includes("Quota")) {
            return res.status(429).json({ error: "Too Many Requests", details: e.message });
        }

        // Debug: List available models if 404
        if (e.message.includes("404") || e.message.includes("not found")) {
            console.log("Attempting to list available models...");
            // Note: This needs a separate try/catch as it might also fail if key is invalid
            try {
                // @ts-ignore
                const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`).then(r => r.json());
                console.log("Available Models:", JSON.stringify(models, null, 2));
            } catch (listErr) {
                console.error("Failed to list models:", listErr);
            }
        }

        res.status(500).json({ error: e.message || "Failed to generate analysis" });
    }
}
