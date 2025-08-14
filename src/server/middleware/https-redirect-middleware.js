/**
 * Middleware для автоматического редиректа с HTTP на HTTPS
 */

const httpsRedirectMiddleware = (req, res, next) => {
  // Проверяем, если запрос пришел по HTTP
  if (req.header('x-forwarded-proto') !== 'https' && !req.secure) {
    // Получаем хост из заголовка
    const host = req.get('Host');
    
    // Формируем HTTPS URL
    const httpsUrl = `https://${host}${req.originalUrl}`;
    
    console.log(`Redirecting HTTP to HTTPS: ${req.originalUrl} -> ${httpsUrl}`);
    
    // Выполняем редирект 301 (постоянный)
    return res.redirect(301, httpsUrl);
  }
  
  // Если уже HTTPS, продолжаем обработку
  next();
};

module.exports = httpsRedirectMiddleware;