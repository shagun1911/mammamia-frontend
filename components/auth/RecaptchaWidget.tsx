'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          theme: 'light' | 'dark';
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    __recaptchaScriptPromise?: Promise<void>;
  }
}

interface RecaptchaWidgetProps {
  onTokenChange: (token: string | null) => void;
}

function loadRecaptchaScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (window.__recaptchaScriptPromise) {
    return window.__recaptchaScriptPromise;
  }

  window.__recaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    const candidateUrls = [
      'https://www.google.com/recaptcha/api.js?render=explicit',
      'https://www.recaptcha.net/recaptcha/api.js?render=explicit'
    ];
    let index = 0;

    const tryNext = () => {
      if (index >= candidateUrls.length) {
        reject(new Error('Failed to load captcha script'));
        return;
      }

      const script = document.createElement('script');
      script.src = candidateUrls[index];
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        index += 1;
        tryNext();
      };
      document.head.appendChild(script);
    };

    tryNext();
  });

  return window.__recaptchaScriptPromise.catch((error) => {
    // Allow retry if script loading failed for transient/network blockers.
    window.__recaptchaScriptPromise = undefined;
    throw error;
  });
}

function waitForRecaptchaReady(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const tick = () => {
      if (window.grecaptcha?.render) {
        resolve();
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        reject(new Error('Captcha runtime unavailable'));
        return;
      }

      setTimeout(tick, 100);
    };

    tick();
  });
}

export function RecaptchaWidget({ onTokenChange }: RecaptchaWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    let isMounted = true;

    const renderCaptcha = async () => {
      try {
        setLoadError(null);
        await loadRecaptchaScript();
        await waitForRecaptchaReady();

        if (!isMounted || !containerRef.current || !window.grecaptcha) {
          return;
        }

        window.grecaptcha.ready(() => {
          if (!isMounted || !containerRef.current || !window.grecaptcha) {
            return;
          }

          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onTokenChange(token),
            'expired-callback': () => onTokenChange(null),
            'error-callback': () => onTokenChange(null),
            theme: 'light'
          });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (message.includes('invalid site key') || message.includes('site key')) {
          setLoadError('Captcha site key is invalid for this domain. Please update NEXT_PUBLIC_RECAPTCHA_SITE_KEY.');
          return;
        }
        setLoadError('Unable to load captcha. Disable blockers/VPN and try again.');
      }
    };

    renderCaptcha();

    return () => {
      isMounted = false;
      if (window.grecaptcha && widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    return <p className="text-sm text-destructive">Captcha is not configured. Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY.</p>;
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  return <div ref={containerRef} className="min-h-[78px]" />;
}
