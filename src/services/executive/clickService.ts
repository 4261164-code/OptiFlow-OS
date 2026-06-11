import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function subscribeToClicks(callback: (total: number, last30: number, prior30: number) => void) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 60);

    const q = query(
        collection(db, 'affiliate_clicks'),
        where('timestamp', '>=', fromDate)
    );

    return onSnapshot(q, (snapshot) => {
        let last30 = 0, prior30 = 0;
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const tsFormat = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp;
            const tsMs = typeof tsFormat === "number" ? tsFormat : (new Date(tsFormat).getTime() || now);

            if (now - tsMs <= thirtyDaysMs) {
                last30 += 1;
            } else {
                prior30 += 1;
            }
        });

        // The exact total clicks might be more than 60 days, we're returning 60d as the proxy for the test, 
        // to avoid reading millions. In a production app, Total Clicks forever wouldn't fit here.
        // We'll pass last30 as the metric for the dashboard's "current period value"
        callback(last30 + prior30, last30, prior30);
    }, (error) => {
        console.error("Click service snapshot error", error);
        callback(0, 0, 0);
    });
}
