import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { days, source, tag, actor } = req.query;

    // Construct target URL with all filters
    const params = new URLSearchParams();
    if (days) params.set("days", String(days));
    if (source) params.set("source", String(source));
    if (tag) params.set("tag", String(tag));
    if (actor) params.set("actor", String(actor));

    // Local tool, skipping auth check for ease of export
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host || "localhost:3000";
        const url = `${protocol}://${host}/?${params.toString()}`;

        console.log("Generating PDF for:", url); // Debug log

        // 1080p viewport for better layout
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url, { waitUntil: "networkidle0" });


        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=report-${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdfBuffer);
    } catch (e: any) {
        console.error("PDF Generation Error", e);
        res.status(500).json({ error: "Failed to generate PDF", details: e.message });
    }
}
