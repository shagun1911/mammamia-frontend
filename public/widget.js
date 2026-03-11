(function () {
  "use strict";

  if (window.AISTEIN_WIDGET_LOADED) return;
  window.AISTEIN_WIDGET_LOADED = true;

  const config = window.Aistein || {};
  const widgetId = config.widgetId;

  if (!widgetId) {
    console.error("[Aistein] widgetId missing");
    return;
  }

  const API_URL =
    config.apiUrl || "https://aisteinai-backend-2026.onrender.com/api/v1";

  const KB_IDS = Array.isArray(config.knowledgeBaseId)
    ? config.knowledgeBaseId
    : config.knowledgeBaseId
    ? [config.knowledgeBaseId]
    : [];

  const primaryColor = config.primaryColor || "#6366f1";
  const position = config.position || "bottom-right";

  let threadId = "thread_" + Date.now();
  let isOpen = false;

  function el(tag) {
    return document.createElement(tag);
  }

  async function sendMessage(query) {
    const body = { query, threadId };

    if (KB_IDS.length) body.knowledgeBaseId = KB_IDS;

    const res = await fetch(`${API_URL}/chatbot/widget/${widgetId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.data?.answer || "Error getting response.";
  }

  function createWidget() {
    const container = el("div");
    container.style.cssText = `
      position:fixed;
      ${position.includes("right") ? "right:24px" : "left:24px"};
      ${position.includes("bottom") ? "bottom:24px" : "top:24px"};
      z-index:2147483647;
      font-family:Arial, sans-serif;
    `;

    const windowBox = el("div");
    windowBox.style.cssText = `
      width:360px;
      height:520px;
      background:white;
      border-radius:16px;
      box-shadow:0 10px 40px rgba(0,0,0,.25);
      display:flex;
      flex-direction:column;
      overflow:hidden;
      margin-bottom:12px;
    `;

    const header = el("div");
    header.style.cssText = `
      background:${primaryColor};
      color:white;
      padding:14px;
      font-weight:600;
      display:flex;
      justify-content:space-between;
      align-items:center;
    `;
    header.innerText = "AI Assistant";

    const messages = el("div");
    messages.style.cssText = `
      flex:1;
      padding:12px;
      overflow-y:auto;
      background:#f5f5f5;
    `;

    const inputWrap = el("div");
    inputWrap.style.cssText = `
      display:flex;
      padding:10px;
      gap:6px;
      border-top:1px solid #eee;
    `;

    const input = el("input");
    input.placeholder = "Type message...";
    input.style.cssText = `
      flex:1;
      padding:10px;
      border:1px solid #ddd;
      border-radius:8px;
      outline:none;
    `;

    const sendBtn = el("button");
    sendBtn.innerText = "Send";
    sendBtn.style.cssText = `
      background:${primaryColor};
      color:white;
      border:none;
      padding:10px 14px;
      border-radius:8px;
      cursor:pointer;
    `;

    function addMsg(text, user) {
      const row = el("div");
      row.style.cssText = `
        margin-bottom:10px;
        display:flex;
        ${user ? "justify-content:flex-end;" : ""}
      `;

      const bubble = el("div");
      bubble.style.cssText = `
        padding:10px 14px;
        border-radius:12px;
        max-width:75%;
        font-size:14px;
        ${
          user
            ? `background:${primaryColor};color:white`
            : "background:white;border:1px solid #eee"
        }
      `;

      bubble.innerText = text;
      row.appendChild(bubble);
      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
    }

    async function handleSend() {
      const text = input.value.trim();
      if (!text) return;

      addMsg(text, true);
      input.value = "";

      const loading = el("div");
      loading.innerText = "Thinking...";
      messages.appendChild(loading);

      try {
        const reply = await sendMessage(text);
        messages.removeChild(loading);
        addMsg(reply, false);
      } catch {
        messages.removeChild(loading);
        addMsg("Error contacting server.", false);
      }
    }

    sendBtn.onclick = handleSend;
    input.onkeypress = (e) => e.key === "Enter" && handleSend();

    inputWrap.appendChild(input);
    inputWrap.appendChild(sendBtn);

    windowBox.appendChild(header);
    windowBox.appendChild(messages);
    windowBox.appendChild(inputWrap);

    const bubble = el("button");

    bubble.style.cssText = `
      width:60px;
      height:60px;
      border-radius:50%;
      background:${primaryColor};
      border:none;
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      box-shadow:0 5px 20px rgba(0,0,0,.3);
      z-index:2147483647;
    `;

    if (config.logoUrl) {
      const img = el("img");
      img.src = config.logoUrl;
      img.style.width = "28px";
      img.style.height = "28px";
      img.style.objectFit = "contain";
      bubble.appendChild(img);
    } else {
      bubble.innerHTML = "💬";
    }

    bubble.onclick = () => {
      if (!isOpen) {
        container.appendChild(windowBox);
        bubble.style.display = "none";
        isOpen = true;
      }
    };

    document.body.appendChild(container);
    document.body.appendChild(bubble);

    addMsg("👋 Hello! How can I help you today?");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();