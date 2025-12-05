import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../lib/mongodb";
import Event from "../../models/Event";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).end();
    }

    try {
        await dbConnect();
        await Event.deleteMany({});
        res.status(200).json({ message: "Database cleared (MongoDB)" });
    } catch (e: any) {
        console.error("Clear API Error:", e);
        res.status(500).json({ error: e.message });
    }
}
