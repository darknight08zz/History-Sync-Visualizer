
// pages/dashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import UploadPanel from "../components/UploadPanel";
import Heatmap from "../components/Heatmap";
import Timeline from "../components/Timeline";
import DashboardStats from "../components/DashboardStats";
import EventModal from "../components/EventModal";
import AIInsightsModal from "../components/AIInsightsModal";
import HelpModal from "../components/HelpModal";
import { type EventItem } from "../lib/mockData";

/**
 * pages/dashboard.tsx
 *
 * Responsibilities:
 * - Fetch /api/aggregates?days=N to get server-side matrix + optional events
 * - Provide Upload -> POST /api/ingest and immediately display returned events
 * - Show fallback mock data if APIs are unreachable (local dev friendly)
 */

/* Helper: build matrix client-side from events (fallback if server doesn't supply matrix) */
function buildHeatmapMatrix(events: EventItem[], days = 30) {
    const matrix: number[][] = Array.from({ length: days }, () => Array(24).fill(0));
    const now = new Date();
    for (const e of events) {
        const t = new Date(e.timestamp);
        const dayDelta = Math.floor(
            (new Date(now.toDateString()).getTime() - new Date(t.toDateString()).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (dayDelta >= 0 && dayDelta < days) {
            matrix[dayDelta][t.getHours()] += 1;
        }
    }
    return matrix;
}

export default function DashboardPage() {
    const router = useRouter();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [matrix, setMatrix] = useState<number[][] | null>(null);
    const [days, setDays] = useState<number>(30);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /* Filter state */
    const [filterSource, setFilterSource] = useState<string>("All Sources");
    const [filterTag, setFilterTag] = useState<string>("");

    /* Theme State */
    const [theme, setTheme] = useState<"light" | "dark">("light");

    /* Modal state */
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalEvents, setModalEvents] = useState<EventItem[]>([]);
    const [modalTitle, setModalTitle] = useState("");
    const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
    const [githubUser, setGithubUser] = useState("");
    const [githubToken, setGithubToken] = useState("");
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [actors, setActors] = useState<{ name: string; count: number }[]>([]);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    /* Filter state */
    const [filterActor, setFilterActor] = useState<string>("All Actors");

    /* Derived events after filtering */
    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            const matchesSource = filterSource === "All Sources" || e.source.toLowerCase() === filterSource.toLowerCase();
            const matchesTag = !filterTag || (e.tags || []).some(t => t.toLowerCase().includes(filterTag.toLowerCase()));
            const matchesActor = filterActor === "All Actors" || (e.actor || "unknown") === filterActor;
            return matchesSource && matchesTag && matchesActor;
        });
    }, [events, filterSource, filterTag, filterActor]);

    /* Sync from URL on mount */
    useEffect(() => {
        if (!router.isReady) return;

        const { days: daysQ, source: sourceQ, tag: tagQ, actor: actorQ } = router.query;

        if (daysQ) setDays(Number(daysQ));
        if (sourceQ) setFilterSource(String(sourceQ));
        if (tagQ) setFilterTag(String(tagQ));
        if (actorQ) setFilterActor(String(actorQ));

    }, [router.isReady, router.query]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme") as "light" | "dark";
            const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
            setTheme(initial);
            if (initial === "dark") document.documentElement.classList.add("dark");
            else document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem("theme", next);
        if (next === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    };

    /* Load server aggregates (matrix + optionally events) */
    const loadAggregates = useCallback(
        async (daysParam: number) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/aggregates?days=${daysParam}`);
                if (!res.ok) {
                    if (res.status === 401) {
                        // Redirect handled by middleware mostly, but just in case
                        router.push("/login");
                        return;
                    }
                    throw new Error(`Aggregates request failed: ${res.status}`);
                }
                const json = await res.json();

                if (json.events && Array.isArray(json.events)) {
                    setEvents(json.events);
                }
                if (json.actors && Array.isArray(json.actors)) {
                    setActors(json.actors);
                }
                if (json.matrix && Array.isArray(json.matrix)) {
                    setMatrix(json.matrix);
                } else {
                    setMatrix(buildHeatmapMatrix(json.events ?? [], daysParam));
                }
            } catch (err: any) {
                console.error("Failed to load aggregates:", err);
                setError("Unable to fetch aggregates from server — server might be down.");
            } finally {
                setLoading(false);
            }
        },
        [router]
    );

    /* Fetch aggregates on mount and when `days` changes */
    useEffect(() => {
        loadAggregates(days);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days]);

    const handleClearData = async () => {
        if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) return;
        setLoading(true);
        try {
            await fetch("/api/clear", { method: "POST" });
            await loadAggregates(days);
        } catch (e: any) {
            alert("Failed to clear: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    async function handleGithubSync() {
        if (!githubUser) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/github", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: githubUser, token: githubToken })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "GitHub sync failed");

            await loadAggregates(days);
            setIsGithubModalOpen(false);
            setGithubUser("");
            setGithubToken("");
        } catch (e: any) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    const handleCellClick = useCallback((dayIdx: number, hour: number) => {
        const now = new Date();
        const nowTime = new Date(now.toDateString()).getTime();

        const cellEvents = filteredEvents.filter(e => {
            const t = new Date(e.timestamp);
            const dayDelta = Math.floor((nowTime - new Date(t.toDateString()).getTime()) / (1000 * 60 * 60 * 24));
            return dayDelta === dayIdx && t.getHours() === hour;
        });

        if (cellEvents.length > 0) {
            const dateStr = new Date(nowTime - dayIdx * 24 * 60 * 60 * 1000).toLocaleDateString();
            setModalTitle(`${cellEvents.length} Events on ${dateStr} at ${hour}:00`);
            setModalEvents(cellEvents);
            setIsModalOpen(true);
        }
    }, [filteredEvents]);


    /* Derived matrix for rendering: prefer server matrix UNLESS filtering is active */
    const effectiveMatrix = useMemo(() => {
        if (filterSource !== "All Sources" || filterTag || filterActor !== "All Actors") {
            return buildHeatmapMatrix(filteredEvents, days);
        }
        if (matrix && matrix.length >= days) return matrix;
        return buildHeatmapMatrix(events, days);
    }, [matrix, events, days, filterSource, filterTag, filterActor, filteredEvents]);

    /* Upload handler just refreshes aggregates now */
    async function handleUploadRefresh(newEvents: EventItem[]) {
        // We know events are in DB now, but we can optimistically add them or just reload.
        // Reloading ensures we get the latest clean state.
        await loadAggregates(days);
    }

    return (
        <Layout>
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-1">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">History Sync Visualizer</h1>
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="text-slate-400 hover:text-indigo-500 transition-colors"
                            title="What is this?"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-.846.673-1.651 1.46-2.074.282-.152.538-.35.75-.536a2.25 2.25 0 000-2.807zM12 16a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        Universal Timeline, Heatmap & Activity Insights
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider dark:bg-indigo-900/30 dark:text-indigo-300">
                            v1.0
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-md hover:shadow-md transition-all active:scale-95"
                    >
                        <span>✨ AI Insights</span>
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                        title="Toggle Dark Mode"
                    >
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                    <a className="text-xs font-medium px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 transition-colors text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" href="/api/auth/logout">
                        Logout
                    </a>
                </div>
            </header>

            {/* ... Existing Content ... */}

            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />


            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <UploadPanel
                            onUploadComplete={handleUploadRefresh}
                            onConnectGithub={() => setIsGithubModalOpen(true)}
                            onClearData={handleClearData}
                        />
                    </div>

                    <DashboardStats events={filteredEvents} />

                    {isGithubModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                <h3 className="text-lg font-bold mb-4">Connect GitHub</h3>
                                <p className="text-sm text-slate-600 mb-4">
                                    Enter username. Optional: PAT for private repos.
                                </p>
                                <div className="space-y-4">
                                    <input
                                        className="w-full border-slate-300 rounded-md shadow-sm text-sm"
                                        value={githubUser}
                                        onChange={e => setGithubUser(e.target.value)}
                                        placeholder="Username"
                                    />
                                    <input
                                        className="w-full border-slate-300 rounded-md shadow-sm text-sm"
                                        type="password"
                                        value={githubToken}
                                        onChange={e => setGithubToken(e.target.value)}
                                        placeholder="PAT (optional)"
                                    />
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={() => setIsGithubModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
                                    <button onClick={handleGithubSync} disabled={loading || !githubUser} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">Sync</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Heatmap</h2>
                            <div className="flex items-center gap-3">
                                <select
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="form-select text-sm border-slate-300 rounded-md shadow-sm"
                                    disabled={loading}
                                >
                                    <option value={7}>Last 7 days</option>
                                    <option value={14}>Last 14 days</option>
                                    <option value={30}>Last 30 days</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                                {error}
                            </div>
                        )}

                        <Heatmap matrix={effectiveMatrix} events={filteredEvents} onCellClick={handleCellClick} theme={theme} />
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Activity Timeline</h3>
                        <Timeline matrix={effectiveMatrix} />
                    </div>
                </div>

                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Filters</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                                <select
                                    className="w-full text-sm border-slate-300 rounded-md shadow-sm"
                                    value={filterSource}
                                    onChange={(e) => setFilterSource(e.target.value)}
                                >
                                    <option>All Sources</option>
                                    <option value="git">Git</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="slack">Slack</option>
                                    <option value="discord">Discord</option>
                                    <option value="calendar">Calendar</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Actor</label>
                                <select
                                    className="w-full text-sm border-slate-300 rounded-md shadow-sm"
                                    value={filterActor}
                                    onChange={(e) => setFilterActor(e.target.value)}
                                >
                                    <option>All Actors</option>
                                    {actors.map(a => (
                                        <option key={a.name} value={a.name}>{a.name} ({a.count})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                                <input
                                    className="w-full text-sm border-slate-300 rounded-md shadow-sm"
                                    placeholder="e.g. bugfix"
                                    value={filterTag}
                                    onChange={(e) => setFilterTag(e.target.value)}
                                />
                            </div>
                            <div>
                                <button
                                    className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => {
                                        const params = new URLSearchParams();
                                        params.set("days", days.toString());
                                        if (filterSource !== "All Sources") params.set("source", filterSource);
                                        if (filterTag) params.set("tag", filterTag);
                                        if (filterActor !== "All Actors") params.set("actor", filterActor);

                                        window.open(`/api/export/pdf?${params.toString()}`, "_blank");
                                    }}
                                >
                                    Export PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

            <footer className="text-sm text-slate-400 text-center py-8">
                Built with React + Tailwind — History Sync Visualizer
            </footer>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                events={modalEvents}
            />

            <AIInsightsModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                events={filteredEvents}
            />
        </Layout>
    );
}
