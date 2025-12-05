import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../lib/mongodb";
import Event from "../../models/Event";
import { EventItem } from "../../lib/mockData";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const days = parseInt(req.query.days as string || "30", 10);

    // Calculate cutoff date
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    // Convert to Date object for Mongo query

    try {
        await dbConnect();

        // FIND events from DB using Index
        const docs = await Event.find({
            timestamp: { $gte: cutoff }
        }).sort({ timestamp: -1 }).lean();

        // Map DB docs to EventItem
        const events: EventItem[] = docs.map((r: any) => ({
            id: r.id,
            timestamp: r.timestamp.toISOString(),
            source: r.source,
            actor: r.actor,
            type: r.type,
            tags: r.tags || [], // Native array in Mongo
            content_snippet: r.content_snippet
        }));

        // Compute Matrix on-the-fly
        // Dimensions: [days][24 hours]
        const matrix: number[][] = Array.from({ length: days }, () => Array(24).fill(0));
        const nowTime = new Date(now.toDateString()).getTime();

        events.forEach(e => {
            const t = new Date(e.timestamp);
            // Calculate day difference from "today" (bucket 0 is today, 1 is yesterday...)
            const dayDelta = Math.floor((nowTime - new Date(t.toDateString()).getTime()) / (1000 * 60 * 60 * 24));

            // Only count if within range and not future/invalid
            if (dayDelta >= 0 && dayDelta < days) {
                const hour = t.getHours();
                matrix[dayDelta][hour] += 1;
            }
        });

        // Get Actors stats
        const actorsMap: Record<string, number> = {};
        events.forEach(e => {
            const a = e.actor || "unknown";
            actorsMap[a] = (actorsMap[a] || 0) + 1;
        });
        const actors = Object.entries(actorsMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        res.status(200).json({ matrix, events, actors });
    } catch (e: any) {
        console.error("Aggregates API Error:", e);
        res.status(500).json({ error: e.message });
    }
}
