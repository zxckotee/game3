/**
 * Миграция для синхронизации предметов экипировки с торговцами
 * Запускается автоматически при старте приложения через систему миграций
 */

const { syncMerchantEquipment } = require('../sync-merchant-equipment');
const logger = require('../utils/logger');

/**
 * Применение миграции
 */
async function up() {
  logger.info('Миграция 2025-04-07: Запуск синхронизации предметов экипировки с торговцами...');
  try {
    const result = await syncMerchantEquipment();
    logger.info(`Миграция 2025-04-07: Синхронизация завершена успешно. ${result.message}`);
    return true;
  } catch (error) {
    logger.error('Миграция 2025-04-07: Ошибка при синхронизации предметов экипировки с торговцами:', error);
    throw error;
  }
}

/**
 * Откат миграции (в данном случае не требуется, т.к. мы только добавляем данные)
 */
async function down() {
  logger.info('Миграция 2025-04-07: Откат не требуется для синхронизации предметов экипировки');
  return true;
}

module.exports = {
  up,
  down
};
