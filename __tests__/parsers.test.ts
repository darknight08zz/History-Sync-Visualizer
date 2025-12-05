import { parseGitLogText, parseWhatsAppText } from "../lib/parsers";

jest.mock("uuid", () => ({
    v4: () => "test-uuid",
}));

describe("Parsers", () => {
    describe("parseGitLogText", () => {
        it("should parse pipe-separated git log", () => {
            const input = "abc1234|Alice|2023-10-01T10:00:00Z|Fix bug";
            const events = parseGitLogText(input);
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                source: "git",
                actor: "Alice",
                timestamp: "2023-10-01T10:00:00.000Z",
                content_snippet: "Fix bug",
                tags: ["bugfix"],
            });
        });

        it("should parse default git log format", () => {
            const input = "commit abc1234 | Bob | 2023-10-02T11:00:00Z | New feature";
            const events = parseGitLogText(input);
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                source: "git",
                actor: "Bob",
                tags: ["feature"],
            });
        });
    });

    describe("parseWhatsAppText", () => {
        it("should parse WhatsApp export format", () => {
            const input = "12/05/2023, 21:03 - Alice: Hello world";
            const events = parseWhatsAppText(input);
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                source: "whatsapp",
                actor: "Alice",
                content_snippet: "Hello world",
            });
        });

        it("should handle multi-line messages", () => {
            const input = "12/05/2023, 21:03 - Alice: Line 1\nLine 2";
            const events = parseWhatsAppText(input);
            expect(events).toHaveLength(1);
            expect(events[0].content_snippet).toContain("Line 1");
            expect(events[0].content_snippet).toContain("Line 2");
        });
    });
});
