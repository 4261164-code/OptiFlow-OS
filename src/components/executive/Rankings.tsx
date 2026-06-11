import React, { useState, useEffect } from 'react';
import { fetchRankings } from '../../services/executive/clusterService';
import { ErrorBoundary } from './ErrorBoundary';
import { EmptyState } from './Charts';
import { Trophy } from 'lucide-react';

function RankingTable({ type }: { type: 'clusters' | 'articles' | 'offers' }) {
    const [data, setData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let isMounted = true;
        fetchRankings(type).then(res => {
            if (isMounted) {
                setData(res);
                setLoading(false);
            }
        }).catch(e => {
            if (isMounted) setLoading(false);
            throw e;
        });
        return () => { isMounted = false; };
    }, [type]);

    if (loading) {
        return (
            <div className="space-y-4 py-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-full"></div>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <EmptyState icon={Trophy} title={`No \${type} ranked yet`} subtitle="Check back later once performance signals are captured." />;
    }

    const displayed = data.slice(0, page * 10);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400">
                        <th className="py-4 font-medium px-4">Rank</th>
                        <th className="py-4 font-medium px-4">Name</th>
                        <th className="py-4 font-medium px-4 text-right">Clicks</th>
                        <th className="py-4 font-medium px-4 text-right">Conversions</th>
                        <th className="py-4 font-medium px-4 text-right">Conv. Rate</th>
                        <th className="py-4 font-medium px-4 text-right">Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {displayed.map((row, i) => (
                        <tr key={row.id}>
                            <td className="py-4 px-4 text-gray-500 dark:text-gray-400">{i + 1}</td>
                            <td className="py-4 px-4 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{row.name}</td>
                            <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-300">{row.clicks}</td>
                            <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-300">{row.conversions}</td>
                            <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-300">
                                {row.conversionRate.toFixed(2)}%
                            </td>
                            <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.revenue)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {data.length > displayed.length && (
                <div className="mt-4 text-center">
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                    >
                        Show more
                    </button>
                </div>
            )}
        </div>
    );
}

export function Rankings() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="p-6 executive-glass-card">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Clusters</h3>
                <ErrorBoundary>
                    <RankingTable type="clusters" />
                </ErrorBoundary>
            </div>
            <div className="p-6 executive-glass-card">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Articles</h3>
                <ErrorBoundary>
                    <RankingTable type="articles" />
                </ErrorBoundary>
            </div>
            <div className="p-6 executive-glass-card lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Offers</h3>
                <ErrorBoundary>
                    <RankingTable type="offers" />
                </ErrorBoundary>
            </div>
        </div>
    );
}
