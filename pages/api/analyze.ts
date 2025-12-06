
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

        // Limit to last 500 events to avoid token limits if list is huge
        const recentEvents = events
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 500);

        recentEvents.forEach(e => {
            const date = e.timestamp.slice(0, 10);
            const source = e.source || "unknown";
            sources.add(source);

            if (!summaryObj[date]) summaryObj[date] = {};
            summaryObj[date][source] = (summaryObj[date][source] || 0) + 1;
        });

        // Construct prompt
        const prompt = `
        You are a productivity analyst. Analyze the following work log summary for a user.
        The log contains counts of events (commits, messages, meetings) grouped by date and source.

        Sources encountered: ${Array.from(sources).join(", ")}

        Daily Activity:
        ${JSON.stringify(summaryObj, null, 2)}

        Analyze this productivity data (daily event counts by source) and provide a professional, encouraging, and actionable report.
        
        Format the response in cleanly structured Markdown. Use short bullet points and avoid long paragraphs.
        
        ### **📊 Executive Summary**
        **[5-6 bullet points. Very concise overview.]**
        
        
        
        ### **📈 Key Trends**
        - **Peak Performance**: [Day/Time]
        - **Work-Life Balance**: [1 sentence observation]
        - **Focus**: [Code vs Chat]
        - **Consistency**: [Daily/Weekly patterns]
        - **Collaboration**: [Interaction with others based on communication events]
        - **Deep Work Periods**: [Observations on sustained activity in specific sources]




        ### **📈 Key Trends**
        - **Peak Performance**: [Day/Time]
        - **Work-Life Balance**: [1 sentence observation]
        - **Focus**: [Code vs Chat]
        - **Consistency**: [Daily/Weekly patterns]
        - **Collaboration**: [Interaction with others based on communication events]
        - **Deep Work Periods**: [Observations on sustained activity in specific sources]



        ### **📊 Key Insights**
        - [Insight 1]
        - [Insight 2]
        - [Insight 3]
        - [Insight 4]
        - [Insight 5]
        - [Insight 6]
        

        
        ### **💡 Recommendations**
        - [Actionable Tip 1]
        - [Actionable Tip 2]
        - [Actionable Tip 3]
        - [Actionable Tip 4]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ analysis: text });

    } catch (e: any) {
        console.error("Gemini API Error:", e);

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
