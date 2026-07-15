import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, FileText, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function AnalyticsLab() {
  const [isGenerating, setIsGenerating] = useState(false);

  const [keywordData, setKeywordData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>(Array(7).fill(Array(24).fill(0)));
  
  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/lab');
        if (res.ok) {
          const data = await res.json();
          setKeywordData(data.keywordData || []);
          setTrendData(data.trendData || []);
          if (data.heatmapData) setHeatmapData(data.heatmapData);
        }
      } catch (e) {
        console.error("Failed to fetch analytics data", e);
      }
    }
    fetchData();
  }, []);

  

  

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      
      // Branding Header
      doc.setFillColor(13, 17, 23); // #0D1117
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(168, 255, 53); // #a8ff35
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("OptiFlow Analytics", 14, 25);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("30-Day Affiliate Performance Summary", 14, 32);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 25);

      let yPos = 55;

      // Executive Summary
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Executive Summary", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const summaryText = "Over the last 30 days, the affiliate ecosystem has shown strong growth in revenue and clicks. The following report details keyword performance and month-over-month revenue trajectories.";
      const splitSummary = doc.splitTextToSize(summaryText, 180);
      doc.text(splitSummary, 14, yPos);
      yPos += splitSummary.length * 6 + 10;

      // Revenue & Clicks Table
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Revenue & Clicks Trajectory", 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Clicks', 'Revenue ($)']],
        body: trendData.map(d => [d.name, d.clicks.toLocaleString(), d.rev.toLocaleString()]),
        theme: 'striped',
        headStyles: { fillColor: [168, 255, 53], textColor: [13, 17, 23], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;

      // Keyword Performance Table
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Keyword Performance", 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Keyword', 'Search Volume', 'Position', 'Conv. Rate (%)']],
        body: keywordData.map(d => [d.name, d.searches.toLocaleString(), d.pos, d.convRate]),
        theme: 'striped',
        headStyles: { fillColor: [13, 17, 23], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`OptiFlow Proprietary & Confidential - Page ${i} of ${pageCount}`, 14, 285);
      }

      doc.save('OptiFlow_Analytics_30Day_Report.pdf');
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Lab</h1>
          <p className="text-sm text-zinc-400 mt-1">Deep dive into performance data.</p>
        </div>
        
        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-[#a8ff35] text-[#0D1117] px-4 py-2 rounded-lg font-bold hover:bg-[#96e62d] transition-colors disabled:opacity-70"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {isGenerating ? "Generating PDF..." : "Download 30-Day Report"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Revenue & Clicks Trajectory</h3>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={trendData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                   <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <YAxis yAxisId="left" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <YAxis yAxisId="right" orientation="right" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <RechartsTooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                   <Line yAxisId="left" type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={3} dot={false} />
                   <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Keyword Performance</h3>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={keywordData} layout="vertical" margin={{ left: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                   <XAxis type="number" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <YAxis type="category" dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <RechartsTooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                   <Bar dataKey="searches" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Peak Traffic Hours (Affiliate Network)</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex mb-2">
              <div className="w-12"></div>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={`hr-${i}`} className="flex-1 text-center text-xs text-zinc-500">
                  {i % 3 === 0 ? `${i}:00` : ''}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {days.map((day, dayIdx) => (
                <div key={day} className="flex items-center gap-2">
                  <div className="w-10 text-xs text-zinc-400 font-medium">{day}</div>
                  <div className="flex-1 flex gap-1">
                    {heatmapData[dayIdx].map((val, hourIdx) => {
                      // Map 0-100 to opacity
                      const opacity = Math.max(0.1, Math.min(1, val / 100));
                      return (
                        <div 
                          key={`${day}-${hourIdx}`} 
                          className="flex-1 h-8 rounded-sm bg-emerald-500 hover:ring-2 ring-emerald-400 transition-all cursor-pointer"
                          style={{ opacity }}
                          title={`${day} ${hourIdx}:00 - Intensity: ${Math.round(val)}`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
