/**
 * @jest-environment node
 */
import { createMocks } from "node-mocks-http";
import ingestHandler from "../pages/api/ingest";
import aggregatesHandler from "../pages/api/aggregates";
import { saveEvents } from "../lib/store";

jest.mock("uuid", () => ({
    v4: () => "test-uuid",
}));

// Mock store to avoid writing to disk during tests
jest.mock("../lib/store", () => ({
    saveEvents: jest.fn(),
    getEvents: jest.fn(() => []),
    getEventsLastNDays: jest.fn(() => []),
}));

// Mock queue to avoid background processing issues
jest.mock("../lib/queue", () => ({
    createJob: jest.fn(() => ({ id: "test-job-id", status: "pending" })),
    updateJob: jest.fn(),
    getJob: jest.fn(),
}));

describe("API Integration", () => {
    describe("/api/ingest", () => {
        it("should return 405 for non-POST requests", async () => {
            const { req, res } = createMocks({
                method: "GET",
            });

            await ingestHandler(req, res);

            expect(res._getStatusCode()).toBe(405);
        });

        // Note: Testing file upload with node-mocks-http and formidable is tricky
        // because formidable reads from the raw request stream.
        // We might skip the full upload test here and rely on unit tests for parsers.
    });

    describe("/api/aggregates", () => {
        it("should return aggregates matrix", async () => {
            const { req, res } = createMocks({
                method: "GET",
                query: { days: "30" },
            });

            await aggregatesHandler(req, res);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data).toHaveProperty("matrix");
            expect(data.matrix).toHaveLength(30);
        });
    });
});
