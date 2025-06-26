/**
 * BanditAttackEvent.js
 * Событие "Нападение разбойников"
 */

import { AbstractEvent } from '../../core/AbstractEvent';

export class BanditAttackEvent extends AbstractEvent {
  constructor() {
    super({
      id: 'combat_bandit_attack',
      name: 'Нападение разбойников',
      description: 'Группа разбойников, промышляющих грабежом, устроила засаду на вашем пути.',
      category: 'combat',
      rarity: 'common',
      duration: { min: 30, max: 60 }, // от 30 минут до 1 часа игрового времени
      conditions: {
        minLevel: 1, // доступно с самого начала
        seasonModifiers: { spring: 1.0, summer: 1.2, autumn: 1.0, winter: 0.7 },
        timeModifiers: { dawn: 0.7, morning: 0.5, noon: 0.5, afternoon: 0.7, evening: 1.5, night: 2.0, deepNight: 1.5 },
        weatherModifiers: { clear: 1.0, cloudy: 1.2, rain: 0.8, storm: 0.5, fog: 1.5, snow: 0.7 },
        locationModifiers: { city: 0.3, town: 0.5, village: 0.7, road: 2.0, plains: 1.5, forest: 1.7, mountains: 1.3 }
      },
      effects: [
        { type: 'combat_threat', value: 1.0, description: 'Угроза вооруженного столкновения' }
      ],
      choices: [
        {
          text: 'Вступить в бой с разбойниками',
          requirements: null,
          results: [
            { 
              type: 'combat', 
              enemies: 'bandits',
              difficulty: 'standard',
              description: 'Начать сражение с разбойниками' 
            }
          ],
          concludesEvent: true
        },
        {
          text: 'Попытаться запугать разбойников',
          requirements: { stat: 'strength', value: 5 },
          results: [
            { 
              type: 'intimidation', 
              successChance: 0.7,
              description: 'Попытка запугать разбойников своей силой' 
            }
          ],
          concludesEvent: true
        },
        {
          text: 'Попытаться откупиться',
          requirements: null,
          results: [
            { 
              type: 'bribe', 
              amount: 'auto',
              description: 'Отдать часть ценностей, чтобы избежать боя' 
            }
          ],
          concludesEvent: true
        },
        {
          text: 'Попытаться сбежать',
          requirements: { stat: 'agility', value: 4 },
          results: [
            { 
              type: 'escape', 
              successChance: 0.8,
              description: 'Попытка быстро ретироваться' 
            }
          ],
          concludesEvent: true
        }
      ],
      cooldown: 3 // дней игрового времени
    });
    
    // Дополнительные свойства для события нападения
    this.banditCount = 0; // Количество разбойников, будет определено при активации
    this.banditLevel = 0; // Уровень разбойников, будет определен при активации
    this.loot = []; // Добыча, которую можно получить после победы
  }
  
  /**
   * Применяет начальные эффекты события
   * @param {Object} context - Игровой контекст
   */
  applyInitialEffects(context) {
    // Определяем количество и уровень разбойников в зависимости от уровня игрока
    const playerLevel = context.player.cultivation.level;
    
    // Количество разбойников: 2-5, увеличивается с уровнем игрока
    this.banditCount = 2 + Math.min(3, Math.floor(playerLevel / 2));
    
    // Уровень разбойников: немного ниже уровня игрока
    this.banditLevel = Math.max(1, Math.floor(playerLevel * 0.7));
    
    // Генерируем возможную добычу
    this.generateLoot(context);
    
    // Если в игре есть система атмосферных эффектов, добавляем эффект напряжения
    if (context.world.atmosphericEffects) {
      context.world.atmosphericEffects.push({
        type: 'tension',
        intensity: 0.7,
        duration: this._endTime.hour * 60 + this._endTime.minute - (this._startTime.hour * 60 + this._startTime.minute),
        location: context.player.location.id
      });
    }
    
    // Если у игрока есть питомцы, они реагируют на опасность
    if (context.player.spiritPets && context.player.spiritPets.length > 0) {
      const hasAlert = true; // Флаг, если хотя бы один питомец предупредил об опасности
      
      if (hasAlert && context.ui && context.ui.notifications) {
        context.ui.notifications.push({
          id: `bandit_alert_${Date.now()}`,
          message: 'Ваш духовный питомец чувствует опасность поблизости!',
          type: 'warning',
          timestamp: { ...context.world.time }
        });
      }
    }
  }
  
  /**
   * Метод, вызываемый при завершении события
   * @param {Object} context - Игровой контекст
   */
  onConclude(context) {
    // Удаляем атмосферные эффекты
    if (context.world.atmosphericEffects) {
      context.world.atmosphericEffects = context.world.atmosphericEffects.filter(effect => 
        effect.type !== 'tension' || effect.location !== context.player.location.id
      );
    }
  }
  
  /**
   * Применяет конкретный результат
   * @param {Object} result - Результат для применения
   * @param {Object} context - Игровой контекст
   * @returns {Object} Информация о примененном результате
   */
  applyResult(result, context) {
    // Обработка начала боя
    if (result.type === 'combat') {
      const combatData = this.initiateCombat(context);
      
      return {
        applied: true,
        description: `Вы вступаете в бой с ${this.banditCount} разбойниками`,
        combat: combatData
      };
    }
    
    // Обработка попытки запугивания
    if (result.type === 'intimidation') {
      // Проверяем успешность запугивания
      const playerStrength = context.player.stats?.strength || 1;
      // Базовый шанс из результата, модифицированный характеристикой силы
      const successChance = result.successChance * (1 + (playerStrength - this.banditLevel) * 0.1);
      
      // Определяем успех
      const success = Math.random() < successChance;
      
      if (success) {
        // Если успешно, разбойники убегают, оставляя часть добычи
        if (context.player.inventory && context.player.inventory.items && this.loot.length > 0) {
          // Выбираем случайный предмет из добычи
          const randomIndex = Math.floor(Math.random() * this.loot.length);
          const randomLoot = { ...this.loot[randomIndex] };
          
          // Добавляем предмет в инвентарь
          context.player.inventory.items.push(randomLoot);
          
          return {
            applied: true,
            success: true,
            description: `Разбойники испугались вашей силы и убежали, оставив ${randomLoot.name}!`,
            item: randomLoot.name
          };
        }
        
        return {
          applied: true,
          success: true,
          description: 'Разбойники испугались вашей силы и убежали!'
        };
      } else {
        // Если не успешно, начинается бой
        const combatData = this.initiateCombat(context);
        
        return {
          applied: true,
          success: false,
          description: 'Разбойники не испугались и нападают на вас!',
          combat: combatData
        };
      }
    }
    
    // Обработка попытки подкупа
    if (result.type === 'bribe') {
      // Определяем сумму подкупа в зависимости от уровня разбойников
      const bribeAmount = result.amount === 'auto' 
        ? this.banditLevel * 50 * this.banditCount // 50 золота за каждого разбойника, умноженное на их уровень
        : result.amount;
      
      // Проверяем, есть ли у игрока достаточно денег
      if (context.player.inventory && context.player.inventory.currency && context.player.inventory.currency.gold >= bribeAmount) {
        // Вычитаем деньги
        context.player.inventory.currency.gold -= bribeAmount;
        
        return {
          applied: true,
          success: true,
          description: `Вы откупились от разбойников за ${bribeAmount} золота.`,
          goldSpent: bribeAmount
        };
      } else {
        // Если денег недостаточно, начинается бой
        const combatData = this.initiateCombat(context);
        
        return {
          applied: true,
          success: false,
          description: 'У вас недостаточно денег, чтобы откупиться. Разбойники нападают!',
          combat: combatData
        };
      }
    }
    
    // Обработка попытки побега
    if (result.type === 'escape') {
      // Проверяем успешность побега
      const playerAgility = context.player.stats?.agility || 1;
      // Базовый шанс из результата, модифицированный ловкостью
      const successChance = result.successChance * (1 + (playerAgility - this.banditLevel) * 0.1);
      
      // Определяем успех
      const success = Math.random() < successChance;
      
      if (success) {
        return {
          applied: true,
          success: true,
          description: 'Вам удалось успешно сбежать от разбойников!'
        };
      } else {
        // Если не успешно, начинается бой
        const combatData = this.initiateCombat(context);
        
        return {
          applied: true,
          success: false,
          description: 'Побег не удался! Разбойники догнали вас и нападают!',
          combat: combatData
        };
      }
    }
    
    // Для остальных типов используем реализацию родительского класса
    return super.applyResult(result, context);
  }
  
  /**
   * Генерирует добычу, которую можно получить с разбойников
   * @param {Object} context - Игровой контекст
   */
  generateLoot(context) {
    const playerLevel = context.player.cultivation.level;
    
    // Базовое количество добычи
    const lootCount = 1 + Math.floor(this.banditCount / 2);
    
    // Возможные типы добычи
    const possibleLoot = [
      { 
        type: 'currency', 
        id: 'gold', 
        name: 'Мешочек с золотом', 
        description: 'Небольшой мешочек с золотыми монетами',
        amount: 50 * this.banditLevel * (0.8 + Math.random() * 0.4) // 40-60 золота за уровень разбойника
      },
      { 
        type: 'consumable', 
        id: 'healing_pill', 
        name: 'Пилюля исцеления', 
        description: 'Базовая пилюля, восстанавливающая здоровье',
        quantity: 1 + Math.floor(Math.random() * 2)
      },
      { 
        type: 'consumable', 
        id: 'energy_pill', 
        name: 'Пилюля энергии', 
        description: 'Базовая пилюля, восстанавливающая духовную энергию',
        quantity: 1 + Math.floor(Math.random() * 2)
      },
      { 
        type: 'material', 
        id: 'spirit_stone_low', 
        name: 'Духовный камень низкого качества', 
        description: 'Содержит небольшое количество духовной энергии',
        quantity: 1 + Math.floor(Math.random() * 3)
      },
      { 
        type: 'weapon', 
        id: 'iron_sword', 
        name: 'Железный меч', 
        description: 'Обычный железный меч, ничем не примечательный',
        quality: 1 + Math.floor(Math.random() * 2),
        damage: 10 + Math.floor(playerLevel * 1.5)
      },
      { 
        type: 'armor', 
        id: 'leather_armor', 
        name: 'Кожаный доспех', 
        description: 'Простой доспех из дубленой кожи',
        quality: 1 + Math.floor(Math.random() * 2),
        defense: 5 + Math.floor(playerLevel * 1.0)
      }
    ];
    
    // Если уровень игрока достаточно высок, добавляем редкую добычу
    if (playerLevel >= 3) {
      possibleLoot.push({ 
        type: 'material', 
        id: 'spirit_stone_mid', 
        name: 'Духовный камень среднего качества', 
        description: 'Содержит умеренное количество духовной энергии',
        quantity: 1
      });
    }
    
    if (playerLevel >= 5) {
      possibleLoot.push({ 
        type: 'consumable', 
        id: 'breakthrough_pill', 
        name: 'Пилюля прорыва', 
        description: 'Помогает при прорыве на следующий уровень культивации',
        quantity: 1
      });
    }
    
    // Генерируем случайную добычу
    this.loot = [];
    
    // Обязательно добавляем золото
    this.loot.push({ ...possibleLoot[0] }); // Первый элемент - мешочек с золотом
    
    // Добавляем случайные предметы
    for (let i = 1; i < lootCount; i++) {
      // Исключаем первый элемент (золото), так как он уже добавлен
      const randomIndex = 1 + Math.floor(Math.random() * (possibleLoot.length - 1));
      this.loot.push({ ...possibleLoot[randomIndex] });
    }
  }
  
  /**
   * Инициирует бой с разбойниками
   * @param {Object} context - Игровой контекст
   * @returns {Object} Данные для инициализации боя
   */
  initiateCombat(context) {
    // Генерируем противников в зависимости от количества и уровня разбойников
    const enemies = [];
    
    // Типы разбойников
    const banditTypes = [
      { type: 'bandit_scout', name: 'Разбойник-разведчик', role: 'attacker', hpMod: 0.8, dmgMod: 0.9, multiplier: 0.8 },
      { type: 'bandit_thug', name: 'Разбойник-головорез', role: 'tank', hpMod: 1.2, dmgMod: 0.8, multiplier: 1.0 },
      { type: 'bandit_archer', name: 'Разбойник-лучник', role: 'ranged', hpMod: 0.7, dmgMod: 1.1, multiplier: 0.9 },
      { type: 'bandit_leader', name: 'Главарь разбойников', role: 'elite', hpMod: 1.5, dmgMod: 1.2, multiplier: 1.2 }
    ];
    
    // Создаем разбойников
    for (let i = 0; i < this.banditCount; i++) {
      // Определяем тип разбойника
      let typeIndex;
      if (i === 0 && this.banditCount >= 3) {
        // Если это первый из трех или более разбойников, делаем его главарем
        typeIndex = 3; // Главарь
      } else {
        // Иначе выбираем случайный тип из первых трех (не главарь)
        typeIndex = Math.floor(Math.random() * 3);
      }
      
      const banditType = banditTypes[typeIndex];
      
      // Создаем противника
      const enemy = {
        id: `bandit_${Date.now()}_${i}`,
        type: banditType.type,
        name: banditType.name,
        level: banditType.type === 'bandit_leader' ? this.banditLevel + 1 : this.banditLevel,
        role: banditType.role,
        hp: Math.floor(20 * this.banditLevel * banditType.hpMod),
        maxHp: Math.floor(20 * this.banditLevel * banditType.hpMod),
        damage: Math.floor(5 * this.banditLevel * banditType.dmgMod),
        defense: Math.floor(2 * this.banditLevel),
        skills: this.getBanditSkills(banditType.type, this.banditLevel),
        loot: banditType.type === 'bandit_leader' ? this.loot : []
      };
      
      enemies.push(enemy);
    }
    
    // Формируем данные для боя
    return {
      enemies,
      location: context.player.location.name || 'Дорога',
      background: 'road_ambush',
      music: 'combat_bandits',
      rewards: {
        experience: 20 * this.banditLevel * this.banditCount,
        loot: this.loot,
        reputation: { law: 5, region: 3 }
      }
    };
  }
  
  /**
   * Возвращает список навыков для разбойника определенного типа
   * @param {string} banditType - Тип разбойника
   * @param {number} level - Уровень разбойника
   * @returns {Array} Список навыков
   */
  getBanditSkills(banditType, level) {
    const skills = [];
    
    // Базовые атаки доступны всем
    skills.push({
      id: 'basic_attack',
      name: 'Атака',
      type: 'physical',
      damageModifier: 1.0,
      energyCost: 0,
      cooldown: 0
    });
    
    // Специальные навыки в зависимости от типа
    if (banditType === 'bandit_scout') {
      skills.push({
        id: 'quick_strike',
        name: 'Быстрый удар',
        type: 'physical',
        damageModifier: 0.8,
        energyCost: 5,
        cooldown: 2,
        effectChance: 0.3,
        effect: {
          type: 'bleed',
          duration: 2,
          damagePerTurn: Math.floor(level * 1.5)
        }
      });
      
      if (level >= 3) {
        skills.push({
          id: 'stealth_strike',
          name: 'Удар из тени',
          type: 'physical',
          damageModifier: 1.5,
          energyCost: 10,
          cooldown: 3,
          effectChance: 0.2,
          effect: {
            type: 'stun',
            duration: 1
          }
        });
      }
    }
    
    else if (banditType === 'bandit_thug') {
      skills.push({
        id: 'heavy_blow',
        name: 'Тяжелый удар',
        type: 'physical',
        damageModifier: 1.3,
        energyCost: 8,
        cooldown: 3
      });
      
      if (level >= 3) {
        skills.push({
          id: 'intimidating_roar',
          name: 'Устрашающий рык',
          type: 'control',
          damageModifier: 0,
          energyCost: 12,
          cooldown: 4,
          effectChance: 0.5,
          effect: {
            type: 'fear',
            duration: 1,
            statModifier: { damage: 0.8 }
          }
        });
      }
    }
    
    else if (banditType === 'bandit_archer') {
      skills.push({
        id: 'aimed_shot',
        name: 'Прицельный выстрел',
        type: 'physical',
        damageModifier: 1.2,
        energyCost: 7,
        cooldown: 2,
        range: 'long'
      });
      
      if (level >= 3) {
        skills.push({
          id: 'crippling_shot',
          name: 'Калечащий выстрел',
          type: 'physical',
          damageModifier: 0.9,
          energyCost: 10,
          cooldown: 4,
          range: 'long',
          effectChance: 0.4,
          effect: {
            type: 'slow',
            duration: 2,
            statModifier: { agility: 0.7 }
          }
        });
      }
    }
    
    else if (banditType === 'bandit_leader') {
      skills.push({
        id: 'whirlwind_attack',
        name: 'Вихревая атака',
        type: 'physical',
        damageModifier: 0.8,
        energyCost: 15,
        cooldown: 3,
        aoe: true
      });
      
      if (level >= 2) {
        skills.push({
          id: 'rallying_cry',
          name: 'Воодушевляющий клич',
          type: 'buff',
          energyCost: 20,
          cooldown: 4,
          aoe: true,
          allies: true,
          effect: {
            type: 'strength',
            duration: 2,
            statModifier: { damage: 1.2 }
          }
        });
      }
      
      if (level >= 4) {
        skills.push({
          id: 'devastating_blow',
          name: 'Сокрушительный удар',
          type: 'physical',
          damageModifier: 1.8,
          energyCost: 25,
          cooldown: 5,
          effectChance: 0.3,
          effect: {
            type: 'stun',
            duration: 1
          }
        });
      }
    }
    
    return skills;
  }
}
