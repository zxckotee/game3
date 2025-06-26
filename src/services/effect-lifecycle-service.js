const { getModel } = require('../models/registry');

/**
 * Сервис для управления жизненным циклом эффектов
 */
class EffectLifecycleService {
  /**
   * Удаляет все истекшие эффекты из базы данных
   * @returns {Promise<number>} Количество удаленных эффектов
   */
  static async cleanupExpiredEffects() {
    try {
      const ActivePlayerEffect = getModel('ActivePlayerEffect');
      if (!ActivePlayerEffect) {
        console.error('Модель ActivePlayerEffect не найдена в реестре.');
        return 0;
      }

      const { Sequelize } = require('sequelize');
      const deletedCount = await ActivePlayerEffect.destroy({
        where: {
          expires_at: {
            [Sequelize.Op.lt]: new Date()
          }
        }
      });

      if (deletedCount > 0) {
        console.log(`[EffectLifecycleService] Удалено ${deletedCount} истекших эффектов.`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Ошибка при очистке истекших эффектов:', error);
      return 0;
    }
  }
}

module.exports = EffectLifecycleService;