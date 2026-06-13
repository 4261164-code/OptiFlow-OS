import { apiFetch } from '../../lib/auth';

export async function fetchRankings(type: 'clusters' | 'articles' | 'offers') {
    const res = await apiFetch(`/api/executive/rankings?type=${type}`);
    if (!res.ok) {
        throw new Error("Failed to fetch rankings");
    }
    return res.json();
}

export async function fetchCharts(days: number = 30) {
    const res = await apiFetch(`/api/executive/charts?days=${days}`);
    if (!res.ok) {
        throw new Error("Failed to fetch charts");
    }
    return res.json();
}
