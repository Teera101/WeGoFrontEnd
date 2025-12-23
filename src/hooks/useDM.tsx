// apps/frontend/src/hooks/useDM.ts
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../lib/socket';
import { useAuth } from './useAuth';
import { api } from '../lib/api';

type DMMessage = { 
  _id: string;
  from: { _id: string; username: string; email: string; avatar?: string; isOnline?: boolean };
  to: { _id: string; username: string; email: string; avatar?: string; isOnline?: boolean };
  text: string; 
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

type PeerMeta = { uid: string; name: string; avatar?: string; isOnline?: boolean };

type DMContextValue = {
  meUid: string;
  isOpen: boolean;
  openPeer: PeerMeta | null;
  openDM: (peer: string | PeerMeta) => void;
  closeDM: () => void;
  getMsgs: (peerUid?: string) => DMMessage[];
  sendTo: (peerUid: string, text: string) => void;
  loadConversation: (peerUid: string) => Promise<void>;
};

const DMContext = createContext<DMContextValue | null>(null);

// key สำหรับคู่สนทนา (a,b) -> a|b โดยเรียงอักขระเพื่อไม่ซ้ำสลับ
const dmKeyFor = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export const DMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const meUid = user?._id || 'guest';

  // เก็บข้อความทุกคู่แชทใน Map
  const [messageStore, setMessageStore] = useState<Map<string, DMMessage[]>>(new Map());
  const [loadedConversations, setLoadedConversations] = useState<Set<string>>(new Set());

  // peers map stores metadata for known peers
  const peersRef = useRef<Map<string, PeerMeta>>(new Map());

  const [openPeerUid, setOpenPeerUid] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Socket.io connection and DM message handling
  useEffect(() => {
    if (!user) return;

    if (!socket.connected) socket.connect();

    // Join as user
    socket.emit('user:join', user._id);

    // Listen for incoming DM messages
    const handleDMReceive = (data: DMMessage) => {
      console.log('📨 DM received:', data);
      const fromUid = typeof data.from === 'object' ? data.from._id : data.from;
      const toUid = typeof data.to === 'object' ? data.to._id : data.to;
      const key = dmKeyFor(fromUid, toUid);
      setMessageStore((prev) => {
        const newStore = new Map(prev);
        const arr = newStore.get(key) || [];
        // Check if message already exists (avoid duplicates)
        if (!arr.some(m => m._id === data._id)) {
          arr.push(data);
          newStore.set(key, arr);
        }
        return newStore;
      });
      setForceUpdate(v => v + 1);
    };

    // Listen for sent confirmation
    const handleDMSent = (data: DMMessage) => {
      console.log('✅ DM sent confirmation:', data);
      const fromUid = typeof data.from === 'object' ? data.from._id : data.from;
      const toUid = typeof data.to === 'object' ? data.to._id : data.to;
      const key = dmKeyFor(fromUid, toUid);
      setMessageStore((prev) => {
        const newStore = new Map(prev);
        const arr = newStore.get(key) || [];
        // Replace optimistic message or add if not exists
        const tempIdx = arr.findIndex(m => m._id.startsWith('temp-'));
        if (tempIdx !== -1) {
          arr[tempIdx] = data;
        } else if (!arr.some(m => m._id === data._id)) {
          arr.push(data);
        }
        newStore.set(key, arr);
        return newStore;
      });
      setForceUpdate(v => v + 1);
    };

    // Listen for user status changes
    const handleUserStatusChanged = (data: { userId: string; isOnline: boolean }) => {
      console.log('🔄 User status changed:', data);
      // Update peer metadata
      const peer = peersRef.current.get(data.userId);
      if (peer) {
        peersRef.current.set(data.userId, { ...peer, isOnline: data.isOnline });
        setForceUpdate(v => v + 1);
      }
    };

    socket.on('dm:receive', handleDMReceive);
    socket.on('dm:sent', handleDMSent);
    socket.on('userStatusChanged', handleUserStatusChanged);

    return () => {
      socket.off('dm:receive', handleDMReceive);
      socket.off('dm:sent', handleDMSent);
      socket.off('userStatusChanged', handleUserStatusChanged);
    };
  }, [user]);

  const openPeer = useMemo(() => {
    if (!openPeerUid) return null;
    return peersRef.current.get(openPeerUid) ?? null;
  }, [openPeerUid]);

  const loadConversation = async (peerUid: string) => {
    const key = dmKeyFor(meUid, peerUid);
    if (loadedConversations.has(key)) return; // Already loaded

    try {
      console.log(`📥 Loading conversation with ${peerUid}`);
      const response = await api.get(`/directmessages/conversation/${peerUid}`);
      const messages: DMMessage[] = response.data;
      console.log(`✅ Loaded ${messages.length} messages`);
      
      setMessageStore((prev) => {
        const newStore = new Map(prev);
        newStore.set(key, messages);
        return newStore;
      });
      setLoadedConversations(prev => new Set(prev).add(key));
      setForceUpdate(v => v + 1);
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
    }
  };

  const getMsgs = (peerUidArg?: string) => {
    const peerUid = peerUidArg ?? openPeerUid;
    if (!peerUid) {
      console.log('⚠️ getMsgs: no peerUid');
      return [];
    }
    const key = dmKeyFor(meUid, peerUid);
    const messages = messageStore.get(key) ?? [];
    console.log(`📬 getMsgs(${peerUid}): key="${key}", meUid="${meUid}", found ${messages.length} messages`);
    return messages;
  };

  const sendTo = (peerUid: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    
    console.log('📤 Sending DM:', { from: meUid, to: peerUid, text: t });

    // Create optimistic message with temp ID
    const tempMsg: DMMessage = { 
      _id: `temp-${Date.now()}`,
      from: { 
        _id: meUid, 
        username: user?.username || '',
        email: user?.email || '',
        avatar: undefined
      },
      to: { 
        _id: peerUid, 
        username: openPeer?.name || '',
        email: '',
        avatar: openPeer?.avatar
      },
      text: t, 
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to local store immediately (optimistic update)
    const key = dmKeyFor(meUid, peerUid);
    setMessageStore((prev) => {
      const newStore = new Map(prev);
      const arr = newStore.get(key) || [];
      arr.push(tempMsg);
      newStore.set(key, arr);
      return newStore;
    });

    // Send via socket
    socket.emit('dm:send', { from: meUid, to: peerUid, text: t, at: Date.now() });
    setForceUpdate(v => v + 1);
  };

  const openDM = async (peer: string | PeerMeta) => {
    let peerUid: string;
    if (typeof peer === 'string') {
      peerUid = peer;
      setOpenPeerUid(peer);
    } else {
      // store peer metadata and open
      peersRef.current.set(peer.uid, peer);
      peerUid = peer.uid;
      setOpenPeerUid(peer.uid);
    }
    
    console.log(`🔓 Opening DM with ${peerUid}, meUid=${meUid}`);
    
    // Load conversation when opening DM
    await loadConversation(peerUid);
  };
  
  const closeDM = () => setOpenPeerUid(null);

  const value: DMContextValue = {
    meUid,
    isOpen: !!openPeerUid,
    openPeer,
    openDM,
    closeDM,
    getMsgs,
    sendTo,
    loadConversation,
  };

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
};

export const useDM = () => {
  const ctx = useContext(DMContext);
  if (!ctx) throw new Error('useDM must be used within DMProvider');
  return ctx;
};