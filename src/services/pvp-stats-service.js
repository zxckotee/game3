const CharacterStatsService = require('./character-stats-service');
const { getModel } = require('../models/registry');

/**
 * Сервис для расчета характеристик игроков в PvP.
 * Использует централизованную логику из CharacterStatsService.
 */
class PvpStatsService {
  /**
   * Получает полные, рассчитанные характеристики для участника PvP.
   * @param {Object} participant - Объект участника PvP из модели PvPParticipant.
   * @param {Object} [transaction] - Опциональная транзакция Sequelize.
   * @returns {Promise<Object>} - Объект с базовыми, модифицированными и вторичными характеристиками.
   */
  static async getPvpParticipantStats(participant, transaction) {
    if (!participant) {
      throw new Error('Участник PvP не найден.');
    }

    const PvpPlayerStats = getModel('PvpPlayerStats');

    // 1. Получаем базовые PvP-статы
    const basePvpStats = await PvpPlayerStats.findOne({
      where: { pvp_participant_id: participant.id },
      transaction,
    });

    if (!basePvpStats) {
      throw new Error(`Базовые характеристики для участника PvP ${participant.id} не найдены.`);
    }

    // 2. Получаем активные эффекты участника (хранятся в JSON)
    const activeEffects = participant.effects || [];

    // 3. Формируем объект с базовыми характеристиками, совместимый с CharacterStatsService
    const baseStats = {
      strength: basePvpStats.strength,
      intellect: basePvpStats.intellect,
      spirit: basePvpStats.spirit,
      agility: basePvpStats.agility,
      health: basePvpStats.health,
      physicalDefense: basePvpStats.physical_defense,
      spiritualDefense: basePvpStats.spiritual_defense,
      attackSpeed: basePvpStats.attack_speed,
      criticalChance: basePvpStats.critical_chance,
      movementSpeed: basePvpStats.movement_speed,
      luck: basePvpStats.luck,
      // Добавляем текущее и максимальное здоровье/энергию для полноты картины
      current_hp: participant.current_hp,
      max_hp: participant.max_hp,
      current_energy: participant.current_energy,
      max_energy: participant.max_energy,
    };

    // 4. Применяем эффекты, используя централизованную функцию
    const modifiedState = CharacterStatsService.applyEffectsToStats(baseStats, activeEffects);

    // 5. Рассчитываем вторичные характеристики на основе модифицированных
    // Для PvP нам не нужна культивация, поэтому передаем modifiedState дважды
    const secondaryStats = CharacterStatsService.calculateSecondaryStats(modifiedState, modifiedState);

    // 6. Возвращаем полный набор характеристик
    return {
      base: baseStats,
      modified: modifiedState,
      secondary: secondaryStats,
    };
  }
}

module.exports = PvpStatsService;