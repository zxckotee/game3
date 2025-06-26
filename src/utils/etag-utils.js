/**
 * Утилиты для работы с ETag (Entity Tag)
 * Используются для кэширования и условной загрузки данных
 */

const crypto = require('crypto');

/**
 * Вычисляет ETag для данных, используя MD5
 * @param {Object} data - Данные для хеширования
 * @returns {string} - ETag в формате "хеш"
 */
function calculateETag(data) {
  // Используем crypto для создания хеша
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  
  // Возвращаем ETag в стандартном формате
  return `"${hash}"`;
}

module.exports = {
  calculateETag
};