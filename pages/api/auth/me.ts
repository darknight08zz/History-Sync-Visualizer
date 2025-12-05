
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_dev_secret_please_change";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const token = req.cookies["auth-token"];

    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).json({ user: decoded });
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
