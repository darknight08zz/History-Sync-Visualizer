import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Set-Cookie", "auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
    res.redirect("/login");
}
