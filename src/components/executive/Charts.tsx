import React, { useState, useEffect } from 'react';
import { fetchCharts } from '../../services/executive/clusterService';
import { ErrorBoundary } from './ErrorBoundary';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

export function EmptyState({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">{subtitle}</p>
        </div>
    );
}

function ChartsView() {
    const [days, setDays] = useState<7 | 30 | 90>(30);
    const [data, setData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const load = () => {
            fetchCharts(days).then(res => {
                if (isMounted) {
                    setData(res);
                    setLoading(false);
                }
            }).catch(e => {
                if (isMounted) setLoading(false);
                throw e; // will be caught by ErrorBoundary
            })
        };
        
        load();
        const interval = setInterval(load, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [days]);

    if (loading) {
        return (
            <div className="w-full h-[400px] bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
        );
    }

    if (!data || data.length === 0 || data.every(d => d.revenue === 0 && d.clicks === 0 && d.conversions === 0)) {
        return <EmptyState icon={Activity} title="No activity yet" subtitle="Charts will appear here once we record your first clicks or revenue events." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end space-x-2">
                {[7, 30, 90].map((d) => (
                    <button
                        key={d}
                        onClick={() => setDays(d as any)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors \${days === d ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    >
                        {d}D
                    </button>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 executive-glass-card">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Revenue over time</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 12}} strokeOpacity={0.4} />
                                <YAxis tick={{fontSize: 12}} strokeOpacity={0.4} tickFormatter={(val) => '$'+val} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="p-6 executive-glass-card">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Engagement Funnel</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 12}} strokeOpacity={0.4} />
                                <YAxis yAxisId="left" tick={{fontSize: 12}} strokeOpacity={0.4} />
                                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} strokeOpacity={0.4} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" name="Clicks" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                <Line yAxisId="right" type="monotone" name="Conversions" dataKey="conversions" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Charts() {
    return (
        <ErrorBoundary>
            <ChartsView />
        </ErrorBoundary>
    );
}
