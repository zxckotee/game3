/**
 * Утилита для диагностики и отладки JWT токенов
 */

/**
 * Функция для проверки и декодирования JWT токена
 * @returns {Object|null} Объект с информацией о токене или null при ошибке
 */
export function debugCheckToken() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('[DEBUG] Токен отсутствует в localStorage');
      return null;
    }
    
    console.log('[DEBUG] Токен найден. Первые 20 символов:', token.substring(0, 20) + '...');
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[DEBUG] Некорректный формат JWT (не 3 части)');
      return null;
    }
    
    try {
      // Безопасное декодирование header
      const headerBase64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
      const paddedHeaderBase64 = headerBase64 + '='.repeat((4 - headerBase64.length % 4) % 4);
      const header = JSON.parse(atob(paddedHeaderBase64));
      console.log('[DEBUG] JWT Header:', header);
      
      // Безопасное декодирование payload
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayloadBase64 = payloadBase64 + '='.repeat((4 - payloadBase64.length % 4) % 4);
      
      const payload = JSON.parse(atob(paddedPayloadBase64));
      console.log('[DEBUG] JWT Payload:', payload);
      console.log('[DEBUG] userId из токена:', payload.id || payload.userId || payload.sub);
      
      return {
        header,
        payload,
        userId: payload.id || payload.userId || payload.sub
      };
    } catch (error) {
      console.error('[DEBUG] Ошибка при декодировании частей токена:', error);
      return null;
    }
  } catch (error) {
    console.error('[DEBUG] Общая ошибка при проверке токена:', error);
    return null;
  }
}

/**
 * Создает правильно сформированный токен на основе предоставленных данных
 * @param {Object} payload - Содержимое токена (payload)
 * @returns {string} JWT токен
 */
export function createDebugToken(payload) {
  // Создаем простой header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Функция для Base64Url кодирования
  const base64UrlEncode = (data) => {
    const base64 = btoa(JSON.stringify(data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  // Создаем первые две части токена
  const headerBase64 = base64UrlEncode(header);
  const payloadBase64 = base64UrlEncode(payload);
  
  // Для тестового токена используем фиктивную подпись
  const signature = 'TEST_SIGNATURE_FOR_DEBUGGING_ONLY';
  
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

/**
 * Функция для инициирования тестового JWT токена
 * @param {number} userId - ID пользователя для токена
 */
export function injectDebugToken(userId) {
  if (!userId) {
    console.error('[DEBUG] Необходимо указать userId для создания тестового токена');
    return;
  }
  
  // Создаем простой payload с необходимыми данными
  const payload = {
    id: userId,
    username: 'debug_user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // токен на 1 час
  };
  
  // Создаем токен
  const token = createDebugToken(payload);
  
  // Сохраняем в localStorage
  localStorage.setItem('authToken', token);
  console.log(`[DEBUG] Тестовый токен успешно сохранен для userId=${userId}`);
  
  // Проверяем корректность декодирования
  return debugCheckToken();
}