/**
 * Скрипт для запуска миграции пользователей из localStorage в базу данных
 */
import { runMigration } from './migrateLocalStorageUsers';

// Немедленно вызываем функцию миграции при загрузке скрипта
(async () => {
  console.log('Запуск скрипта миграции...');
  try {
    await runMigration();
    console.log('Скрипт миграции успешно завершен.');
  } catch (error) {
    console.error('Ошибка при выполнении скрипта миграции:', error);
  }
})();