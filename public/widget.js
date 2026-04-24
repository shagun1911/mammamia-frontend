/**
 * mammam-ia Chatbot Widget
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
    console.warn('[mammam-ia Widget] Widget already loaded.');
    return;
  }
  window.AISTEIN_WIDGET_LOADED = true;

  // ========== 1️⃣ SINGLE SOURCE OF TRUTH FOR widgetId ==========
  /**
   * Resolves widgetId with priority:
   * 1. window.mammamIa.widgetId (from embed script config)
   * 2. window.Aistein.widgetId (legacy compatibility)
   * 3. URL path /widget/:widgetId
   * 
   * @returns {string|null} Resolved widgetId or null
   */
  function resolveWidgetId() {
    // Priority 1: embed script config
    if (window.mammamIa && typeof window.mammamIa.widgetId === 'string' && window.mammamIa.widgetId.trim() !== '') {
      return window.mammamIa.widgetId.trim();
    }

    // Legacy config support
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
    console.error('[mammam-ia Widget] ❌ widgetId could not be resolved');
    console.error('[mammam-ia Widget] pathname:', window.location.pathname);
    console.error('[mammam-ia Widget] mammamIa config:', window.mammamIa);
    console.error('[mammam-ia Widget] legacy Aistein config:', window.Aistein);
    throw new Error('Widget ID is required but was not found. Please ensure the widget is configured correctly.');
  }

  console.log('[mammam-ia Widget] ✅ Resolved widgetId:', widgetId);
  console.log('[mammam-ia Widget] URL:', window.location.href);

  // ========== WIDGET CONFIGURATION ==========
  const config = window.mammamIa || window.Aistein || {};
  
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
  console.log('[mammam-ia Widget] ✅ Resolved Frontend URL:', FRONTEND_URL);

  // ========== WIDGET STATE ==========
  let isOpen = false;
  let position = config.position || 'bottom-right';
  let primaryColor = config.primaryColor || '#4F7DF3';
  let clientLogoUrl = config.logoUrl || config.clientLogo || null;

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
    if (typeof config.visitorName === 'string' && config.visitorName.trim() !== '') {
      params.push(`visitorName=${encodeURIComponent(config.visitorName.trim())}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return url;
  }

  // ========== WIDGET UI (IFRAME-BASED) ==========
  function createWidget() {
    const widgetUrl = buildWidgetUrl();
    console.log('[mammam-ia Widget] Loading widget from:', widgetUrl);

    // Container for iframe
    const container = createElement('div', 'aistein-widget-container');
    container.style.cssText = `
      position: fixed;
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      z-index: 9999;
      background: transparent;
      border: none;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      padding: 0;
      transition: transform 0.25s ease, opacity 0.25s ease;
    `;

    // Create iframe with responsive sizing
    const width = config.width || 400;
    const height = config.height || 600;
    const iframe = createElement('iframe', 'aistein-widget-iframe');
    iframe.src = widgetUrl;
    iframe.style.cssText = `
  display: block;
  width: min(${width}px, 95vw);
  height: min(${height}px, 85vh);
  border: none;
  background: transparent;
`;
    iframe.setAttribute('allow', 'microphone');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');

    // Floating bubble button - shown when widget is closed
    const toggleButton = createElement('button', 'aistein-widget-toggle');
    toggleButton.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
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

    // Add client logo or default message icon
    if (clientLogoUrl) {
      const logoImg = createElement('img', 'aistein-widget-logo');
      logoImg.src = clientLogoUrl;
      logoImg.style.cssText = 'width: 28px; height: 28px; object-fit: contain;';
      logoImg.alt = 'Chat';
      toggleButton.appendChild(logoImg);
    } else {
      // Default message icon SVG
      toggleButton.innerHTML = `
<svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15a4 4 0 0 1-4 4H8l-4 4V5a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v10z"/>
</svg>
`;
    }

    // Assemble container (only iframe, no overlay buttons)
    container.appendChild(iframe);
    
    // Add toggle button to DOM
    document.body.appendChild(toggleButton);

    // Event listener: Open widget when bubble is clicked
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

    // Listen for close message from iframe
    window.addEventListener('message', function(event) {
      // Security: Only accept messages from the frontend URL origin
      try {
        const frontendOrigin = new URL(FRONTEND_URL).origin;
        if (event.origin !== frontendOrigin) {
          return;
        }
      } catch (e) {
        // Invalid URL, reject message
        return;
      }
      
      if (event.data === 'AISTEIN_WIDGET_CLOSE') {
        container.remove();
        toggleButton.style.display = 'flex';
        isOpen = false;
      }
    });
  }

  // ========== INITIALIZE ==========
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();