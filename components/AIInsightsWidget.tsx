import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EventItem } from "../lib/mockData";

interface AIInsightsWidgetProps {
    events: EventItem[];
}

export default function AIInsightsWidget({ events }: AIInsightsWidgetProps) {
    const [apiKey, setApiKey] = useState("");
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    // Persist API Key
    useEffect(() => {
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleSaveKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem("gemini_api_key", key);
    };

    const handleGenerate = async () => {
        if (!apiKey) {
            setError("Please enter a valid Gemini API Key");
            return;
        }

        setLoading(true);
        setError(null);

        const tryFetch = async (attempt = 1): Promise<void> => {
            try {
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ events, apiKey }),
                });

                if (res.status === 429) {
                    if (attempt > 3) throw new Error("API Quota exceeded. Please try again later.");
                    const delay = attempt * 2000; // 2s, 4s, 6s...
                    setError(`Quota limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                    return tryFetch(attempt + 1);
                }

                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed to generate analysis");

                setAnalysis(json.analysis);
                setIsExpanded(true);
                setError(null);
            } catch (e: any) {
                const isRateLimit = e.message?.includes("429") || e.message?.includes("Quota") || e.message?.includes("Too Many Requests");

                if (isRateLimit && attempt <= 3) {
                    const delay = attempt * 2000;
                    setError(`Quota limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                    return tryFetch(attempt + 1);
                }

                setError(e.message);
            }
        };

        try {
            await tryFetch();
        } finally {
            setLoading(false);
        }
    };

    if (!isExpanded && analysis) {
        return (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => setIsExpanded(true)}>
                <div className="flex items-center gap-2 font-bold">
                    <span>✨ AI Insights Ready</span>
                </div>
                <p className="text-xs text-indigo-100 mt-1">Click to view analysis</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h3 className="font-bold text-slate-800 dark:text-white">AI Insights</h3>
                </div>
                {analysis && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        {isExpanded ? "−" : "+"}
                    </button>
                )}
            </div>

            <div className={`p-4 ${loading ? 'animate-pulse' : ''}`}>
                {!analysis ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Generate a live productivity summary directly from your activity logs.
                        </p>

                        {!apiKey && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">API Key Required</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => handleSaveKey(e.target.value)}
                                    placeholder="Paste Gemini API Key..."
                                    className="w-full text-sm px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="text-[10px] text-slate-400 text-right">
                                    Stored locally in browser.
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className={`w-full py-2 px-4 rounded-lg font-bold text-white text-sm transition-all
                                ${loading
                                    ? "bg-slate-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:from-indigo-600 hover:to-purple-700"
                                }`}
                        >
                            {loading ? "Thinking..." : "Generate Analysis"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-headings:mb-3 prose-headings:mt-6 prose-p:my-2 prose-li:my-2 prose-strong:font-bold prose-strong:text-slate-900 dark:prose-strong:text-white">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {analysis || ""}
                            </ReactMarkdown>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleGenerate}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.31-.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H12.487a.75.75 0 000 1.5h4.242a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                </svg>
                                Regenerate Analysis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
