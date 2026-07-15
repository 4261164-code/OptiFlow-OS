import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui";

export function StartupDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDiagnostics = (refresh: boolean = false) => {
    setLoading(true);
    fetch(refresh ? '/api/diagnostics/refresh' : '/api/diagnostics', { method: refresh ? 'POST' : 'GET' })
      .then(res => res.json())
      .then(data => {
        setDiagnostics(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  if (error) return <div>Error loading diagnostics: {error}</div>;
  if (!diagnostics && loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Startup Diagnostics</h1>
        <button 
          onClick={() => fetchDiagnostics(true)} 
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run Live Handshake'}
        </button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-zinc-900 p-4 rounded text-zinc-100 overflow-x-auto">{JSON.stringify(diagnostics, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
