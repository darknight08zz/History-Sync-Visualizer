
// components/UploadPanel.tsx
import React, { useState } from "react";
import { EventItem } from "../lib/mockData";

interface UploadPanelProps {
    onUploadComplete?: (events: EventItem[]) => void;
    onConnectGithub: () => void;
    onClearData?: () => void;
}

export default function UploadPanel({ onUploadComplete, onConnectGithub, onClearData }: UploadPanelProps) {
    const [drag, setDrag] = useState(false);

    const handleFile = (file: File | null) => {
        if (!file || !onUploadComplete) return;

        // Parent component's handleUploadRefresh expects a full event push
        // But here we need to call the upload API first
        // Refactoring: The parent passed a refresh function, but we need to do the upload here or call a prop that does upload.
        // Actually, in the previous index.tsx, we had a 'handleUpload' passed as 'onUpload'.
        // Let's restore that pattern or adapt.
        // The new index.tsx passes onUploadComplete={handleUploadRefresh}.
        // But handleUploadRefresh expects EventItem[].
        // So we need to perform the upload HERE inside the component or accept an onUpload prop.

        // Fix: Let's do the upload here to keep it self-contained or revert to passing onUpload.
        // Since index.tsx has complex poll logic, it's better if index.tsx handles the upload logic.
        // Let's check index.tsx... it seems I removed handleUpload prop and only passed onUploadComplete.
        // This is a disconnect. I need to restore the onUpload prop functionality or move logic here.

        // Simpler: Let's assume the parent passes a prop "onUpload" like before. 
        // Wait, looking at the restored index.tsx, it DOES NOT pass onUpload. 
        // It passes `onUploadComplete`. This means I need to implement the upload logic HERE.

        uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/ingest", { method: "POST", body: fd });
            if (!res.ok) throw new Error("Upload failed");

            const json = await res.json();
            // If async job
            if (json.id) {
                pollJob(json.id);
            } else if (json.events) {
                onUploadComplete?.(json.events);
            }
        } catch (e) {
            console.error(e);
            alert("Upload failed");
        }
    };

    const pollJob = async (jobId: string) => {
        const check = async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`);
                const job = await res.json();
                if (job.status === "completed") {
                    onUploadComplete?.(job.result.events);
                } else if (job.status === "failed") {
                    alert("Processing failed: " + job.error);
                } else {
                    setTimeout(check, 1000);
                }
            } catch (e) { console.error(e); }
        };
        check();
    }


    return (
        <div className="flex flex-col gap-4">
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    const f = e.dataTransfer?.files?.[0] ?? null;
                    handleFile(f);
                }}
                className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-all duration-200 ease-in-out
                ${drag
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                    }`}
            >
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className={`w-8 h-8 mb-3 ${drag ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500 dark:text-slate-500"}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-1 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">ZIP archive or Chat Export (TXT)</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                </label>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">Supported: WhatsApp, Git Log, Telegram JSON, Slack JSON</span>

                <div className="flex gap-2">
                    <button
                        onClick={onConnectGithub}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.79 24 17.31 24 12c0-6.63-5.37-12-12-12z" /></svg>
                        GitHub Sync
                    </button>

                    {onClearData && (
                        <button
                            onClick={onClearData}
                            className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 text-xs font-medium rounded-md hover:bg-red-100 transition-colors"
                            title="Clear all data"
                        >
                            <span>🗑️ Clear</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
