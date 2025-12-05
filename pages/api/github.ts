
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "../../lib/mongodb";
import EventModel from "../../models/Event";
import { EventItem } from "../../lib/mockData";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).end();
    }

    const { username, token } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const headers: HeadersInit = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "History-Sync-Visualizer"
        };
        if (token) {
            headers["Authorization"] = `token ${token}`;
        }

        const ghRes = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, { headers });

        if (!ghRes.ok) {
            const err = await ghRes.text();
            throw new Error(`GitHub API error: ${ghRes.status} ${err}`);
        }

        const ghEvents = await ghRes.json();

        if (!Array.isArray(ghEvents)) {
            throw new Error("Invalid response from GitHub API");
        }

        const mappedEvents: EventItem[] = ghEvents.map((e: any) => {
            let type = "code.other";
            let tags: string[] = [];
            let snippet = "";

            // Map simplified event types
            switch (e.type) {
                case "PushEvent":
                    type = "code.commit";
                    const commits = e.payload.commits || [];
                    const msg = commits.length > 0 ? commits[0].message : "Pushed code";
                    snippet = `Pushed ${commits.length} commits to ${e.repo.name}: ${msg}`;
                    if (/fix|bug/i.test(snippet)) tags.push("bugfix");
                    else tags.push("feature");
                    break;
                case "PullRequestEvent":
                    type = "code.pr";
                    snippet = `${e.payload.action} PR in ${e.repo.name}: ${e.payload.pull_request.title}`;
                    break;
                case "IssuesEvent":
                    type = "code.issue";
                    snippet = `${e.payload.action} issue in ${e.repo.name}: ${e.payload.issue.title}`;
                    break;
                case "CreateEvent":
                    type = "code.create";
                    snippet = `Created ${e.payload.ref_type} in ${e.repo.name}`;
                    break;
                default:
                    snippet = `${e.type} in ${e.repo.name}`;
            }

            return {
                id: uuidv4(),
                timestamp: e.created_at, // ISO string
                source: "github-api",
                actor: e.actor.login,
                type,
                tags,
                content_snippet: snippet.slice(0, 300)
            };
        });

        // Save to MongoDB
        await dbConnect();

        const docs = mappedEvents.map(e => ({
            id: e.id,
            timestamp: new Date(e.timestamp),
            source: e.source,
            actor: e.actor,
            type: e.type,
            tags: e.tags,
            content_snippet: e.content_snippet
        }));

        try {
            await EventModel.insertMany(docs, { ordered: false });
        } catch (e: any) {
            if (e.code !== 11000 && !e.result) throw e;
        }

        res.status(200).json({ success: true, count: mappedEvents.length, events: mappedEvents });
    } catch (e: any) {
        console.error("GitHub sync error:", e);
        res.status(500).json({ error: e.message || "Failed to sync with GitHub" });
    }
}
