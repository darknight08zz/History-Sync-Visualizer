import type { NextApiRequest, NextApiResponse } from "next";
import { getJob } from "../../../lib/queue";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing job id" });
    }

    const job = getJob(id);
    if (!job) {
        return res.status(404).json({ error: "Job not found" });
    }

    res.status(200).json(job);
}
