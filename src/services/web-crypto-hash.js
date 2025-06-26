/**
 * Сервис для хеширования паролей с использованием Web Crypto API
 * Заменяет bcryptjs для избежания проблем совместимости модулей
 */

/**
 * Хеширует пароль с использованием SHA-256
 * @param {string} password - Пароль для хеширования
 * @returns {Promise<string>} - Хеш пароля в hex-формате
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Добавляем соль к паролю для большей безопасности
  // В реальном приложении стоит использовать случайную соль для каждого пользователя
  const salt = "cultivationPathToImmortality";
  const saltedPassword = password + salt;
  const saltedData = encoder.encode(saltedPassword);
  
  // Используем SHA-256, доступный во всех современных браузерах
  const hashBuffer = await crypto.subtle.digest('SHA-256', saltedData);
  
  // Конвертируем хеш из ArrayBuffer в hex-строку
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Сравнивает пароль с его хешем
 * @param {string} password - Оригинальный пароль
 * @param {string} hash - Хеш для сравнения
 * @returns {Promise<boolean>} - true, если пароль соответствует хешу
 */
async function comparePassword(password, hash) {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// Экспортируем функции и константы
module.exports = {
  hashPassword,
  comparePassword
};

// Экспортируем отдельные свойства для совместимости
module.exports.hashPassword = hashPassword;
module.exports.comparePassword = comparePassword;