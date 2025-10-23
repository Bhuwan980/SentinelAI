// src/hooks/usePageTitle.js
import { useEffect } from 'react';

export const usePageTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title;
    
    // Set the new title
    if (title) {
      document.title = `${title} | Sentinel AI`;
    } else {
      document.title = 'Sentinel AI - IP Protection Platform';
    }
    
    // Cleanup function to restore previous title
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};