
import React, { useMemo } from "react";
import { EventItem } from "../lib/mockData";

export default function DashboardStats({ events }: { events: EventItem[] }) {

    // 1. Hourly Activity
    const hourlyData = useMemo(() => {
        const counts = new Array(24).fill(0);
        events.forEach(e => {
            const h = new Date(e.timestamp).getHours();
            if (h >= 0 && h < 24) counts[h]++;
        });
        return counts;
    }, [events]);

    const maxHourly = Math.max(...hourlyData, 1);

    // 2. Source Distribution
    const sourceData = useMemo(() => {
        const counts: Record<string, number> = {};
        events.forEach(e => {
            const s = e.source || "unknown";
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]); // Descending
    }, [events]);

    const totalEvents = events.length;

    // Helper for donut chart segments
    const donutSegments = useMemo(() => {
        if (totalEvents === 0) return { background: "#f1f5f9", legend: [] };

        let currentAngle = 0;
        const colors = [
            "#4f46e5", // indigo-600
            "#0ea5e9", // sky-500
            "#10b981", // emerald-500
            "#f59e0b", // amber-500
            "#ef4444", // red-500
            "#8b5cf6", // violet-500
            "#64748b", // slate-500
        ];

        const segments = sourceData.map(([source, count], i) => {
            const percentage = count / totalEvents;
            const degrees = percentage * 360;
            const color = colors[i % colors.length];
            const start = currentAngle;
            currentAngle += degrees;
            return { source, count, percentage, color, start, end: currentAngle };
        });

        // CSS conic-gradient
        const gradient = segments.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(", ");
        return { background: `conic-gradient(${gradient})`, legend: segments };

    }, [sourceData, totalEvents]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Hourly Activity */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">Productive Hours</h3>
                <div className="flex items-end justify-between h-40 gap-1">
                    {hourlyData.map((count, h) => (
                        <div key={h} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            <div
                                className="w-full bg-indigo-100 rounded-t hover:bg-indigo-300 transition-colors"
                                style={{ height: `${Math.max((count / maxHourly) * 100, 4)}%` }}
                            ></div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {count} events at {h}:00
                            </div>
                            {/* Axis Label */}
                            {h % 3 === 0 && (
                                <span className="text-[10px] text-slate-400 mt-1 absolute -bottom-5">{h}</span>
                            )}
                        </div>
                    ))}
                </div>
                {/* X-axis spacer */}
                <div className="h-6"></div>
            </div>

            {/* Source Distribution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">Activity by Source</h3>
                <div className="flex items-center gap-8">
                    {/* Donut Chart */}
                    <div className="relative w-32 h-32 rounded-full shrink-0" style={{ background: donutSegments.background }}>
                        <div className="absolute inset-0 m-auto w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <div className="text-center">
                                <span className="block text-xl font-bold text-slate-800 dark:text-slate-200">{totalEvents}</span>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Events</span>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {donutSegments.legend.map((s) => (
                            <div key={s.source} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></span>
                                    <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{s.source.replace("-", " ")}</span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-400">{Math.round(s.percentage * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">Top Contributors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {useMemo(() => {
                        const actorCounts: Record<string, number> = {};
                        events.forEach(e => {
                            const a = e.actor || "unknown";
                            actorCounts[a] = (actorCounts[a] || 0) + 1;
                        });
                        return Object.entries(actorCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 6);
                    }, [events]).map(([actor, count], i) => (
                        <div key={actor} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs mr-3">
                                {i + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{actor}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{count} contributions</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
