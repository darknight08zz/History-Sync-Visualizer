
import React from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function LandingPage() {
    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-fade-in relative z-10">
                <div className="space-y-4 max-w-3xl px-4">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-sm font-semibold tracking-wide uppercase mb-4">
                        v1.0 Public Release
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                        Visualize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Digital History</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Unify your productivity data from Git, WhatsApp, Slack, and Google Calendar into one beautiful, searchable timeline.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto px-6">
                    <Link href="/signup" className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all duration-200 text-lg">
                        Get Started Free
                    </Link>
                    <Link href="/login" className="px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200 text-lg">
                        Login
                    </Link>
                </div>

                {/* Mobile App View Preview */}
                <div className="mt-16 w-full max-w-5xl mx-auto px-4">
                    <div className="relative rounded-2xl bg-slate-900 shadow-2xl overflow-hidden border border-slate-800 aspect-[16/9] group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0" />
                        {/* Placeholder for screenshot - using a CSS mock for now */}
                        <div className="relative z-10 p-8 flex flex-col items-center justify-center h-full space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />
                                <div className="h-32 bg-slate-800 rounded-lg animate-pulse delay-75" />
                                <div className="h-32 bg-slate-800 rounded-lg animate-pulse delay-150" />
                            </div>
                            <p className="text-slate-400 font-medium">Interactive Dashboard Preview</p>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16 px-4 text-left">
                    <div className="p-6 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center mb-4 text-2xl">
                            📊
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Heatmaps</h3>
                        <p className="text-slate-500 dark:text-slate-400">See your activity patterns at a glance with GitHub-style contributions graphs.</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center mb-4 text-2xl">
                            🤖
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Insights</h3>
                        <p className="text-slate-500 dark:text-slate-400">Get personalized productivity coaching and burnout warnings powered by Gemini.</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-lg flex items-center justify-center mb-4 text-2xl">
                            📱
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mobile Ready</h3>
                        <p className="text-slate-500 dark:text-slate-400">Fully responsive design implementation works perfectly on your phone.</p>
                    </div>
                </div>
            </div>

            <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-slate-400 text-sm">
                &copy; 2024 History Sync Visualizer. All rights reserved.
            </footer>
        </Layout>
    );
}
