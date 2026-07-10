import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui";

export function StartupDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/diagnostics')
      .then(res => res.json())
      .then(data => setDiagnostics(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div>Error loading diagnostics: {error}</div>;
  if (!diagnostics) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Startup Diagnostics</h1>
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
