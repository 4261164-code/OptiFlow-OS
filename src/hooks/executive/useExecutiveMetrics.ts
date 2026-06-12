import { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { subscribeToRevenueEvents } from '../../services/executive/revenueService';
import { subscribeToClicks } from '../../services/executive/clickService';
import { subscribeToConversions } from '../../services/executive/conversionService';

export function useExecutiveMetrics() {
    const [status, setStatus] = useState<'loading' | 'active' | 'error' | 'offline'>('loading');
    
    const [metrics, setMetrics] = useState({
        revenueTotal: 0,
        revenueLast30: 0,
        revenuePrior30: 0,
        netTotal: 0,
        netLast30: 0,
        netPrior30: 0,
        
        clicksTotal: 0,
        clicksLast30: 0,
        clicksPrior30: 0,
        
        conversionsTotal: 0,
        conversionsLast30: 0,
        conversionsPrior30: 0,
    });

    const [loaded, setLoaded] = useState({
        revenue: false,
        clicks: false,
        conversions: false
    });

    useEffect(() => {
        if (!auth.currentUser) return;
        const uid = auth.currentUser.uid;
        let isSetup = true;

        const unsubRev = subscribeToRevenueEvents(uid, (total, net, last30Total, last30Net, prior30Total, prior30Net) => {
            if (!isSetup) return;
            setMetrics(m => ({
                ...m,
                revenueTotal: total,
                netTotal: net,
                revenueLast30: last30Total,
                netLast30: last30Net,
                revenuePrior30: prior30Total,
                netPrior30: prior30Net
            }));
            setLoaded(l => ({ ...l, revenue: true }));
        });

        const unsubClicks = subscribeToClicks(uid, (total, last30, prior30) => {
            if (!isSetup) return;
            setMetrics(m => ({
                ...m,
                clicksTotal: total,
                clicksLast30: last30,
                clicksPrior30: prior30
            }));
            setLoaded(l => ({ ...l, clicks: true }));
        });

        const unsubConversions = subscribeToConversions(uid, (total, last30, prior30) => {
            if (!isSetup) return;
            setMetrics(m => ({
                ...m,
                conversionsTotal: total,
                conversionsLast30: last30,
                conversionsPrior30: prior30
            }));
            setLoaded(l => ({ ...l, conversions: true }));
        });

        // Basic offline mock check
        const onOffline = () => setStatus('offline');
        const onOnline = () => setStatus('active');
        window.addEventListener('offline', onOffline);
        window.addEventListener('online', onOnline);

        return () => {
            isSetup = false;
            unsubRev && unsubRev();
            unsubClicks && unsubClicks();
            unsubConversions && unsubConversions();
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('online', onOnline);
        };
    }, [auth.currentUser]);

    useEffect(() => {
        if (loaded.revenue && loaded.clicks && loaded.conversions) {
            setStatus('active');
        }
    }, [loaded]);

    // calculate derived metrics
    const revChange = metrics.revenuePrior30 === 0 ? 0 : ((metrics.revenueLast30 - metrics.revenuePrior30) / metrics.revenuePrior30) * 100;
    const netChange = metrics.netPrior30 === 0 ? 0 : ((metrics.netLast30 - metrics.netPrior30) / Math.abs(metrics.netPrior30)) * 100;
    const clicksChange = metrics.clicksPrior30 === 0 ? 0 : ((metrics.clicksLast30 - metrics.clicksPrior30) / metrics.clicksPrior30) * 100;
    const convChange = metrics.conversionsPrior30 === 0 ? 0 : ((metrics.conversionsLast30 - metrics.conversionsPrior30) / metrics.conversionsPrior30) * 100;

    const convRateLast30 = metrics.clicksLast30 > 0 ? (metrics.conversionsLast30 / metrics.clicksLast30) * 100 : 0;
    const convRatePrior30 = metrics.clicksPrior30 > 0 ? (metrics.conversionsPrior30 / metrics.clicksPrior30) * 100 : 0;
    const convRateChange = convRatePrior30 === 0 ? 0 : ((convRateLast30 - convRatePrior30) / convRatePrior30) * 100;

    const aovLast30 = metrics.conversionsLast30 > 0 ? (metrics.revenueLast30 / metrics.conversionsLast30) : 0;
    const aovPrior30 = metrics.conversionsPrior30 > 0 ? (metrics.revenuePrior30 / metrics.conversionsPrior30) : 0;
    const aovChange = aovPrior30 === 0 ? 0 : ((aovLast30 - aovPrior30) / aovPrior30) * 100;

    return {
        status,
        metrics: {
            revenue: { current: metrics.revenueLast30, change: revChange },
            net: { current: metrics.netLast30, change: netChange },
            clicks: { current: metrics.clicksLast30, change: clicksChange },
            conversions: { current: metrics.conversionsLast30, change: convChange },
            conversionRate: { current: convRateLast30, change: convRateChange },
            aov: { current: aovLast30, change: aovChange },
        }
    };
}
