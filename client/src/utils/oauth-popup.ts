// Utility for handling OAuth popup authentication
// This avoids iframe restrictions by opening OAuth in a popup window

export interface PopupOAuthOptions {
  url: string;
  windowName?: string;
  windowFeatures?: string;
  timeout?: number;
}

export interface PopupOAuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const openOAuthPopup = (options: PopupOAuthOptions): Promise<PopupOAuthResult> => {
  const {
    url,
    windowName = 'oauth-popup',
    windowFeatures = 'width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no',
    timeout = 300000 // 5 minutes
  } = options;

  return new Promise((resolve) => {
    // Open popup window
    const popup = window.open(url, windowName, windowFeatures);

    if (!popup) {
      resolve({
        success: false,
        error: 'Popup blocked. Please allow popups for this site and try again.'
      });
      return;
    }

    // Center the popup window
    const screenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const screenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
    const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const height = window.innerHeight || document.documentElement.clientHeight || screen.height;
    const left = (width / 2) - (500 / 2) + screenLeft;
    const top = (height / 2) - (600 / 2) + screenTop;
    
    popup.moveTo(left, top);
    popup.focus();

    // Listen for popup events
    const checkClosed = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkClosed);
          clearTimeout(timeoutId);
          resolve({
            success: false,
            error: 'Authentication window was closed'
          });
        }

        // Try to access popup location to detect redirect
        if (popup.location.href && popup.location.origin === window.location.origin) {
          // We're back to our domain, authentication might be complete
          clearInterval(checkClosed);
          clearTimeout(timeoutId);
          popup.close();
          resolve({
            success: true,
            data: { redirected: true }
          });
        }
      } catch (e) {
        // Cross-origin error is expected during OAuth flow
        // This means we're still on the OAuth provider's domain
      }
    }, 1000);

    // Set timeout
    const timeoutId = setTimeout(() => {
      clearInterval(checkClosed);
      if (!popup.closed) {
        popup.close();
      }
      resolve({
        success: false,
        error: 'Authentication timed out. Please try again.'
      });
    }, timeout);

    // Listen for messages from popup (if the OAuth provider supports postMessage)
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'oauth-success') {
        clearInterval(checkClosed);
        clearTimeout(timeoutId);
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve({
          success: true,
          data: event.data.payload
        });
      } else if (event.data.type === 'oauth-error') {
        clearInterval(checkClosed);
        clearTimeout(timeoutId);
        window.removeEventListener('message', messageListener);
        popup.close();
        resolve({
          success: false,
          error: event.data.error || 'Authentication failed'
        });
      }
    };

    window.addEventListener('message', messageListener);
  });
};

// Alternative approach using a more modern Promise-based popup handler
export const handleOAuthPopup = async (oauthUrl: string): Promise<any> => {
  // Check if we're in an iframe
  const isInIframe = window !== window.top;
  
  if (isInIframe) {
    // If in iframe, we need to open in the parent window
    try {
      window.top?.open(oauthUrl, '_blank');
      throw new Error('Please complete authentication in the new tab and return to this page');
    } catch (e) {
      // Fallback to current window
      window.location.href = oauthUrl;
      return;
    }
  }

  // Not in iframe, use popup
  const result = await openOAuthPopup({ url: oauthUrl });
  
  if (!result.success) {
    throw new Error(result.error || 'Authentication failed');
  }
  
  return result.data;
};