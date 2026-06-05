import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Pin } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui';
import { formatDistanceToNow } from 'date-fns';
import { Copy } from 'lucide-react';

export function PinsPage() {
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const qPins = query(collection(db, 'pins'), where('userId', '==', uid));
    const unsub = onSnapshot(qPins, (snap) => {
      setPins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pin)).sort((a,b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, [auth.currentUser]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white">Pinterest Assets</h1>
      </div>
      
      {pins.length === 0 ? (
        <Card className="bg-[#121214] border-dashed border-white/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-zinc-500 mb-4">You haven't generated any pins yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pins.map(pin => (
            <Card key={pin.id} className="flex flex-col">
              <CardHeader className="pb-3 border-b border-white/5 mb-3">
                <CardTitle className="text-lg line-clamp-2">{pin.title}</CardTitle>
                <CardDescription className="text-xs">
                  {formatDistanceToNow(pin.createdAt, { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 text-sm flex flex-col">
                {pin.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-white/5 mb-2 relative aspect-[9/16] bg-[#1C1D21] flex justify-center items-center">
                    <img src={pin.imageUrl} alt={pin.concept} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-zinc-300 line-clamp-4">{pin.description}</p>
                </div>
                {!pin.imageUrl && (
                  <div className="bg-[#1C1D21] border border-white/5 p-3 rounded-lg">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Image Concept</p>
                    <p className="text-zinc-400 text-xs italic">{pin.concept}</p>
                  </div>
                )}
                <div className="pt-2 mt-auto border-t border-white/5 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(pin.title + "\n" + pin.description)}>
                    <Copy className="w-3 h-3 mr-2" /> Copy text
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
