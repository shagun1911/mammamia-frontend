"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Collection {
  _id?: string;
  collection_name: string;
  name?: string;
  created_at: string;
  userId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  retrieved_docs?: string[];
  timestamp: Date;
}

export interface ChatThread {
  thread_id: string;
  collection_name: string;
  messages: ChatMessage[];
  created_at: Date;
}

interface KnowledgeBaseContextType {
  // Collections
  collections: Collection[];
  addCollection: (collectionName: string, kbData?: any) => void;
  loadCollections: () => Promise<void>;
  deleteCollection: (kbId: string) => Promise<void>;
  selectedCollection: string | null;
  setSelectedCollection: (name: string | null) => void;

  // Chat threads
  chatThreads: Map<string, ChatThread>;
  currentThreadId: string | null;
  createNewThread: (collectionName: string) => string;
  addMessageToThread: (threadId: string, message: ChatMessage) => void;
  getChatThread: (threadId: string) => ChatThread | undefined;

  // Chat agent prompt
  chatAgentPrompt: string;
  setChatAgentPrompt: (prompt: string) => void;

  // Voice agent prompt
  voiceAgentPrompt: string;
  setVoiceAgentPrompt: (prompt: string) => void;
}

const KnowledgeBaseContext = createContext<KnowledgeBaseContextType | undefined>(undefined);

export function KnowledgeBaseProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [chatThreads, setChatThreads] = useState<Map<string, ChatThread>>(new Map());
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [chatAgentPrompt, setChatAgentPrompt] = useState<string>(
    'You are a helpful AI assistant. Be friendly and concise.'
  );
  const [voiceAgentPrompt, setVoiceAgentPrompt] = useState<string>(
    'You are a helpful AI voice assistant. Speak clearly and be empathetic.'
  );

  const addCollection = useCallback((collectionName: string, kbData?: any) => {
    const newCollection: Collection = kbData || {
      collection_name: collectionName,
      created_at: new Date().toISOString()
    };
    setCollections(prev => {
      const updated = [...prev, newCollection];
      // Auto-select if it's the first collection
      if (prev.length === 0) {
        setSelectedCollection(collectionName);
      }
      return updated;
    });
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/v1/knowledge-bases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const kbs = data.data || [];
        const mappedCollections: Collection[] = kbs.map((kb: any) => ({
          _id: kb._id,
          collection_name: kb.collectionName,
          name: kb.name,
          created_at: kb.createdAt,
          userId: kb.userId
        }));
        setCollections(mappedCollections);
        
        // Auto-select first collection if available
        if (mappedCollections.length > 0) {
          setSelectedCollection(prev => prev || mappedCollections[0].collection_name);
        }
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  }, []);

  const deleteCollection = useCallback(async (kbId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/v1/knowledge-bases/${kbId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete knowledge base');
      }

      // Remove from local state
      setCollections(prev => prev.filter(c => c._id !== kbId));
      
      // Clear selection if the deleted collection was selected
      const deletedCollection = collections.find(c => c._id === kbId);
      if (deletedCollection && selectedCollection === deletedCollection.collection_name) {
        setSelectedCollection(null);
      }
    } catch (error: any) {
      console.error('Failed to delete knowledge base:', error);
      throw error;
    }
  }, [collections, selectedCollection]);

  const createNewThread = useCallback((collectionName: string): string => {
    const threadId = uuidv4();
    const newThread: ChatThread = {
      thread_id: threadId,
      collection_name: collectionName,
      messages: [],
      created_at: new Date()
    };
    
    setChatThreads(prev => new Map(prev).set(threadId, newThread));
    setCurrentThreadId(threadId);
    return threadId;
  }, []);

  const addMessageToThread = useCallback((threadId: string, message: ChatMessage) => {
    setChatThreads(prev => {
      const newMap = new Map(prev);
      const thread = newMap.get(threadId);
      if (thread) {
        thread.messages.push(message);
        newMap.set(threadId, thread);
      }
      return newMap;
    });
  }, []);

  const getChatThread = useCallback((threadId: string): ChatThread | undefined => {
    return chatThreads.get(threadId);
  }, [chatThreads]);

  return (
    <KnowledgeBaseContext.Provider
      value={{
        collections,
        addCollection,
        loadCollections,
        deleteCollection,
        selectedCollection,
        setSelectedCollection,
        chatThreads,
        currentThreadId,
        createNewThread,
        addMessageToThread,
        getChatThread,
        chatAgentPrompt,
        setChatAgentPrompt,
        voiceAgentPrompt,
        setVoiceAgentPrompt
      }}
    >
      {children}
    </KnowledgeBaseContext.Provider>
  );
}

export function useKnowledgeBase() {
  const context = useContext(KnowledgeBaseContext);
  if (context === undefined) {
    throw new Error('useKnowledgeBase must be used within a KnowledgeBaseProvider');
  }
  return context;
}

