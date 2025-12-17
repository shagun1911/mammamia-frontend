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
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]); // Multiple KB selection
  const [showKBDropdown, setShowKBDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentThread = currentThreadId ? getChatThread(currentThreadId) : null;

  // Sync with single selection for backward compatibility
  useEffect(() => {
    if (selectedCollection && !selectedCollections.includes(selectedCollection)) {
      setSelectedCollections([selectedCollection]);
    }
  }, [selectedCollection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  const handleSend = async () => {
    if (!query.trim() || selectedCollections.length === 0) {
      toast.error('Please select at least one knowledge base');
      return;
    }

    console.log('🤖 [RAG Chat] Starting conversation...');
    console.log('📋 [RAG Chat] Collections:', selectedCollections);
    console.log('💬 [RAG Chat] Query:', query);

    // Create new thread if none exists - use first collection for thread naming
    let threadId = currentThreadId;
    const mainCollection = selectedCollections[0];
    if (!threadId || currentThread?.collection_name !== mainCollection) {
      threadId = createNewThread(mainCollection);
      console.log('🆕 [RAG Chat] Created new thread:', threadId);
    } else {
      console.log('🔄 [RAG Chat] Using existing thread:', threadId);
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
      console.log('🔑 [RAG Chat] Checking API keys...');
      if (!apiKeys || !apiKeys.apiKey) {
        console.error('❌ [RAG Chat] API keys not configured!');
        toast.error('Please configure your API keys in Settings → API Keys');
        setIsSending(false);
        return;
      }
      console.log('✅ [RAG Chat] API keys found:', {
        provider: apiKeys.llmProvider,
        apiKeyLength: apiKeys.apiKey?.length || 0,
        apiKeyPrefix: apiKeys.apiKey?.substring(0, 8) + '...'
      });

      // Construct system prompt
      const systemPrompt = `Knowledge bases: ${selectedCollections.join(', ')}. Use documents from these collections to answer questions accurately.\n\n${chatAgentPrompt}`;
      console.log('📝 [RAG Chat] System prompt length:', systemPrompt.length);

      console.log('🚀 [RAG Chat] Sending request to Python RAG service...');
      const response = await pythonRagService.chat({
        query: userQuery,
        collection_names: selectedCollections, // Updated to support multiple collections
        thread_id: threadId,
        system_prompt: systemPrompt,
        top_k: 5,
        provider: apiKeys.llmProvider,
        api_key: apiKeys.apiKey
      });

      console.log('✅ [RAG Chat] Received response:', {
        answerLength: response.answer?.length || 0,
        retrievedDocs: response.retrieved_docs?.length || 0,
        threadId: response.thread_id
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.answer,
        retrieved_docs: response.retrieved_docs,
        timestamp: new Date()
      };

      addMessageToThread(threadId, assistantMessage);
      console.log('💾 [RAG Chat] Message added to thread');
    } catch (error: any) {
      console.error('❌ [RAG Chat] Error occurred:', error);
      console.error('📊 [RAG Chat] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.message || 'Failed to get response from RAG service');
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Error: ${error.message}. Please check if the Python RAG service is running.`,
        timestamp: new Date()
      };
      addMessageToThread(threadId, errorMessage);
    } finally {
      setIsSending(false);
      console.log('🏁 [RAG Chat] Conversation handler completed');
    }
  };

  const handleNewChat = () => {
    if (selectedCollections.length > 0) {
      createNewThread(selectedCollections[0]);
      toast.success('Started new chat session');
    }
  };

  const toggleCollection = (collectionName: string) => {
    setSelectedCollections(prev => {
      if (prev.includes(collectionName)) {
        return prev.filter(c => c !== collectionName);
      } else {
        return [...prev, collectionName];
      }
    });
  };

  const selectAllCollections = () => {
    const allCollectionNames = Object.keys(collections);
    setSelectedCollections(allCollectionNames);
  };

  const clearAllSelections = () => {
    setSelectedCollections([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Multiple Collection Selection */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            Select Knowledge Bases ({selectedCollections.length} selected)
          </label>
          <div className="flex gap-2">
            <button
              onClick={selectAllCollections}
              className="text-xs text-primary hover:underline"
            >
              Select All
            </button>
            <button
              onClick={clearAllSelections}
              className="text-xs text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowKBDropdown(!showKBDropdown)}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-left text-foreground focus:outline-none focus:border-primary transition-colors flex items-center justify-between"
          >
            <span className="truncate">
              {selectedCollections.length === 0 
                ? 'Select knowledge bases...'
                : selectedCollections.length === 1
                ? selectedCollections[0]
                : `${selectedCollections.length} knowledge bases selected`
              }
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showKBDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showKBDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-secondary border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {collections.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No knowledge bases available. Create one first.
                </div>
              ) : (
                collections.map((collection) => (
                  <label
                    key={collection.collection_name}
                    className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.collection_name)}
                      onChange={() => toggleCollection(collection.collection_name)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <span className="text-sm text-foreground">
                      {collection.collection_name}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleNewChat}
            disabled={selectedCollections.length === 0}
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
                {selectedCollections.length > 0
                  ? `Ask questions across ${selectedCollections.length} selected knowledge base${selectedCollections.length > 1 ? 's' : ''}`
                  : 'Select one or more knowledge bases to start chatting'}
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
                selectedCollections.length > 0
                  ? 'Ask a question...'
                  : 'Select knowledge bases first...'
              }
              disabled={selectedCollections.length === 0 || isSending}
              className="flex-1 bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!query.trim() || selectedCollections.length === 0 || isSending}
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

