import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
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
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300 from-translate-x-full"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300 from-translate-x-0"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-xl">
                                        {/* Header */}
                                        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
                                                        <span className="text-white text-xl">✨</span>
                                                    </div>
                                                    <div>
                                                        <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">
                                                            AI Productivity Insights
                                                        </Dialog.Title>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Powered by Gemini Pro</p>
                                                    </div>
                                                </div>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-transparent text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                        onClick={onClose}
                                                    >
                                                        <span className="sr-only">Close panel</span>
                                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="relative flex-1 px-6 py-6 overflow-y-auto custom-scrollbar">
                                            {!analysis ? (
                                                <div className="space-y-6">
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-indigo-800 dark:text-indigo-200 text-sm border border-indigo-100 dark:border-indigo-800/50">
                                                        <p>Get a personalized summary of your work habits, peak hours, and burnout risks based on your activity data.</p>
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
                                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                                        />
                                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                                            Get one for free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">aistudio.google.com</a>
                                                        </p>
                                                    </div>

                                                    {error && (
                                                        <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                                            {error}
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={handleGenerate}
                                                        disabled={loading || !apiKey}
                                                        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all
                                                            ${loading || !apiKey
                                                                ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed"
                                                                : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-98"
                                                            }`}
                                                    >
                                                        {loading ? "Analyzing..." : "Generate Insights"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="prose dark:prose-invert prose-indigo max-w-none">
                                                    <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                                        {analysis}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        {analysis && (
                                            <div className="flex flex-shrink-0 justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                                <button
                                                    type="button"
                                                    className="rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                    onClick={() => setAnalysis(null)}
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                    onClick={onClose}
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
