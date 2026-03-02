/**
 * Aistein Chatbot Widget
 * 
 * CRITICAL: This widget MUST resolve widgetId correctly to prevent backend errors.
 * Backend expects: widgetId === MongoDB ObjectId (24 hex chars)
 */

(function() {
  'use strict';

  // ========== 1️⃣ SINGLE SOURCE OF TRUTH FOR widgetId ==========
  /**
   * Resolves widgetId with priority:
   * 1. window.Aistein.widgetId (from embed script config)
   * 2. URL path /widget/:widgetId
   * 
   * @returns {string|null} Resolved widgetId or null
   */
  function resolveWidgetId() {
    // Priority 1: embed script config
    if (window.Aistein && typeof window.Aistein.widgetId === 'string' && window.Aistein.widgetId.trim() !== '') {
      return window.Aistein.widgetId.trim();
    }

    // Priority 2: URL path (/widget/:widgetId)
    const match = window.location.pathname.match(/\/widget\/([^\/]+)/);
    if (match && match[1] && match[1] !== 'undefined') {
      return match[1];
    }

    return null;
  }

  // ========== 2️⃣ FAIL FAST — NO SILENT FALLBACKS ==========
  const widgetId = resolveWidgetId();

  if (!widgetId) {
    console.error('[Aistein Widget] ❌ widgetId could not be resolved');
    console.error('[Aistein Widget] pathname:', window.location.pathname);
    console.error('[Aistein Widget] Aistein config:', window.Aistein);
    throw new Error('Widget ID is required but was not found. Please ensure the widget is configured correctly.');
  }

  // ========== 4️⃣ TEMPORARY DEBUG LOG ==========
  console.log('[Aistein Widget] ✅ Resolved widgetId:', widgetId);
  console.log('[Aistein Widget] URL:', window.location.href);

  // ========== WIDGET CONFIGURATION ==========
  const config = window.Aistein || {};
  
  // ========== API URL RESOLUTION (CRITICAL: Use absolute URL, not window.location.origin) ==========
  /**
   * Resolves API base URL with priority:
   * 1. config.apiUrl (explicit override from embed script)
   * 2. Derive from script source URL (if loaded from app.aistein.it)
   * 3. Default to https://app.aistein.it/api/v1 (production)
   * 4. Localhost fallback for development
   * 
   * CRITICAL: Never use window.location.origin as it will point to the embedding website,
   * not the API server. This ensures API calls always go to app.aistein.it regardless
   * of where the widget is embedded.
   */
  function resolveApiUrl() {
    // Priority 1: Explicit config override
    if (config.apiUrl && typeof config.apiUrl === 'string' && config.apiUrl.trim() !== '') {
      return config.apiUrl.trim();
    }
    
    // // Priority 2: Derive from script source URL
    // const scripts = document.getElementsByTagName('script');
    // for (let i = 0; i < scripts.length; i++) {
    //   const scriptSrc = scripts[i].src;
    //   if (scriptSrc && scriptSrc.includes('widget.js')) {
    //     try {
    //       const scriptUrl = new URL(scriptSrc);
    //       // If script is loaded from app.aistein.it, use that domain
    //       if (scriptUrl.hostname === 'app.aistein.it' || scriptUrl.hostname.includes('aistein.it')) {
    //         return scriptUrl.origin + '/api/v1';
    //       }
    //     } catch (e) {
    //       // Invalid URL, continue to next priority
    //     }
    //   }
    // }
    
    // Priority 3: Default production API URL
    // CRITICAL: This is the absolute URL that must be used for all embedded widgets
    const DEFAULT_API_BASE = 'https://aisteinai-backend-2026.onrender.com/api/v1';
    
    // Priority 4: Localhost fallback for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001/api/v1';
    }
    
    return DEFAULT_API_BASE;
  }
  
  const API_URL = resolveApiUrl();
  console.log('[Aistein Widget] ✅ Resolved API URL:', API_URL);
  
  const position = config.position || 'bottom-right';
  const primaryColor = config.primaryColor || '#6366f1';
  const knowledgeBaseId = config.knowledgeBaseId || config.collection || null;

  // ========== WIDGET STATE ==========
  let isOpen = false;
  let isMinimized = false;
  let messages = [];
  let threadId = generateThreadId();
  let userName = null;
  let isAskingName = true;

  // ========== UTILITY FUNCTIONS ==========
  function generateThreadId() {
    return 'thread_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  // ========== 3️⃣ API CALLS (USING RESOLVED widgetId) ==========
  async function sendMessage(query) {
    try {
      const requestBody = {
        query: query,
        threadId: threadId
      };
      
      // Use knowledgeBaseId if provided (preferred), fallback to collection for backward compatibility
      if (knowledgeBaseId) {
        requestBody.knowledgeBaseId = knowledgeBaseId;
      }
      
      const response = await fetch(`${API_URL}/chatbot/widget/${widgetId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'Failed to get response');
      }

      const data = await response.json();
      return data.data?.answer || data.answer || "I'm having trouble connecting right now. Please try again later.";
    } catch (error) {
      console.error('[Aistein Widget] API error:', error);
      throw error;
    }
  }

  async function saveConversation(name, userMessage, botMessage) {
    try {
      await fetch(`${API_URL}/conversations/widget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          widgetId: widgetId,
          name: name,
          threadId: threadId,
          messages: [
            { role: 'user', content: userMessage, timestamp: new Date() },
            { role: 'assistant', content: botMessage, timestamp: new Date() }
          ]
        })
      });
    } catch (error) {
      console.error('[Aistein Widget] Failed to save conversation:', error);
    }
  }

  // ========== WIDGET UI ==========
  function createWidget() {
    // Container
    const container = createElement('div', 'aistein-widget-container');
    container.style.cssText = `
      position: fixed;
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;

    // Chat window
    const chatWindow = createElement('div', 'aistein-widget-window');
    chatWindow.style.cssText = `
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: transform 0.3s ease;
      ${isMinimized ? 'transform: translateY(calc(100% - 60px));' : ''}
    `;

    // Header
    const header = createElement('div', 'aistein-widget-header');
    header.style.cssText = `
      background: ${primaryColor};
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    `;
    header.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 16px;">AI Assistant</div>
        <div style="font-size: 12px; opacity: 0.9;">Online</div>
      </div>
      <button id="aistein-toggle" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">−</button>
    `;

    // Messages container
    const messagesContainer = createElement('div', 'aistein-widget-messages');
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f5f5f5;
    `;

    // Input area
    const inputArea = createElement('div', 'aistein-widget-input-area');
    inputArea.style.cssText = `
      padding: 16px;
      background: white;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    `;

    const input = createElement('input', 'aistein-widget-input');
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.cssText = `
      flex: 1;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    `;

    const sendButton = createElement('button', 'aistein-widget-send');
    sendButton.textContent = 'Send';
    sendButton.style.cssText = `
      padding: 12px 20px;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    `;

    // Toggle button (floating)
    const toggleButton = createElement('button', 'aistein-widget-toggle');
    toggleButton.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      font-size: 24px;
      display: ${isOpen ? 'none' : 'flex'};
      align-items: center;
      justify-content: center;
      position: fixed;
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      z-index: 10000;
    `;

  toggleButton.innerHTML = `
<svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15a4 4 0 0 1-4 4H8l-4 4V5a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v10z"/>
</svg>
`;

    // Assemble
    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputArea);
    container.appendChild(chatWindow);
    document.body.appendChild(toggleButton);

    // Event listeners
    header.addEventListener('click', () => {
      isMinimized = !isMinimized;
      chatWindow.style.transform = isMinimized ? 'translateY(calc(100% - 60px))' : 'translateY(0)';
      document.getElementById('aistein-toggle').textContent = isMinimized ? '+' : '−';
    });

    toggleButton.addEventListener('click', () => {
      isOpen = true;
      toggleButton.style.display = 'none';
      document.body.appendChild(container);
    });

    sendButton.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    async function handleSend() {
      const query = input.value.trim();
      if (!query) return;

      // Add user message
      addMessage('user', query);
      input.value = '';

      // Handle name collection
      if (isAskingName) {
        userName = query;
        isAskingName = false;
        addMessage('bot', `Nice to meet you, ${userName}! How can I help you today?`);
        return;
      }

      // Show loading
      const loadingId = addMessage('bot', 'Thinking...');

      try {
        const response = await sendMessage(query);
        updateMessage(loadingId, response);

        // Save conversation
        if (userName) {
          await saveConversation(userName, query, response);
        }
      } catch (error) {
        updateMessage(loadingId, 'Sorry, I encountered an error. Please try again.');
        console.error('[Aistein Widget] Error:', error);
      }
    }

    function addMessage(role, content) {
      const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const messageEl = createElement('div', 'aistein-widget-message');
      messageEl.id = messageId;
      messageEl.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      `;

      const bubble = createElement('div', 'aistein-widget-bubble');
      bubble.style.cssText = `
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
        ${role === 'user' 
          ? `background: ${primaryColor}; color: white; border-bottom-right-radius: 4px;` 
          : 'background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);'}
      `;
      bubble.textContent = content;

      messageEl.appendChild(bubble);
      messagesContainer.appendChild(messageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      messages.push({ id: messageId, role, content });
      return messageId;
    }

    function updateMessage(messageId, content) {
      const messageEl = document.getElementById(messageId);
      if (messageEl) {
        const bubble = messageEl.querySelector('.aistein-widget-bubble');
        if (bubble) bubble.textContent = content;
      }
    }

    // Initial welcome message
    if (isAskingName) {
      addMessage('bot', '👋 Hello! Before we start, may I know your name?');
    }
  }

  // ========== INITIALIZE ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();

