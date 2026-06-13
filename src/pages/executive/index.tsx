import React, { useState, useEffect, Suspense, lazy } from 'react';
import { KPICards } from '../../components/executive/KPICards';
import { Rankings } from '../../components/executive/Rankings';
import { useExecutiveMetrics } from '../../hooks/executive/useExecutiveMetrics';
import { Moon, Sun, Clock, WifiOff, BarChart3, Settings2, Globe, Shield, Activity } from 'lucide-react';
import { ErrorBoundary } from '../../components/executive/ErrorBoundary';
import { OpsBoard } from '../../components/executive/OperationsBoard';
import { MaxBountyPanel } from '../../components/executive/MaxBountyPanel';
import { CommandCenter } from '../../components/executive/CommandCenter';
import { DiagnosticsBoard } from '../../components/executive/DiagnosticsBoard';

const Charts = lazy(() => import('../../components/executive/Charts').then(m => ({ default: m.Charts })));

export default function ExecutiveDashboard() {
    const { status } = useExecutiveMetrics();
    const [activeTab, setActiveTab] = useState<'analytics' | 'operations' | 'maxbounty' | 'command' | 'diagnostics'>('command');
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || 
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const [lastUpdated, setLastUpdated] = useState(0);

    useEffect(() => {
        if (status === 'active') setLastUpdated(0);
        const int = setInterval(() => {
            if (status === 'active') setLastUpdated(prev => prev + 1);
        }, 1000);
        return () => clearInterval(int);
    }, [status]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 p-4 sm:p-8 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-900 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">CEO Command Center</h1>
                        
                        <div className="flex items-center mt-2 space-x-4">
                            {status === 'offline' ? (
                                <div className="flex items-center text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full text-sm font-medium">
                                    <WifiOff className="w-4 h-4 mr-2" />
                                    Live data unavailable — showing last known values
                                </div>
                            ) : (
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <div className="relative flex h-2 w-2 mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </div>
                                    Real-time sync active
                                    <span className="ml-4 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" /> 
                                        Last updated {lastUpdated} seconds ago
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Tab Switcher */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setActiveTab('command')}
                                className={`inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                                    activeTab === 'command'
                                        ? 'bg-white dark:bg-[#111] text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <Shield className="w-3.5 h-3.5 mr-1.5" />
                                CEO Command Center
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                                    activeTab === 'analytics'
                                        ? 'bg-white dark:bg-[#111] text-zinc-900 dark:text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                Revenue Analytics
                            </button>
                            <button
                                onClick={() => setActiveTab('operations')}
                                className={`inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                                    activeTab === 'operations'
                                        ? 'bg-white dark:bg-[#111] text-zinc-900 dark:text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                                <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                                Operational Controls
                            </button>
                            <button
                                onClick={() => setActiveTab('maxbounty')}
                                className={`inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                                    activeTab === 'maxbounty'
                                        ? 'bg-white dark:bg-[#111] text-zinc-900 dark:text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <Globe className="w-3.5 h-3.5 mr-1.5" />
                                MaxBounty CPA
                            </button>
                            <button
                                onClick={() => setActiveTab('diagnostics')}
                                className={`inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                                    activeTab === 'diagnostics'
                                        ? 'bg-white dark:bg-[#111] text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                                <Activity className="w-3.5 h-3.5 mr-1.5" />
                                Systems Diagnostics
                            </button>
                        </div>

                        <button 
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            {darkMode ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                        </button>
                    </div>
                </header>

                <main className="space-y-8">
                    {activeTab === 'command' ? (
                        <ErrorBoundary>
                            <CommandCenter />
                        </ErrorBoundary>
                    ) : activeTab === 'analytics' ? (
                        <>
                            <KPICards />
                            <ErrorBoundary>
                                <Suspense fallback={<div className="w-full h-[400px] bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse my-6"></div>}>
                                    <Charts />
                                </Suspense>
                            </ErrorBoundary>
                            <Rankings />
                        </>
                    ) : activeTab === 'operations' ? (
                        <ErrorBoundary>
                            <OpsBoard />
                        </ErrorBoundary>
                    ) : activeTab === 'diagnostics' ? (
                        <ErrorBoundary>
                            <DiagnosticsBoard />
                        </ErrorBoundary>
                    ) : (
                        <ErrorBoundary>
                            <MaxBountyPanel />
                        </ErrorBoundary>
                    )}
                </main>
            </div>
        </div>
    );
}
