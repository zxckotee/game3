// Пример интеграции духовных питомцев с CombatManager
import SpiritPetCombatIntegration from './SpiritPetCombatIntegration';

/**
 * Этот файл показывает, как интегрировать систему духовных питомцев с CombatManager.
 * Код предполагает, что класс CombatManager содержит логику боевой системы.
 */

class CombatManager {
  constructor() {
    // Существующие свойства CombatManager
    this.player = null;
    this.opponent = null;
    this.battleId = null;
    this.isActive = false;
    this.turnCount = 0;
    
    // Инициализация интеграции с питомцами
    this.petSystem = new SpiritPetCombatIntegration();
  }
  
  /**
   * Инициализация боя
   * @param {Object} player - Игрок
   * @param {Object} opponent - Противник
   * @returns {Promise<void>}
   */
  async initializeBattle(player, opponent) {
    this.battleId = Date.now().toString();
    this.player = player;
    this.opponent = opponent;
    this.isActive = true;
    this.turnCount = 0;
    
    // Инициализация питомца для боя
    const petBonuses = await this.petSystem.initializeForCombat(this.battleId);
    
    if (petBonuses) {
      console.log(`Питомец ${petBonuses.petName} присоединился к бою`);
      
      // Применяем базовые бонусы питомца к игроку
      this.applyPetBonusesToPlayer();
    }
    
    this.startBattle();
  }
  
  /**
   * Применение бонусов питомца к характеристикам игрока
   */
  applyPetBonusesToPlayer() {
    const bonuses = this.petSystem.getBonuses();
    if (!bonuses) return;
    
    // Применяем бонусы к базовым характеристикам
    this.player.strength += bonuses.strength || 0;
    this.player.intelligence += bonuses.intelligence || 0;
    this.player.agility += bonuses.agility || 0;
    this.player.vitality += bonuses.vitality || 0;
    this.player.spirit += bonuses.spirit || 0;
    
    // Применяем бонусы к боевым характеристикам
    this.player.maxHealth += bonuses.healthBonus || 0;
    this.player.health = Math.min(this.player.health + bonuses.healthBonus || 0, this.player.maxHealth);
    this.player.maxEnergy += bonuses.energyBonus || 0;
    this.player.energy = Math.min(this.player.energy + bonuses.energyBonus || 0, this.player.maxEnergy);
    this.player.damageBonus += bonuses.damageBonus || 0;
    this.player.critChance += bonuses.critChanceBonus || 0;
    this.player.dodgeChance += bonuses.dodgeChanceBonus || 0;
    
    // Применяем стихийные бонусы, если они есть
    const elementalBonus = this.petSystem.getElementalBonus();
    if (elementalBonus) {
      switch (elementalBonus.type) {
        case 'fire':
          this.player.fireDamageBonus = (this.player.fireDamageBonus || 0) + elementalBonus.damageBonus;
          break;
        case 'water':
          this.player.healingEffectiveness = (this.player.healingEffectiveness || 1) + (elementalBonus.healingBonus / 100);
          break;
        case 'earth':
          this.player.defense += elementalBonus.defenseBonus || 0;
          break;
        case 'wind':
          this.player.speed += elementalBonus.speedBonus || 0;
          break;
        case 'lightning':
          this.player.critDamageMultiplier = (this.player.critDamageMultiplier || 1.5) + (elementalBonus.critDamageBonus / 100);
          break;
        case 'ice':
          this.player.attacks.forEach(attack => {
            attack.slowEffect = (attack.slowEffect || 0) + elementalBonus.slowEffect;
          });
          break;
        case 'light':
          this.player.healOverTime = (this.player.healOverTime || 0) + elementalBonus.healOverTimeBonus;
          break;
        case 'dark':
          this.player.lifeSteal = (this.player.lifeSteal || 0) + elementalBonus.lifeStealBonus;
          break;
        case 'void':
          this.player.armorPenetration = (this.player.armorPenetration || 0) + elementalBonus.penetrationBonus;
          break;
        default:
          // Универсальный бонус
          this.player.strength += elementalBonus.universalBonus || 0;
          this.player.intelligence += elementalBonus.universalBonus || 0;
          this.player.agility += elementalBonus.universalBonus || 0;
          this.player.vitality += elementalBonus.universalBonus || 0;
          this.player.spirit += elementalBonus.universalBonus || 0;
      }
    }
  }
  
  /**
   * Начало боя
   */
  startBattle() {
    console.log('Битва началась!');
    this.nextTurn();
  }
  
  /**
   * Обработка следующего хода
   */
  async nextTurn() {
    if (!this.isActive) return;
    
    this.turnCount++;
    console.log(`Ход ${this.turnCount}`);
    
    // Проверяем, не сбежит ли питомец в начале хода
    if (this.turnCount > 1) { // Не проверяем на первом ходу
      const petFled = await this.petSystem.checkForFlee();
      if (petFled) {
        console.log('Питомец сбежал с поля боя!');
        // Отменяем бонусы питомца
        this.removePetBonuses();
      }
    }
    
    // Обычная логика хода
    // ...
  }
  
  /**
   * Удаление бонусов питомца (например, при его бегстве)
   */
  removePetBonuses() {
    // Эта функция должна отменить все бонусы, примененные в applyPetBonusesToPlayer
    // Конкретная реализация зависит от того, как хранятся исходные характеристики игрока
    // Здесь приведен примерный подход:
    const bonuses = this.petSystem.getBonuses();
    if (!bonuses) return;
    
    // Отменяем бонусы к базовым характеристикам
    this.player.strength -= bonuses.strength || 0;
    this.player.intelligence -= bonuses.intelligence || 0;
    this.player.agility -= bonuses.agility || 0;
    this.player.vitality -= bonuses.vitality || 0;
    this.player.spirit -= bonuses.spirit || 0;
    
    // Отменяем бонусы к боевым характеристикам
    this.player.maxHealth -= bonuses.healthBonus || 0;
    this.player.health = Math.min(this.player.health, this.player.maxHealth);
    this.player.maxEnergy -= bonuses.energyBonus || 0;
    this.player.energy = Math.min(this.player.energy, this.player.maxEnergy);
    this.player.damageBonus -= bonuses.damageBonus || 0;
    this.player.critChance -= bonuses.critChanceBonus || 0;
    this.player.dodgeChance -= bonuses.dodgeChanceBonus || 0;
    
    // Отменяем стихийные бонусы
    // ...
  }
  
  /**
   * Использование способности игрока
   * @param {string} abilityId - ID способности
   */
  async usePlayerAbility(abilityId) {
    // Обычная логика использования способности
    // ...
    
    // Рассчитываем нанесенный урон
    const damageDealt = this.calculateDamage(this.player, this.opponent, abilityId);
    
    // Добавляем урон в статистику питомца
    this.petSystem.addDamageDealt(damageDealt);
    
    // Проверяем условия окончания боя
    this.checkBattleEnd();
  }
  
  /**
   * Использование способности питомца
   * @param {string} abilityId - ID способности питомца
   */
  async usePetAbility(abilityId) {
    const result = await this.petSystem.useAbility(abilityId);
    
    if (result.success) {
      console.log(`Питомец использовал способность: ${result.ability.name}`);
      
      // Применяем эффект способности
      this.applyPetAbilityEffect(result.ability);
      
      // Если питомец сбежал после использования способности
      if (result.fled) {
        console.log('Питомец сбежал после использования способности!');
        this.removePetBonuses();
      }
      
      return true;
    } else {
      console.log(`Не удалось использовать способность питомца: ${result.message}`);
      return false;
    }
  }
  
  /**
   * Применение эффекта способности питомца
   * @param {Object} ability - Объект способности питомца
   */
  applyPetAbilityEffect(ability) {
    // Применяем эффект в зависимости от типа способности
    if (ability.damage_multiplier) {
      // Атакующая способность
      const baseDamage = 20; // Базовый урон способности
      const totalDamage = Math.floor(baseDamage * ability.damage_multiplier * ability.effectiveness);
      
      this.opponent.health -= totalDamage;
      console.log(`Питомец нанес ${totalDamage} урона противнику`);
      
      // Добавляем урон в статистику питомца
      this.petSystem.addDamageDealt(totalDamage);
      
      // Применяем дополнительные эффекты
      if (ability.blind_effect) {
        this.opponent.accuracy = Math.max(0, this.opponent.accuracy - 30);
        console.log('Противник ослеплен!');
      }
      
      if (ability.slow_effect) {
        this.opponent.speed = Math.max(0, this.opponent.speed - 20);
        console.log('Противник замедлен!');
      }
    } else if (ability.effect_type) {
      // Эффект на основе типа
      switch (ability.effect_type) {
        case 'healing':
          const healAmount = Math.floor(ability.effect_value * ability.effectiveness);
          this.player.health = Math.min(this.player.health + healAmount, this.player.maxHealth);
          console.log(`Питомец восстановил ${healAmount} здоровья`);
          break;
        case 'defense_buff':
          const defBonus = Math.floor(ability.effect_value * ability.effectiveness);
          this.player.defense += defBonus;
          console.log(`Защита игрока увеличена на ${defBonus}`);
          break;
        case 'attack_buff':
          const atkBonus = Math.floor(ability.effect_value * ability.effectiveness);
          this.player.attack += atkBonus;
          console.log(`Атака игрока увеличена на ${atkBonus}`);
          break;
        // ... другие типы эффектов
      }
    }
    
    // Проверяем условия окончания боя
    this.checkBattleEnd();
  }
  
  /**
   * Получение списка доступных способностей питомца
   * @returns {Array} Массив объектов способностей
   */
  getPetAbilities() {
    return this.petSystem.getAvailableAbilities();
  }
  
  /**
   * Проверка условий окончания боя
   */
  checkBattleEnd() {
    if (this.opponent.health <= 0) {
      this.endBattle(true); // Победа
    } else if (this.player.health <= 0) {
      this.endBattle(false); // Поражение
    }
  }
  
  /**
   * Завершение боя
   * @param {boolean} victory - Признак победы
   */
  async endBattle(victory) {
    if (!this.isActive) return;
    
    this.isActive = false;
    console.log(victory ? 'Вы победили!' : 'Вы проиграли!');
    
    // Обновляем статистику питомца
    const petResult = await this.petSystem.finalizeCombat(victory);
    
    if (petResult.petUpdated) {
      console.log('Статистика питомца обновлена');
      
      if (petResult.petStats.level > this.petSystem.petBonuses.petLevel) {
        console.log(`Питомец повысил уровень до ${petResult.petStats.level}!`);
      }
    }
    
    // Обычная логика завершения боя
    // ...
  }
  
  /**
   * Расчет урона
   * @param {Object} attacker - Атакующий
   * @param {Object} defender - Защищающийся
   * @param {string} abilityId - ID способности
   * @returns {number} Нанесенный урон
   */
  calculateDamage(attacker, defender, abilityId) {
    // Это упрощенная логика расчета урона
    // Реальная реализация может быть гораздо сложнее
    
    // Находим способность
    const ability = attacker.abilities.find(a => a.id === abilityId);
    if (!ability) return 0;
    
    let damage = ability.baseDamage;
    
    // Добавляем бонусы атакующего
    damage += attacker.damageBonus || 0;
    
    // Критический удар
    const isCrit = Math.random() < (attacker.critChance / 100);
    if (isCrit) {
      damage *= attacker.critDamageMultiplier || 1.5;
      console.log('Критический удар!');
    }
    
    // Учитываем защиту защищающегося
    damage = Math.max(1, damage - (defender.defense || 0));
    
    // Округляем урон
    damage = Math.floor(damage);
    
    console.log(`Нанесено ${damage} урона`);
    defender.health -= damage;
    
    return damage;
  }
}

export default CombatManager;