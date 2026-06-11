export async function fetchRankings(type: 'clusters' | 'articles' | 'offers') {
    const token = localStorage.getItem("admin_token") || "mock_token"; // fallback
    const res = await fetch(`/api/executive/rankings?type=${type}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error("Failed to fetch rankings");
    }
    return res.json();
}

export async function fetchCharts(days: number = 30) {
    const token = localStorage.getItem("admin_token") || "mock_token"; // fallback
    const res = await fetch(`/api/executive/charts?days=${days}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error("Failed to fetch charts");
    }
    return res.json();
}
