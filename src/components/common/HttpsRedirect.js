import { useEffect } from 'react';

/**
 * Компонент для автоматического редиректа с HTTP на HTTPS
 * Используется только в продакшене
 */
const HttpsRedirect = () => {
  useEffect(() => {
    // Проверяем только в продакшене и если протокол HTTP
    if (process.env.NODE_ENV === 'production' && window.location.protocol === 'http:') {
      const httpsUrl = window.location.href.replace('http:', 'https:');
      console.log('Redirecting to HTTPS:', httpsUrl);
      window.location.replace(httpsUrl);
    }
  }, []);

  // Компонент ничего не рендерит
  return null;
};

export default HttpsRedirect;