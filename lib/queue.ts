import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job {
    id: string;
    status: JobStatus;
    result?: any;
    error?: string;
    createdAt: number;
}

const JOBS_FILE = path.join(process.cwd(), "jobs.json");

function loadJobs(): Record<string, Job> {
    try {
        if (!fs.existsSync(JOBS_FILE)) return {};
        const data = fs.readFileSync(JOBS_FILE, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

function saveJobs(jobs: Record<string, Job>) {
    try {
        fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
    } catch (e) {
        console.error("Failed to save jobs", e);
    }
}

export function createJob(): Job {
    const jobs = loadJobs();
    const id = uuidv4();
    const job: Job = {
        id,
        status: "pending",
        createdAt: Date.now(),
    };
    jobs[id] = job;
    saveJobs(jobs);
    return job;
}

export function getJob(id: string): Job | undefined {
    const jobs = loadJobs();
    return jobs[id];
}

export function updateJob(id: string, updates: Partial<Job>) {
    const jobs = loadJobs();
    if (jobs[id]) {
        Object.assign(jobs[id], updates);
        saveJobs(jobs);
    }
}
