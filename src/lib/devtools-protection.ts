// Anti-DevTools Protection Script
// This script attempts to detect and discourage the use of browser DevTools

let devtoolsOpen = false;
let checkInterval: number | null = null;

// Method 1: Console Log Timing Detection
const detectDevToolsByTiming = () => {
  const threshold = 100;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;
  
  if (widthThreshold || heightThreshold) {
    return true;
  }
  return false;
};

// Method 2: debugger statement detection
const detectDevToolsByDebugger = () => {
  const start = performance.now();
  // @ts-ignore
  debugger;
  const end = performance.now();
  
  // If DevTools is open, the debugger statement will pause execution
  // causing a significant time difference
  return end - start > 100;
};

// Method 3: toString override detection
const detectDevToolsByToString = () => {
  const devtools = /./;
  devtools.toString = function() {
    devtoolsOpen = true;
    return 'DevTools detected';
  };
  console.log('%c', devtools);
};

// Actions when DevTools is detected
const onDevToolsOpen = () => {
  if (devtoolsOpen) return;
  
  devtoolsOpen = true;
  
  // Method 1: Redirect to blank page
  // window.location.href = 'about:blank';
  
  // Method 2: Show warning overlay
  showWarningOverlay();
  
  // Method 3: Clear page content
  // document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">Developer Tools Detected. Access Denied.</h1>';
  
  // Method 4: Infinite debugger loop (very aggressive)
  // setInterval(() => { debugger; }, 100);
};

const showWarningOverlay = () => {
  const overlay = document.createElement('div');
  overlay.id = 'devtools-warning-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  `;
  
  overlay.innerHTML = `
    <div style="
      text-align: center;
      color: #ef4444;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 40px;
      max-width: 600px;
    ">
      <svg style="width: 80px; height: 80px; margin: 0 auto 20px; fill: #ef4444;" viewBox="0 0 24 24">
        <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
      </svg>
      <h1 style="font-size: 32px; margin-bottom: 16px; font-weight: bold;">
        Developer Tools Detected
      </h1>
      <p style="font-size: 18px; color: #fca5a5; margin-bottom: 24px;">
        For security reasons, developer tools are not allowed on this site.
      </p>
      <p style="font-size: 14px; color: #9ca3af;">
        Please close the developer tools and refresh the page to continue.
      </p>
      <button onclick="window.location.reload()" style="
        margin-top: 24px;
        padding: 12px 24px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s;
      " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
        Reload Page
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
};

// Start monitoring
export const startDevToolsProtection = () => {
  // Disable right-click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
  
  // Disable common keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      onDevToolsOpen();
      return false;
    }
    
    // Ctrl+Shift+I / Cmd+Option+I (DevTools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      onDevToolsOpen();
      return false;
    }
    
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      onDevToolsOpen();
      return false;
    }
    
    // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      onDevToolsOpen();
      return false;
    }
    
    // Ctrl+U / Cmd+U (View Source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }
  });
  
  // Periodic detection checks
  checkInterval = window.setInterval(() => {
    // Check window size differences (not reliable but adds extra layer)
    if (detectDevToolsByTiming()) {
      onDevToolsOpen();
    }
    
    // toString detection
    detectDevToolsByToString();
  }, 1000);
  
  // Clear console periodically
  setInterval(() => {
    console.clear();
  }, 2000);
  
  // Override console methods to detect usage
  const noop = () => {};
  const disabledMethods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear'];
  
  // Note: Completely disabling console can break legitimate functionality
  // Use this cautiously or only in production
  if (import.meta.env.PROD) {
    disabledMethods.forEach(method => {
      (console as any)[method] = noop;
    });
  }
};

// Stop monitoring
export const stopDevToolsProtection = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

// Detect if DevTools is currently open
export const isDevToolsOpen = (): boolean => {
  return devtoolsOpen;
};

// Advanced: Code obfuscation helper (manual process recommended)
export const obfuscateString = (str: string): string => {
  return btoa(encodeURIComponent(str));
};

export const deobfuscateString = (str: string): string => {
  return decodeURIComponent(atob(str));
};
