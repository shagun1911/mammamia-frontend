/**
 * Aistein Chatbot Widget
 * 
 * This widget loads the platform widget UI via iframe to ensure consistent
 * styling and behavior across all embedding environments.
 * 
 * CRITICAL: This widget MUST resolve widgetId correctly to prevent backend errors.
 * Backend expects: widgetId === MongoDB ObjectId (24 hex chars)
 */

(function() {
  'use strict';

  // ========== PREVENT MULTIPLE WIDGET LOADS ==========
  if (window.AISTEIN_WIDGET_LOADED) {
    console.warn('[Aistein Widget] Widget already loaded.');
    return;
  }
  window.AISTEIN_WIDGET_LOADED = true;

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

  console.log('[Aistein Widget] ✅ Resolved widgetId:', widgetId);
  console.log('[Aistein Widget] URL:', window.location.href);

  // ========== WIDGET CONFIGURATION ==========
  const config = window.Aistein || {};
  
  // ========== FRONTEND URL RESOLUTION ==========
  /**
   * Resolves frontend base URL (where the widget page is hosted) with priority:
   * 1. config.frontendUrl (explicit override from embed script)
   * 2. Derive from script source URL (if loaded from app.aistein.it)
   * 3. Default to https://app.aistein.it (production)
   * 4. Localhost fallback for development
   */
  function resolveFrontendUrl() {
    // Priority 1: Explicit config override
    if (config.frontendUrl && typeof config.frontendUrl === 'string' && config.frontendUrl.trim() !== '') {
      return config.frontendUrl.trim().replace(/\/$/, ''); // Remove trailing slash
    }
    
    // Priority 2: Derive from script source URL
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const scriptSrc = scripts[i].src;
      if (scriptSrc && scriptSrc.includes('widget.js')) {
        try {
          const scriptUrl = new URL(scriptSrc);
          // If script is loaded from app.aistein.it, use that domain
          if (scriptUrl.hostname === 'app.aistein.it' || scriptUrl.hostname.includes('aistein.it')) {
            return scriptUrl.origin;
          }
        } catch (e) {
          // Invalid URL, continue to next priority
        }
      }
    }
    
    // Priority 3: Default production frontend URL
    const DEFAULT_FRONTEND_URL = 'https://app.aistein.it';
    
    // Priority 4: Localhost fallback for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    return DEFAULT_FRONTEND_URL;
  }
  
  const FRONTEND_URL = resolveFrontendUrl();
  console.log('[Aistein Widget] ✅ Resolved Frontend URL:', FRONTEND_URL);

  // ========== WIDGET STATE ==========
  let isOpen = false;
  let isMinimized = false;
  let position = config.position || 'bottom-right';
  let primaryColor = config.primaryColor || '#6366f1';

  // ========== UTILITY FUNCTIONS ==========
  function createElement(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  // ========== BUILD WIDGET URL ==========
  function buildWidgetUrl() {
    let url = `${FRONTEND_URL}/widget/${widgetId}`;
    const params = [];
    
    // Add collection/knowledgeBaseId if provided
    const knowledgeBaseIds = Array.isArray(config.knowledgeBaseId)
      ? config.knowledgeBaseId
      : config.knowledgeBaseId
      ? [config.knowledgeBaseId]
      : config.collection
      ? [config.collection]
      : [];
    
    if (knowledgeBaseIds.length > 0) {
      // Use first knowledge base ID (platform widget supports single collection via URL param)
      params.push(`collection=${encodeURIComponent(knowledgeBaseIds[0])}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return url;
  }

  // ========== WIDGET UI (IFRAME-BASED) ==========
  function createWidget() {
    const widgetUrl = buildWidgetUrl();
    console.log('[Aistein Widget] Loading widget from:', widgetUrl);

    // Container for iframe
    const container = createElement('div', 'aistein-widget-container');
    container.style.cssText = `
      position: fixed;
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      z-index: 9999;
      transition: transform 0.25s ease, opacity 0.25s ease;
      ${isMinimized ? 'transform: translateY(calc(100% - 60px)); opacity: 0; pointer-events: none;' : 'transform: translateY(0); opacity: 1;'}
    `;

    // Create iframe with responsive sizing
    const width = config.width || 400;
    const height = config.height || 600;
    const iframe = createElement('iframe', 'aistein-widget-iframe');
    iframe.src = widgetUrl;
    iframe.style.cssText = `
      width: min(${width}px, 95vw);
      height: min(${height}px, 85vh);
      border: none;
      border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.25);
      background: transparent;
    `;
    iframe.setAttribute('allow', 'microphone');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');

    // Toggle button (floating) - shown when widget is closed
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
      display: ${isOpen ? 'none' : 'flex'};
      align-items: center;
      justify-content: center;
      position: fixed;
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      z-index: 10000;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;
    toggleButton.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });
    toggleButton.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    toggleButton.innerHTML = `
<svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15a4 4 0 0 1-4 4H8l-4 4V5a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v10z"/>
</svg>
`;

    // Minimize button (overlay on iframe) - shown when widget is open
    const minimizeButton = createElement('button', 'aistein-widget-minimize');
    minimizeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      transition: background 0.2s ease;
      font-size: 18px;
      font-weight: bold;
    `;
    minimizeButton.textContent = '−';
    minimizeButton.addEventListener('mouseenter', function() {
      this.style.background = 'rgba(0, 0, 0, 0.5)';
    });
    minimizeButton.addEventListener('mouseleave', function() {
      this.style.background = 'rgba(0, 0, 0, 0.3)';
    });

    // Close button (overlay on iframe) - shown when widget is open
    const closeButton = createElement('button', 'aistein-widget-close');
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 48px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      transition: background 0.2s ease;
      font-size: 18px;
      font-weight: bold;
    `;
    closeButton.innerHTML = '×';
    closeButton.addEventListener('mouseenter', function() {
      this.style.background = 'rgba(0, 0, 0, 0.5)';
    });
    closeButton.addEventListener('mouseleave', function() {
      this.style.background = 'rgba(0, 0, 0, 0.3)';
    });

    // Assemble container
    container.appendChild(iframe);
    container.appendChild(minimizeButton);
    container.appendChild(closeButton);
    
    // Add to DOM
    document.body.appendChild(toggleButton);

    // Event listeners
    toggleButton.addEventListener('click', function() {
      isOpen = true;
      toggleButton.style.display = 'none';
      
      // Add smooth open animation
      container.style.transform = 'translateY(20px)';
      container.style.opacity = '0';
      document.body.appendChild(container);
      
      setTimeout(() => {
        container.style.transform = 'translateY(0)';
        container.style.opacity = '1';
      }, 10);
    });

    minimizeButton.addEventListener('click', function() {
      isMinimized = !isMinimized;
      container.style.transform = isMinimized 
        ? 'translateY(calc(100% - 60px))' 
        : 'translateY(0)';
      container.style.opacity = isMinimized ? '0' : '1';
      container.style.pointerEvents = isMinimized ? 'none' : 'auto';
    });

    closeButton.addEventListener('click', function() {
      isOpen = false;
      isMinimized = false;
      container.remove();
      toggleButton.style.display = 'flex';
    });

    // Initialize: Show toggle button initially (widget starts closed)
    // Widget will be opened when user clicks the toggle button
  }

  // ========== INITIALIZE ==========
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();
