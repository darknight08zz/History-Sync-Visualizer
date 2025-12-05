
// components/Timeline.tsx
import React, { useState } from "react";

function formatDateDaysAgo(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

export default function Timeline({ matrix }: { matrix: number[][] }) {
    const totals = matrix.map((r) => r.reduce((a, b) => a + b, 0));
    const max = Math.max(...totals, 1);

    // Zoom state: 1x to 5x
    const [zoom, setZoom] = useState(1);

    return (
        <div className="flex flex-col gap-2">
            {/* Zoom Control */}
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Zoom:</span>
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-24 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span>{zoom}x</span>
            </div>

            {/* Scrollable Container (Pan) */}
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div
                    className="flex items-end space-x-1 h-48 pt-12 transition-all duration-300 ease-out"
                    style={{ minWidth: "100%", width: `${100 * zoom}%` }}
                >
                    {totals.map((v, i) => (
                        <div key={i} className="flex-1 group relative h-full flex flex-col justify-end items-center">
                            {/* Bar */}
                            <div
                                className="w-full mx-px rounded-t bg-gradient-to-t from-indigo-600 to-blue-400 transition-all duration-300 group-hover:from-indigo-500 group-hover:to-blue-300"
                                style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
                            />

                            {/* Label (Day of Month) */}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 select-none">
                                {new Date(new Date().setDate(new Date().getDate() - i)).getDate()}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                <div className="bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                    {v} events<br />
                                    <span className="text-slate-400">{formatDateDaysAgo(i)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
