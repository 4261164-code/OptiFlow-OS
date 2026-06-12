import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { addNotification } from '../lib/notifications';
import { TopicCluster, ClusterNode } from '../types';
import { 
  Network, 
  Search, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  TrendingUp, 
  GitCommit,
  CheckCircle2,
  Box
} from 'lucide-react';
import { BrandingHexIcon } from './CustomIcons';

export function SEOClusters() {
  const [pillarTopic, setPillarTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [activeClusterNodes, setActiveClusterNodes] = useState<ClusterNode[]>([]);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'topic_clusters'), where('userId', '==', uid));
    
    const unsub = onSnapshot(q, (snap) => {
      const dbClusters = snap.docs
        .map(d => d.data() as TopicCluster)
        .sort((a, b) => b.createdAt - a.createdAt);
      setClusters(dbClusters);
      if (dbClusters.length > 0 && !activeClusterId) {
        setActiveClusterId(dbClusters[0].id);
      }
    }, (error) => {
      console.warn("Error subscribing to topic clusters:", error);
    });

    return () => unsub();
  }, [activeClusterId]);

  useEffect(() => {
    if (!activeClusterId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const q = query(
      collection(db, 'cluster_nodes'), 
      where('userId', '==', uid),
      where('clusterId', '==', activeClusterId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const nodes = snap.docs
        .map(d => d.data() as ClusterNode)
        .sort((a, b) => a.createdAt - b.createdAt);
      setActiveClusterNodes(nodes);
    }, (error) => {
      console.warn("Error subscribing to cluster nodes:", error);
    });
    return () => unsub();
  }, [activeClusterId]);

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillarTopic.trim() || !auth.currentUser) return;
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/clusters/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: pillarTopic.trim(),
          userId: auth.currentUser.uid
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create cluster");

      setActiveClusterId(result.clusterId);
      setPillarTopic('');
      addNotification(auth.currentUser.uid, 'milestone', 'Cluster Generation Built', 'Topic semantic tree is parsing live.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const activeCluster = clusters.find(c => c.id === activeClusterId);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans tracking-tight font-bold text-white mb-2 flex items-center gap-3">
          <Network className="w-10 h-10 text-[#a8ff35] stroke-[2.8]" />
          <span>Programmatic SEO Cluster Engine</span>
        </h1>
        <p className="text-zinc-400 font-sans text-xs">Transform a core pillar topic into a 50+ page authority topic map automatically.</p>
      </div>

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-red-400">Analysis Interrupted</span>
              <p className="text-xs text-zinc-400 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Generator Input Box */}
      <Card className="border-white/5 bg-[#101115]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BrandingHexIcon className="w-5.5 h-5.5 text-[#a8ff35]" />
            <span>Pillar Subject / Main Anchor</span>
          </CardTitle>
          <CardDescription>Enter your master seed keyword. The AI Architect will generate internal link structures and writing queues.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCluster} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500 stroke-[2.5]" />
              <Input
                value={pillarTopic}
                onChange={e => setPillarTopic(e.target.value)}
                placeholder="e.g., Best Survey Sites, Enterprise Software Funnels..."
                className="pl-11 h-12 text-zinc-100 placeholder-zinc-500 bg-[#06070a] border-white/5"
                disabled={creating}
              />
            </div>
            <Button type="submit" disabled={creating || !pillarTopic.trim()} className="h-12 px-6 bg-[#a8ff35] text-black font-extrabold hover:bg-[#92ec1d]">
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-black stroke-[2.8]" />
                  Blueprint Architecting...
                </>
              ) : (
                <>
                  <span>Strategize Concept Hub</span>
                  <ArrowRight className="w-5 h-5 ml-2 text-black stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Clusters List & Active Map */}
      {clusters.length > 0 && (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Cluster Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Concept Hubs</h3>
            <div className="space-y-2">
              {clusters.map(cluster => (
                <div 
                  key={cluster.id} 
                  onClick={() => setActiveClusterId(cluster.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeClusterId === cluster.id ? 'bg-[#a8ff35]/10 border-[#a8ff35]/30' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-white line-clamp-1">{cluster.title}</span>
                    {cluster.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#a8ff35]" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <span className="uppercase">{cluster.status}</span>
                    <span>{cluster.completedNodes} / {cluster.totalNodes} Nodes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Cluster Visual Map */}
          {activeCluster && (
            <div className="lg:col-span-3 space-y-4">
              <Card className="border-white/5 bg-[#101115] min-h-[500px]">
                <CardHeader className="border-b border-white/5 bg-black/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg text-white">Topological Layout: {activeCluster.title}</CardTitle>
                      <CardDescription>Visualizing structural hierarchy and parent/child authority links.</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Cluster Progress</div>
                      <div className="text-[#a8ff35] text-xl font-mono font-bold mt-0.5">
                        {activeCluster.totalNodes > 0 ? Math.round((activeCluster.completedNodes / activeCluster.totalNodes) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                   {/* We mock a topological map using grid columns and visual connector classes */}
                   <div className="flex flex-col items-center">
                      {/* Pillar Parent Node */}
                      {activeClusterNodes.filter(n => n.isPillar).map(node => (
                        <div key={node.id} className="relative z-10 bg-[#111] border-2 border-[#a8ff35]/50 rounded-xl p-4 w-64 text-center shadow-[0_0_20px_rgba(168,255,53,0.15)] mb-8">
                           <Box className="w-6 h-6 text-[#a8ff35] mx-auto mb-2" />
                           <h4 className="text-sm font-bold text-white mb-1 line-clamp-2">{node.title}</h4>
                           <span className="text-[10px] bg-[#a8ff35]/15 text-[#a8ff35] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Pillar Hub</span>
                        </div>
                      ))}

                      {/* Supporting Nodes */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative w-full pt-4 before:absolute before:inset-0 before:top-[-32px] before:left-1/2 before:w-[2px] before:bg-gradient-to-b before:from-[#a8ff35]/20 before:to-transparent">
                        {activeClusterNodes.filter(n => !n.isPillar).map(node => (
                           <div key={node.id} className="relative bg-black/40 border border-white/10 rounded-lg p-3 hover:border-blue-500/50 transition">
                              {/* Connector visual simulated */}
                              <div className="absolute top-[-24px] left-1/2 w-[2px] h-[24px] bg-white/5"></div>
                              
                              <div className="flex justify-between items-start mb-2">
                                <GitCommit className={`w-4 h-4 ${node.status === 'completed' ? 'text-emerald-400' : 'text-blue-400'}`} />
                                <span className="text-[9px] text-zinc-500 bg-white/5 px-1 rounded uppercase font-mono">{node.searchIntent}</span>
                              </div>
                              <h5 className="text-[11px] font-bold text-zinc-200 line-clamp-2 leading-tight">{node.title}</h5>
                              <div className="mt-3 flex justify-between items-center text-[9px] font-mono">
                                <span className={node.status === 'completed' ? 'text-emerald-400' : 'text-zinc-500'}>{node.status}</span>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
