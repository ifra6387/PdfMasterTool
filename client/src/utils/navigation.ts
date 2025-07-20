// Navigation utility for handling back to tools functionality
export const TOOLS_PAGE_KEY = 'previousToolsPage';

export const saveToolsPageUrl = (url: string) => {
  try {
    localStorage.setItem(TOOLS_PAGE_KEY, url);
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('Unable to save tools page URL:', error);
  }
};

export const getBackToToolsUrl = (): string => {
  try {
    const savedUrl = localStorage.getItem(TOOLS_PAGE_KEY);
    if (savedUrl) {
      return savedUrl;
    }
  } catch (error) {
    console.warn('Unable to retrieve tools page URL:', error);
  }
  
  // Default fallback URLs
  return '/dashboard';
};

export const navigateBackToTools = (setLocation: (path: string) => void) => {
  const backUrl = getBackToToolsUrl();
  setLocation(backUrl);
};

export const clearToolsPageUrl = () => {
  try {
    localStorage.removeItem(TOOLS_PAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear tools page URL:', error);
  }
};