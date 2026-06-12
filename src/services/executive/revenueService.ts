import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function subscribeToRevenueEvents(userId: string, callback: (total: number, net: number, last30Total: number, last30Net: number, prior30Total: number, prior30Net: number) => void) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 60);

    const q = query(
        collection(db, 'revenue_events'),
        where('userId', '==', userId),
        where('timestamp', '>=', fromDate)
    );

    return onSnapshot(q, (snapshot) => {
        let total = 0, net = 0;
        let last30Total = 0, last30Net = 0;
        let prior30Total = 0, prior30Net = 0;

        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const amount = Number(data.amount || 0);
            const type = data.type;
            const isReversal = type === "reversal";
            const tsFormat = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp;
            const tsMs = typeof tsFormat === "number" ? tsFormat : (new Date(tsFormat).getTime() || now);

            // Everything is within last 60 days.
            if (now - tsMs <= thirtyDaysMs) {
                if (!isReversal) last30Total += amount;
                last30Net += isReversal ? -amount : amount;
            } else {
                if (!isReversal) prior30Total += amount;
                prior30Net += isReversal ? -amount : amount;
            }

            if (!isReversal) total += amount;
            net += isReversal ? -amount : amount;
        });

        callback(total, net, last30Total, last30Net, prior30Total, prior30Net);
    }, (error) => {
        console.error("Revenue service snapshot error", error);
        callback(0, 0, 0, 0, 0, 0);
    });
}
