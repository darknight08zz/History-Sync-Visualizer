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
        range: theme === "dark" ? ["#1e293b", "#818cf8"] : ["#f1f5f9", "#4f46e5"], // slate-800 to indigo-400 (dark) vs slate-100 to indigo-600 (light)
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
        <div className="overflow-x-auto pb-2">
            <div style={{ minWidth: width }}>
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

                        {/* Y Axis Labels */}
                        {matrix.map((_, dayIdx) => (
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
                        ))}

                        <HeatmapRect
                            data={data}
                            xScale={xScale}
                            yScale={yScale}
                            colorScale={colorScale}
                            binWidth={cellWidth}
                            binHeight={cellHeight}
                            gap={gap}
                        >
                            {heatmap =>
                                heatmap.map(heatmapBins =>
                                    heatmapBins.map(bin => {
                                        const { count, dayIdx, hour } = bin.bin as any;
                                        return (
                                            <rect
                                                key={`heatmap-rect-${bin.row}-${bin.column}`}
                                                width={bin.width}
                                                height={bin.height}
                                                x={bin.x}
                                                y={bin.y}
                                                fill={bin.color}
                                                rx={2}
                                                style={{
                                                    cursor: count > 0 ? 'pointer' : 'default',
                                                    opacity: count === 0 ? 1 : Math.max(0.3, count / max)
                                                }}
                                                onClick={() => {
                                                    if (count > 0 && onCellClick) {
                                                        onCellClick(dayIdx, hour);
                                                    }
                                                }}
                                                onMouseEnter={(e) => {
                                                    const { tags, count: c } = getCellDetails(events, dayIdx, hour);
                                                    const title = c > 0
                                                        ? `${c} events${tags.length ? `\nTop tags: ${tags.join(", ")}` : ""}`
                                                        : `${count} events at ${hour}:00`;

                                                    showTooltip({
                                                        tooltipData: { title },
                                                        tooltipLeft: e.clientX,
                                                        tooltipTop: e.clientY,
                                                    });
                                                }}
                                                onMouseLeave={hideTooltip}
                                            />
                                        );
                                    })
                                )
                            }
                        </HeatmapRect>
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
