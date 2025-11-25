"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { googleTranslate } from "@/lib/googleTranslate";

/**
 * AutoTranslate Component
 * Automatically translates all text content on the page using Google Translate API
 * Uses caching and batch translation for performance
 */
export function AutoTranslate() {
  const { language } = useLanguage();

  useEffect(() => {
    console.log('🌐 AutoTranslate: Language changed to:', language);
    
    if (language === "en") {
      console.log('⏩ AutoTranslate: Skipping - English selected');
      return; // No translation needed for English
    }

    console.log('🔄 AutoTranslate: Starting page translation...');

    // Keep track of already translated nodes
    const translatedNodes = new WeakSet<Node>();
    let isTranslating = false;

    const translatePage = async () => {
      if (isTranslating) {
        console.log('⏸️ Translation already in progress, skipping...');
        return;
      }

      isTranslating = true;

      // Find all text nodes that need translation
      const textNodes: { node: Text; originalText: string }[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip already translated nodes
            if (translatedNodes.has(node)) {
              return NodeFilter.FILTER_REJECT;
            }

            const text = node.textContent?.trim();
            if (!text) return NodeFilter.FILTER_REJECT;

            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;

            // Skip script, style, code, pre elements
            const tagName = parent.tagName.toLowerCase();
            if (
              tagName === "script" ||
              tagName === "style" ||
              tagName === "code" ||
              tagName === "pre" ||
              parent.hasAttribute("data-no-translate") ||
              parent.closest("[data-no-translate]")
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            // Skip if parent is contenteditable
            if (parent.isContentEditable) {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let node;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const originalText = textNode.textContent?.trim();
        if (originalText) {
          textNodes.push({ node: textNode, originalText });
        }
      }

      if (textNodes.length === 0) {
        console.log('⚠️ AutoTranslate: No new text nodes found to translate');
        isTranslating = false;
        return;
      }

      console.log(`📝 AutoTranslate: Found ${textNodes.length} text nodes to translate`);

      // Batch translate all texts
      const textsToTranslate = textNodes.map((item) => item.originalText);
      
      try {
        const translations = await googleTranslate.translateBatch(
          textsToTranslate,
          language
        );

        console.log(`✅ AutoTranslate: Received ${translations.length} translations`);

        // Apply translations
        let appliedCount = 0;
        textNodes.forEach((item, index) => {
          if (translations[index] && item.node.textContent) {
            // Preserve leading/trailing whitespace
            const leadingSpace = item.node.textContent.match(/^\s*/)?.[0] || "";
            const trailingSpace = item.node.textContent.match(/\s*$/)?.[0] || "";
            item.node.textContent = leadingSpace + translations[index] + trailingSpace;
            translatedNodes.add(item.node);
            appliedCount++;
          }
        });
        
        console.log(`🎉 AutoTranslate: Applied ${appliedCount} translations to page`);
      } catch (error) {
        console.error("❌ AutoTranslate: Translation failed:", error);
      }

      isTranslating = false;
    };

    // Initial translation after a delay
    const initialTimeout = setTimeout(translatePage, 500);

    // Watch for DOM changes and translate new content
    const observer = new MutationObserver((mutations) => {
      // Check if there are meaningful changes
      const hasTextChanges = mutations.some(mutation => {
        return mutation.type === 'childList' && mutation.addedNodes.length > 0;
      });

      if (hasTextChanges) {
        console.log('🔄 AutoTranslate: DOM changed, retranslating new content...');
        // Debounce translation to avoid too many calls
        setTimeout(translatePage, 200);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('👀 AutoTranslate: Watching for DOM changes...');

    return () => {
      clearTimeout(initialTimeout);
      observer.disconnect();
      console.log('🛑 AutoTranslate: Stopped watching');
    };
  }, [language]);

  return null;
}

