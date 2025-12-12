
import { parseGitLogText, parseWhatsAppText } from "../lib/parsers";

describe("Extra Parser Tests", () => {
    describe("Git Log Parser Edge Cases", () => {
        it("should return empty array for empty input", () => {
            expect(parseGitLogText("")).toEqual([]);
        });

        it("should ignore malformed lines that do not match patterns", () => {
            const input = `
            valid|author|2023-01-01T00:00:00Z|message
            garbage line without pipes
            another bad line
            `;
            const result = parseGitLogText(input);
            expect(result).toHaveLength(1);
            expect(result[0].content_snippet).toBe("message");
        });

        it("should fallback to regex if pipes are missing but looks like git log", () => {
            const input = "a1b2c3d | author | 2023-01-01T12:00:00Z | regex message";
            const result = parseGitLogText(input);
            expect(result).toHaveLength(1);
            expect(result[0].content_snippet).toBe("regex message");
        });
    });

    describe("WhatsApp Parser Edge Cases", () => {
        it("should handle date formats with am/pm", () => {
            const input = "12/25/23, 10:30 PM - Mom: Dinner time";
            const result = parseWhatsAppText(input);
            expect(result).toHaveLength(1);
            const date = new Date(result[0].timestamp);
            expect(date.getHours()).toBe(22); // 10 PM
        });

        it("should gracefully skip lines with invalid dates", () => {
            const input = "99/99/2023, 10:00 - User: Invalid date";
            const result = parseWhatsAppText(input);
            expect(result).toHaveLength(0);
        });

        it("should concatenate multiline messages", () => {
            const input = `
12/01/2023, 09:00 - Alice: Line 1
Line 2 of previous message
12/01/2023, 09:01 - Bob: Reply
            `;
            const result = parseWhatsAppText(input);
            expect(result).toHaveLength(2);
            expect(result[0].content_snippet).toContain("Line 1");
            expect(result[0].content_snippet).toContain("Line 2");
            expect(result[1].actor).toBe("Bob");
        });
    });
});
