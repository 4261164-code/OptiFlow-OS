import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function subscribeToConversions(userId: string, callback: (total: number, last30: number, prior30: number) => void) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 60);

    const q = query(
        collection(db, 'affiliate_conversions'),
        where('userId', '==', userId),
        where('status', '==', 'confirmed'),
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

        callback(last30 + prior30, last30, prior30);
    }, (error) => {
        console.error("Conversion service snapshot error", error);
        callback(0, 0, 0);
    });
}
