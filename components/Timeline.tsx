
// components/Timeline.tsx
import React, { useState, useMemo } from "react";
import { EventItem } from "../lib/mockData";

function formatDateDaysAgo(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

interface TimelineProps {
    matrix: number[][];
    events?: EventItem[];
}

export default function Timeline({ matrix, events = [] }: TimelineProps) {
    const totals = matrix.map((r) => r.reduce((a, b) => a + b, 0));
    const max = Math.max(...totals, 1);

    // Zoom state: 1x to 5x
    const [zoom, setZoom] = useState(1);

    // Calculate daily average impact
    const dailyImpacts = useMemo(() => {
        const impacts = new Array(matrix.length).fill(0);
        const counts = new Array(matrix.length).fill(0);
        const now = new Date();
        const nowTime = new Date(now.toDateString()).getTime();

        events.forEach(e => {
            if (e.analysis?.impact_score) {
                const t = new Date(e.timestamp);
                const dayDelta = Math.floor((nowTime - new Date(t.toDateString()).getTime()) / (1000 * 60 * 60 * 24));
                if (dayDelta >= 0 && dayDelta < matrix.length) {
                    impacts[dayDelta] += e.analysis.impact_score;
                    counts[dayDelta] += 1;
                }
            }
        });

        return impacts.map((total, i) => counts[i] > 0 ? total / counts[i] : 0);
    }, [events, matrix.length]);

    const getBarColor = (val: number, impact: number) => {
        if (impact === 0) return "bg-gradient-to-t from-indigo-300 to-indigo-100 dark:from-indigo-900 dark:to-indigo-700"; // No analysis
        if (impact >= 7) return "bg-gradient-to-t from-amber-500 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"; // High impact (Gold)
        if (impact >= 4) return "bg-gradient-to-t from-indigo-600 to-blue-400"; // Medium
        return "bg-gradient-to-t from-slate-500 to-slate-400"; // Low
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Zoom Control */}
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>High Impact</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Normal</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span>Low Impact</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
            </div>

            {/* Scrollable Container (Pan) */}
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div
                    className="flex items-end space-x-1 h-48 pt-12 transition-all duration-300 ease-out"
                    style={{ minWidth: "100%", width: `${100 * zoom}%` }}
                >
                    {totals.map((v, i) => {
                        const impact = dailyImpacts[i];
                        return (
                            <div key={i} className="flex-1 group relative h-full flex flex-col justify-end items-center">
                                {/* Bar */}
                                <div
                                    className={`w-full mx-px rounded-t transition-all duration-300 ${getBarColor(v, impact)}`}
                                    style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
                                />

                                {/* Label (Day of Month) */}
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 select-none">
                                    {new Date(new Date().setDate(new Date().getDate() - i)).getDate()}
                                </span>

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                    <div className="bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                        <div className="font-bold">{v} events</div>
                                        <div className="text-slate-400">{formatDateDaysAgo(i)}</div>
                                        {impact > 0 && (
                                            <div className="text-amber-400 mt-1 text-[10px] border-t border-slate-700 pt-1">
                                                Avg Impact: {impact.toFixed(1)}/10
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
