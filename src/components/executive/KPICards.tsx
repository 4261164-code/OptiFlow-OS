import React from 'react';
import { useExecutiveMetrics } from '../../hooks/executive/useExecutiveMetrics';
import { ErrorBoundary } from './ErrorBoundary';
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Target, Activity } from 'lucide-react';
import { cn } from '../../lib/utils'; // if it exists; otherwise use tailwind-merge manually or template literals

function MetricCard({ title, value, change, isLoading, format = 'number' }: { title: string; value: number; change: number; isLoading: boolean; format?: 'number' | 'currency' | 'percent' }) {
    const isPositive = change >= 0;
    
    let formattedValue = value.toString();
    if (format === 'currency') formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    if (format === 'number') formattedValue = new Intl.NumberFormat('en-US').format(Math.round(value));
    if (format === 'percent') formattedValue = value.toFixed(2) + '%';

    return (
        <div className="relative overflow-hidden executive-glass-card p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 font-sans tracking-tight mb-2">{title}</h3>
            
            {isLoading ? (
                <div className="animate-pulse flex flex-col gap-2 mt-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                </div>
            ) : (
                <>
                    <p className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                        {formattedValue}
                    </p>
                    <div className={`flex items-center text-sm font-medium \${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {Math.abs(change).toFixed(1)}% vs prior 30d
                    </div>
                </>
            )}
            
            <div className="absolute right-6 top-6 text-gray-300 dark:text-gray-700">
                {format === 'currency' && <DollarSign className="w-6 h-6 opacity-20" />}
                {format === 'number' && <MousePointerClick className="w-6 h-6 opacity-20" />}
                {format === 'percent' && <Target className="w-6 h-6 opacity-20" />}
            </div>
        </div>
    );
}

export function KPICards() {
    const { status, metrics } = useExecutiveMetrics();
    const isLoading = status === 'loading';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ErrorBoundary>
                <MetricCard title="Total Revenue" value={metrics.revenue.current} change={metrics.revenue.change} isLoading={isLoading} format="currency" />
            </ErrorBoundary>
            <ErrorBoundary>
                <MetricCard title="Net Profit" value={metrics.net.current} change={metrics.net.change} isLoading={isLoading} format="currency" />
            </ErrorBoundary>
            <ErrorBoundary>
                <MetricCard title="Total Clicks" value={metrics.clicks.current} change={metrics.clicks.change} isLoading={isLoading} format="number" />
            </ErrorBoundary>
            <ErrorBoundary>
                <MetricCard title="Total Conversions" value={metrics.conversions.current} change={metrics.conversions.change} isLoading={isLoading} format="number" />
            </ErrorBoundary>
            <ErrorBoundary>
                <MetricCard title="Conversion Rate" value={metrics.conversionRate.current} change={metrics.conversionRate.change} isLoading={isLoading} format="percent" />
            </ErrorBoundary>
            <ErrorBoundary>
                <MetricCard title="Average Order Value" value={metrics.aov.current} change={metrics.aov.change} isLoading={isLoading} format="currency" />
            </ErrorBoundary>
        </div>
    );
}
