/**
 * SpiritStormEvent.js
 * Событие "Духовный шторм"
 */

import { AbstractEvent } from '../../core/AbstractEvent';

export class SpiritStormEvent extends AbstractEvent {
  constructor() {
    super({
      id: 'nature_spirit_storm',
      name: 'Духовный шторм',
      description: 'Мощный поток духовной энергии проносится по региону, увеличивая концентрацию энергии в воздухе.',
      category: 'nature',
      rarity: 'uncommon',
      duration: { min: 60, max: 180 }, // от 1 до 3 часов игрового времени
      conditions: {
        minLevel: 2,
        seasonModifiers: { spring: 1.2, summer: 0.8, autumn: 1.0, winter: 1.0 },
        timeModifiers: { dawn: 1.5, morning: 1.0, noon: 0.8, afternoon: 0.8, evening: 1.2, night: 1.5, deepNight: 2.0 },
        weatherModifiers: { clear: 0.8, cloudy: 1.2, rain: 0.5, storm: 2.0, fog: 1.2, snow: 0.5 },
        locationModifiers: { mountains: 1.5, plains: 1.0, forest: 1.2, city: 0.7 }
      },
      effects: [
        { type: 'cultivation_speed', value: 1.5, description: 'Увеличение скорости культивации на 50%' },
        { type: 'energy_regen', value: 2.0, description: 'Удвоение регенерации энергии' }
      ],
      choices: [
        {
          text: 'Медитировать для поглощения духовной энергии',
          requirements: null,
          results: [
            { type: 'resource', resource: 'energy', amount: 50, description: '+50 единиц духовной энергии' },
            { type: 'experience', amount: 20, description: '+20 опыта культивации' }
          ],
          concludesEvent: false
        },
        {
          text: 'Собрать заряженные духовные камни',
          requirements: { skill: 'spirit_sensing', level: 2 },
          results: [
            { 
              type: 'item', 
              item: 'charged_spirit_stone', 
              amount: { min: 1, max: 5 }, 
              description: 'Получены заряженные духовные камни' 
            }
          ],
          concludesEvent: false
        },
        {
          text: 'Игнорировать шторм и продолжить свои дела',
          requirements: null,
          results: [],
          concludesEvent: true
        }
      ],
      cooldown: 7 // дней игрового времени
    });
  }
  
  /**
   * Применяет начальные эффекты события
   * @param {Object} context - Игровой контекст
   */
  applyInitialEffects(context) {
    // Добавляем временные баффы
    const buffId = `spiritual_storm_${Date.now()}`;
    const duration = this._endTime.hour * 60 + this._endTime.minute - (this._startTime.hour * 60 + this._startTime.minute);
    
    const buff = {
      id: buffId,
      name: 'Духовный шторм',
      description: 'Увеличение скорости культивации и регенерации энергии',
      duration: duration,
      startTime: { ...this._startTime },
      effects: {
        cultivationSpeed: 1.5,
        energyRegen: 2.0
      }
    };
    
    // Добавляем бафф в состояние игрока
    if (context.player.buffs) {
      context.player.buffs[buffId] = buff;
    } else {
      console.warn('Невозможно применить бафф: отсутствует система баффов');
    }
    
    // Создаем визуальный эффект шторма
    if (context.world.visualEffects) {
      context.world.visualEffects.push({
        type: 'storm',
        intensity: 0.7,
        duration: duration,
        color: '#7289DA'
      });
    }
  }
  
  /**
   * Метод, вызываемый при завершении события
   * @param {Object} context - Игровой контекст
   */
  onConclude(context) {
    // Удаляем баффы, связанные с этим событием
    const buffPrefix = 'spiritual_storm_';
    if (context.player.buffs) {
      for (const buffId in context.player.buffs) {
        if (buffId.startsWith(buffPrefix)) {
          delete context.player.buffs[buffId];
        }
      }
    }
    
    // Удаляем визуальные эффекты
    if (context.world.visualEffects) {
      context.world.visualEffects = context.world.visualEffects.filter(effect => effect.type !== 'storm');
    }
  }
  
  /**
   * Применяет конкретный результат
   * @param {Object} result - Результат для применения
   * @param {Object} context - Игровой контекст
   * @returns {Object} Информация о примененном результате
   */
  applyResult(result, context) {
    // Специфичная логика для сбора духовных камней
    if (result.type === 'item' && result.item === 'charged_spirit_stone') {
      // Генерируем случайное количество в заданном диапазоне
      const amount = Math.floor(result.amount.min + Math.random() * (result.amount.max - result.amount.min + 1));
      
      // Добавляем предметы в инвентарь
      if (context.player.inventory && context.player.inventory.items) {
        // Находим существующий предмет или создаем новый
        let existingItem = context.player.inventory.items.find(item => item.id === 'charged_spirit_stone');
        
        if (existingItem) {
          existingItem.quantity += amount;
        } else {
          context.player.inventory.items.push({
            id: 'charged_spirit_stone',
            name: 'Заряженный духовный камень',
            description: 'Камень, наполненный духовной энергией шторма',
            type: 'material',
            rarity: 'uncommon',
            quantity: amount
          });
        }
        
        return {
          applied: true,
          description: `Получено ${amount} заряженных духовных камней`,
          item: 'charged_spirit_stone',
          amount: amount
        };
      }
      
      return { applied: false, description: 'Инвентарь не найден' };
    }
    
    // Для остальных типов используем реализацию родительского класса
    return super.applyResult(result, context);
  }
}
