/**
 * Скрипт для очистки истекших эффектов
 * Запускать по расписанию через cron-задачу
 * 
 * Пример запуска:
 * node src/scripts/cleanupExpiredEffects.js
 */

const { getSequelizeInstance } = require('../services/database-connection-manager');
const { Sequelize } = require('sequelize');

async function cleanupExpiredEffects() {
  try {
    console.log('Начало очистки истекших эффектов...');
    
    // Получаем экземпляр Sequelize
    const sequelizeDb = await getSequelizeInstance();
    
    // Удаляем все эффекты, у которых истек срок действия
    const result = await sequelizeDb.query(
      'DELETE FROM effects WHERE expires_at IS NOT NULL AND expires_at < NOW() RETURNING id',
      {
        type: Sequelize.QueryTypes.DELETE
      }
    );
    
    const deletedCount = result[1]?.rowCount || 0;
    console.log(`Очистка завершена. Удалено ${deletedCount} истекших эффектов.`);
    
    // Закрываем соединение с базой данных
    await sequelizeDb.close();
    console.log('Соединение с базой данных закрыто.');
    
    return deletedCount;
  } catch (error) {
    console.error('Ошибка при очистке истекших эффектов:', error);
    process.exit(1);
  }
}

// Если скрипт запущен напрямую, выполняем очистку
if (require.main === module) {
  cleanupExpiredEffects()
    .then(count => {
      console.log(`Скрипт успешно выполнен. Удалено ${count} истекших эффектов.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Ошибка при выполнении скрипта:', error);
      process.exit(1);
    });
} else {
  // Экспортируем функцию для использования в других модулях
  module.exports = cleanupExpiredEffects;
}