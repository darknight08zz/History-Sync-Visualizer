
import React from "react";
import { Dialog } from "@headlessui/react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <Dialog.Title className="text-xl font-bold text-slate-900 dark:text-white">
                            What is History Sync Visualizer?
                        </Dialog.Title>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            ✕
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">🚀 Universal Activity Timeline</h3>
                            <p>
                                This tool visualizes your productivity and communication history from multiple sources in one unified interface.
                                It helps you track work patterns, find burnout risks, and generate reports.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📂 Supported Imports</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Git Logs</strong>: Run <code>git log --pretty=format:"%H|%aI|%s|%an" &gt; gitlog.txt</code></li>
                                    <li>
                                        <strong>WhatsApp</strong>: Open Chat &gt; Three Dots &gt; More &gt; Export Chat &gt; Without Media. Upload the <code>.txt</code> file.
                                    </li>
                                    <li>
                                        <strong>Telegram</strong>: Desktop App &gt; Settings &gt; Advanced &gt; Export Telegram Data &gt; Check "Machine-readable JSON" &gt; Export. Upload <code>result.json</code>.
                                    </li>
                                    <li>
                                        <strong>Slack</strong>: Workspace Settings &gt; Import/Export &gt; Export Data. Upload the channel <code>.json</code> file.
                                    </li>
                                    <li>
                                        <strong>Discord</strong>: Use <a href="https://github.com/Tyrrrz/DiscordChatExporter" target="_blank" rel="noreferrer" className="text-indigo-600 underline">DiscordChatExporter</a> to get a JSON dump.
                                    </li>
                                    <li><strong>Google Calendar</strong>: Settings &gt; Import & Export &gt; Export. Upload the <code>.ics</code> file.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">⚡ Features</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>GitHub Sync</strong>: Connect directly to fetch public commits/PRs.</li>
                                    <li><strong>AI Insights</strong>: Get a productivity analysis powered by Gemini 2.0.</li>
                                    <li><strong>PDF Export</strong>: Generate clean, printable reports.</li>
                                    <li><strong>Team Analysis</strong>: Filter by Actor to see individual contributions.</li>
                                </ul>
                            </section>
                        </div>

                        <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">🔒 Privacy First</h3>
                            <p className="text-blue-800 dark:text-blue-200 text-xs">
                                All data processing happens locally or on your own server.
                                Files are parsed and stored in your private MongoDB instance.
                                No data is sent to third parties (except anon snippets to Gemini if you use AI features).
                            </p>
                        </section>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
