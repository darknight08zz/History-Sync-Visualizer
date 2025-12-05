import React from "react";
import { EventItem } from "../lib/mockData";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    events: EventItem[];
}

export default function EventModal({ isOpen, onClose, title, events }: EventModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {events.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No events found for this slot.</p>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${event.source === 'git' ? 'bg-orange-100 text-orange-700' :
                                                event.source === 'whatsapp' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {event.source}
                                        </span>
                                        <span className="text-xs font-medium text-slate-900">{event.actor}</span>
                                        <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
                                    {event.content_snippet}
                                </p>
                                {event.tags && event.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {event.tags.map(tag => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
