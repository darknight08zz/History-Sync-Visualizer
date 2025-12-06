import React, { useMemo } from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { EventItem } from "../lib/mockData";

interface HeatmapProps {
    matrix: number[][];
    events?: EventItem[];
    onCellClick?: (dayIdx: number, hour: number) => void;
    theme?: "light" | "dark";
}

// Helper to get top tags for a cell
const getCellDetails = (events: EventItem[], dayIdx: number, hour: number) => {
    if (!events.length) return { tags: [], count: 0 };

    const now = new Date();
    const nowTime = new Date(now.toDateString()).getTime();

    const cellEvents = events.filter(e => {
        const t = new Date(e.timestamp);
        const dayDelta = Math.floor((nowTime - new Date(t.toDateString()).getTime()) / (1000 * 60 * 60 * 24));
        return dayDelta === dayIdx && t.getHours() === hour;
    });

    if (cellEvents.length === 0) return { tags: [], count: 0 };

    const tagCounts: Record<string, number> = {};
    cellEvents.forEach(e => {
        e.tags?.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
    });

    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t);

    return { tags: topTags, count: cellEvents.length };
};

function formatDateDaysAgo(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

export default function Heatmap({ matrix, events = [], onCellClick, theme = "light" }: HeatmapProps) {
    const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } = useTooltip<{ title: string }>();
    const { containerRef, TooltipInPortal } = useTooltipInPortal({
        scroll: true,
    });

    const days = matrix.length;
    const hours = 24;

    // Dimensions
    const cellWidth = 18;
    const cellHeight = 18;
    const gap = 2;
    const margin = { top: 20, left: 90, right: 10, bottom: 10 };

    const width = margin.left + (cellWidth + gap) * hours + margin.right;
    const height = margin.top + (cellHeight + gap) * days + margin.bottom;

    const max = Math.max(...matrix.flat(), 1);

    // Color scale
    const colorScale = scaleLinear<string>({
        domain: [0, max],
        range: theme === "dark" ? ["#334155", "#22c55e"] : ["#f1f5f9", "#4f46e5"], // slate-700 to green-500 (dark) vs slate-100 to indigo-600 (light)
    });

    const xScale = useMemo(() => scaleLinear({
        domain: [0, 24],
        range: [0, 24 * (cellWidth + gap)]
    }), [cellWidth, gap]);

    const yScale = useMemo(() => scaleLinear({
        domain: [0, days],
        range: [0, days * (cellHeight + gap)]
    }), [days, cellHeight, gap]);

    // Transform matrix for Visx
    const data = useMemo(() => {
        return matrix.map((row, dayIdx) => ({
            bin: dayIdx,
            bins: row.map((count, hour) => ({
                bin: hour,
                count: count,
                dayIdx: dayIdx,
                hour: hour
            }))
        }));
    }, [matrix]);

    return (
        <div className="overflow-x-auto pb-2 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div style={{ minWidth: width, maxHeight: "800px", overflowY: "auto" }} className="custom-scrollbar">
                <svg width={width} height={height} ref={containerRef}>
                    <Group top={margin.top} left={margin.left}>
                        {/* X Axis Labels */}
                        {Array.from({ length: 24 }, (_, h) => (
                            <text
                                key={h}
                                x={h * (cellWidth + gap) + cellWidth / 2}
                                y={-6}
                                textAnchor="middle"
                                fontSize={10}
                                fill={theme === "dark" ? "#94a3b8" : "#94a3b8"}
                            >
                                {h}
                            </text>
                        ))}

                        {/* Y Axis Labels - Conditionally render to avoid clutter on large ranges */}
                        {matrix.map((_, dayIdx) => {
                            // If more than 60 days, show only mondays (or every 7th day)
                            if (matrix.length > 60 && dayIdx % 7 !== 0) return null;

                            return (
                                <text
                                    key={dayIdx}
                                    x={-10}
                                    y={dayIdx * (cellHeight + gap) + cellHeight / 2}
                                    dy=".32em"
                                    textAnchor="end"
                                    fontSize={10}
                                    fill={theme === "dark" ? "#cbd5e1" : "#64748b"}
                                    fontFamily="monospace"
                                >
                                    {formatDateDaysAgo(dayIdx)}
                                </text>
                            );
                        })}

                        {/* Grid of Rectangles */}
                        {matrix.map((row, dayIdx) =>
                            row.map((count, hour) => {
                                const x = hour * (cellWidth + gap);
                                const y = dayIdx * (cellHeight + gap);
                                // Opacity: 0 count = 1 (opaque base), positive = scaled
                                const opacity = count === 0 ? 1 : Math.max(0.4, count / max);

                                // Get details for tooltip
                                const tooltipTitle = () => {
                                    const { tags, count: c } = getCellDetails(events, dayIdx, hour);
                                    return c > 0
                                        ? `${c} events${tags.length ? `\nTop tags: ${tags.join(", ")}` : ""}`
                                        : `${count} events at ${hour}:00`;
                                };

                                return (
                                    <rect
                                        key={`cell-${dayIdx}-${hour}`}
                                        width={cellWidth}
                                        height={cellHeight}
                                        x={x}
                                        y={y}
                                        fill={colorScale(count)}
                                        rx={2}
                                        style={{ opacity, cursor: count > 0 ? "pointer" : "default" }}
                                        onClick={() => {
                                            if (count > 0 && onCellClick) {
                                                onCellClick(dayIdx, hour);
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            showTooltip({
                                                tooltipData: { title: tooltipTitle() },
                                                tooltipLeft: e.clientX,
                                                tooltipTop: e.clientY,
                                            });
                                        }}
                                        onMouseLeave={hideTooltip}
                                    />
                                );
                            })
                        )}
                    </Group>
                </svg>

                {tooltipOpen && tooltipData && (
                    <TooltipInPortal
                        key={Math.random()} // force re-render for position updates
                        top={tooltipTop}
                        left={tooltipLeft}
                        style={{ ...defaultStyles, zIndex: 100, whiteSpace: 'pre-wrap', fontSize: '12px' }}
                    >
                        {tooltipData.title}
                    </TooltipInPortal>
                )}
            </div>
        </div>
    );
}
