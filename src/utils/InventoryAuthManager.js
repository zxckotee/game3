/**
 * Утилита для управления авторизацией в контексте работы с инвентарем
 * Помогает обрабатывать проблемы с авторизацией, возникшие после миграции на английский язык
 */
import apiService from '../services/api';

class InventoryAuthManager {
  /**
   * Проверяет наличие авторизации и при необходимости получает свежие данные пользователя
   * @param {Object} state - Текущее состояние приложения
   * @param {Object} actions - Действия для обновления состояния
   * @param {Function} navigate - Функция навигации из react-router-dom
   * @param {boolean} force - Принудительная проверка, игнорируя кэш
   * @returns {Promise<string|null>} - ID пользователя или null в случае ошибки
   */
  static async ensureUserAuthorized(state, actions, navigate, force = false) {
    try {
      // Проверяем наличие ID в состоянии
      const userId = state.auth?.user?.id;
      
      if (userId && !force) {
        return userId; // Если ID уже есть и не требуется принудительная проверка, возвращаем его
      }
      
      // Проверяем кэш авторизации
      const lastAuthCheck = localStorage.getItem('auth_check_time');
      const currentTime = Date.now();
      const AUTH_CHECK_TIMEOUT = 30 * 60 * 1000; // 30 минут
      
      // Если кэш авторизации свежий и нет принудительной проверки
      if (!force && lastAuthCheck && (currentTime - parseInt(lastAuthCheck, 10)) < AUTH_CHECK_TIMEOUT) {
        // Если ID отсутствует, но кэш свежий - запросим пользователя без проверки авторизации
        if (!userId) {
          try {
            const userData = await apiService.getCurrentUser();
            if (userData?.id) {
              if (actions.setUser) {
                actions.setUser(userData);
              }
              return userData.id;
            }
          } catch (error) {
            console.log('Ошибка при получении данных пользователя из кэша:', error);
            // Если ошибка, продолжаем полную проверку авторизации
          }
        } else {
          // Если ID есть и кэш свежий, просто возвращаем ID
          return userId;
        }
      }
      
      console.log('Проверяем авторизацию через API (кэш устарел или принудительная проверка)');
      
      // Проверяем авторизацию через API
      const isAuth = await apiService.checkAuth();
      
      if (!isAuth) {
        // Если пользователь не авторизован
        actions.addNotification({
          message: 'Сессия истекла. Пожалуйста, войдите заново.',
          type: 'warning'
        });
        
        // Если есть функция навигации, перенаправляем на страницу входа
        if (navigate) {
          navigate('/login');
        }
        
        // Очищаем кэш авторизации
        localStorage.removeItem('auth_check_time');
        localStorage.removeItem('inventory_auth_check_time');
        
        return null;
      }
      
      // Загружаем данные пользователя
      const userData = await apiService.getCurrentUser();
      
      if (!userData?.id) {
        throw new Error('Не удалось получить ID пользователя из API');
      }
      
      // Обновляем данные пользователя в состоянии
      if (actions.setUser) {
        actions.setUser(userData);
      } else {
        console.warn('Метод actions.setUser не найден. Обновление данных пользователя в состоянии не выполнено.');
      }
      
      // Обновляем кэш авторизации
      localStorage.setItem('auth_check_time', currentTime.toString());
      localStorage.setItem('inventory_auth_check_time', currentTime.toString());
      
      return userData.id;
    } catch (error) {
      console.error('Ошибка при проверке авторизации:', error);
      
      if (actions.addNotification) {
        actions.addNotification({
          message: `Ошибка авторизации: ${error.message}`,
          type: 'error'
        });
      }
      
      return null;
    }
  }
  
  /**
   * Обрабатывает ошибки обращения к инвентарю
   * @param {Error} error - Объект ошибки
   * @param {Object} actions - Действия для обновления состояния
   * @param {Function} navigate - Функция навигации из react-router-dom
   */
  static handleInventoryError(error, actions, navigate) {
    console.error('Ошибка при работе с инвентарем:', error);
    
    // Определяем тип ошибки по сообщению
    if (error.message.includes('авторизован') ||
        error.message.includes('authorized') ||
        error.message.includes('сессия') ||
        error.message.includes('session')) {
      // Ошибка авторизации
      actions.addNotification({
        message: 'Ошибка авторизации при работе с инвентарем. Пожалуйста, войдите заново.',
        type: 'error'
      });
      
      // Очищаем кэш авторизации при ошибках авторизации
      localStorage.removeItem('auth_check_time');
      localStorage.removeItem('inventory_auth_check_time');
      
      // Если есть функция навигации, перенаправляем на страницу входа
      if (navigate) {
        navigate('/login');
      }
    } else if (error.message.includes('тип предмета') || 
               error.message.includes('item type') || 
               error.message.includes('constraint') ||
               error.message.includes('validation')) {
      // Ошибка валидации данных
      actions.addNotification({
        message: 'Ошибка формата данных предмета. Обновите страницу и попробуйте снова.',
        type: 'error'
      });
    } else {
      // Общая ошибка
      actions.addNotification({
        message: `Ошибка при работе с инвентарем: ${error.message}`,
        type: 'error'
      });
    }
  }
}

export default InventoryAuthManager;