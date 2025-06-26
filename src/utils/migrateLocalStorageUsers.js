/**
 * Утилита для миграции пользователей из localStorage в базу данных
 */
import apiService from '../services/api';

/**
 * Запуск миграции пользователей из localStorage в базу данных
 */
async function runMigration() {
  console.log('Начинаем миграцию пользователей из localStorage в базу данных...');
  
  try {
    // Запускаем миграцию
    const results = await apiService.migrateUsersToDatabase();
    
    if (results.success) {
      console.log('==== Результаты миграции ====');
      console.log(`Обработано пользователей: ${results.processed}`);
      console.log(`Мигрировано в БД: ${results.migrated}`);
      console.log(`Пропущено (уже в БД): ${results.skipped}`);
      console.log(`Ошибок: ${results.errors.length}`);
      
      if (results.errors.length > 0) {
        console.log('\nДетали ошибок:');
        results.errors.forEach((err, index) => {
          console.log(`${index + 1}. Пользователь ${err.username}: Этап "${err.stage}" - ${err.error}`);
        });
      }
      
      if (results.migrated > 0) {
        // Очищаем localStorage только если миграция успешно выполнена для некоторых пользователей
        console.log('\nОчистка localStorage...');
        localStorage.removeItem('users');
        console.log('Данные пользователей удалены из localStorage');
      }
      
      console.log('\nМиграция завершена!');
    } else {
      console.error('Миграция завершилась с ошибкой:', results.error);
    }
  } catch (error) {
    console.error('Ошибка во время миграции:', error);
  }
}

// При загрузке в браузере, экспортируем функцию в глобальную область видимости
if (typeof window !== 'undefined') {
  window.migrateUsersToDatabase = runMigration;
  console.log('Функция migrateUsersToDatabase доступна в консоли.');
  console.log('Для запуска миграции вызовите: migrateUsersToDatabase()');
}

// Экспортируем функцию для использования в других модулях
export { runMigration };
}

module.exports = { runMigration };