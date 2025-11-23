"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, ChevronDown, ChevronUp, MessageSquarePlus } from 'lucide-react';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { pythonRagService } from '@/services/pythonRag.service';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from '@/lib/toast';

export function RAGChatInterface() {
  const {
    collections,
    selectedCollection,
    setSelectedCollection,
    currentThreadId,
    createNewThread,
    addMessageToThread,
    getChatThread,
    chatAgentPrompt
  } = useKnowledgeBase();

  const { data: apiKeys } = useApiKeys();
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showRetrievedDocs, setShowRetrievedDocs] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentThread = currentThreadId ? getChatThread(currentThreadId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  const handleSend = async () => {
    if (!query.trim() || !selectedCollection) return;

    // Create new thread if none exists
    let threadId = currentThreadId;
    if (!threadId || currentThread?.collection_name !== selectedCollection) {
      threadId = createNewThread(selectedCollection);
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: query,
      timestamp: new Date()
    };

    addMessageToThread(threadId, userMessage);
    const userQuery = query;
    setQuery('');
    setIsSending(true);

    try {
      // Check if API keys are configured
      if (!apiKeys || !apiKeys.apiKey) {
        toast.error('Please configure your API keys in Settings → API Keys');
        setIsSending(false);
        return;
      }

      // Construct system prompt
      const systemPrompt = `Knowledge base: ${selectedCollection}. Use documents from this collection to answer questions accurately.\n\n${chatAgentPrompt}`;

      const response = await pythonRagService.chat({
        query: userQuery,
        collection_name: selectedCollection,
        thread_id: threadId,
        system_prompt: systemPrompt,
        top_k: 5,
        provider: apiKeys.llmProvider,
        api_key: apiKeys.apiKey
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.answer,
        retrieved_docs: response.retrieved_docs,
        timestamp: new Date()
      };

      addMessageToThread(threadId, assistantMessage);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to get response from RAG service');
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Error: ${error.message}. Please check if the Python RAG service is running on http://localhost:8000`,
        timestamp: new Date()
      };
      addMessageToThread(threadId, errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    if (selectedCollection) {
      createNewThread(selectedCollection);
      toast.success('Started new chat session');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Collection Selection */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Knowledge Base
        </label>
        <div className="flex gap-3">
          <select
            value={selectedCollection || ''}
            onChange={(e) => setSelectedCollection(e.target.value || null)}
            className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">-- Select a collection --</option>
            {collections.map((collection) => (
              <option key={collection.collection_name} value={collection.collection_name}>
                {collection.collection_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleNewChat}
            disabled={!selectedCollection}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-accent text-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start new chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        {collections.length === 0 && (
          <p className="text-xs text-amber-500 mt-2">
            No collections available. Please create a knowledge base first.
          </p>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!currentThread || currentThread.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ready to Chat
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {selectedCollection
                  ? `Ask questions about your ${selectedCollection} knowledge base`
                  : 'Select a knowledge base collection to start chatting'}
              </p>
            </div>
          ) : (
            currentThread.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[70%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>

                  {/* Retrieved Documents */}
                  {message.retrieved_docs && message.retrieved_docs.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          setShowRetrievedDocs(
                            showRetrievedDocs === message.id ? null : message.id
                          )
                        }
                        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        {showRetrievedDocs === message.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        {message.retrieved_docs.length} source documents
                      </button>
                      {showRetrievedDocs === message.id && (
                        <div className="mt-2 space-y-2">
                          {message.retrieved_docs.map((doc, idx) => (
                            <div
                              key={idx}
                              className="bg-secondary border border-border rounded-lg p-3"
                            >
                              <p className="text-xs text-muted-foreground font-medium mb-1">
                                Source {idx + 1}
                              </p>
                              <p className="text-xs text-foreground">{doc}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                selectedCollection
                  ? 'Ask a question...'
                  : 'Select a collection first...'
              }
              disabled={!selectedCollection || isSending}
              className="flex-1 bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!query.trim() || !selectedCollection || isSending}
              className="px-6 py-3 bg-primary text-foreground rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

