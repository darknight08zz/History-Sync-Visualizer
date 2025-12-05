
import React, { useState } from "react";
import { EventItem } from "../lib/mockData";

interface AIInsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: EventItem[];
}

export default function AIInsightsModal({ isOpen, onClose, events }: AIInsightsModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!apiKey) {
            setError("Please enter a valid Gemini API Key");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ events, apiKey }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Failed to generate analysis");
            }

            setAnalysis(json.analysis);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                            <span className="text-white text-xl">✨</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Productivity Insights</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Powered by Gemini Pro</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {!analysis ? (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-indigo-800 dark:text-indigo-200 text-sm">
                                <p>This feature sends your <strong>recent event summary</strong> (counts by source/day) to Google Gemini to analyze your work habits.</p>
                                <p className="mt-2 text-xs opacity-75">Note: Raw message content is NOT sent, only metadata and timestamps.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Google Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your API Key"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    Get one for free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">aistudio.google.com</a>
                                </p>
                            </div>

                            {error && (
                                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={loading || !apiKey}
                                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all
                                    ${loading || !apiKey
                                        ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                                    }`}
                            >
                                {loading ? "Analyzing..." : "Generate Insights"}
                            </button>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                {analysis}
                            </div>
                        </div>
                    )}
                </div>

                {analysis && (
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end">
                        <button onClick={() => setAnalysis(null)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mr-4">
                            Analyze Again
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium text-sm">
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
