// Интеграция духовных питомцев с боевой системой
import { fetchPetCombatBonuses, checkPetFlee, usePetAbility, processBattleResults } from '../services/spirit-pet-service-api';

class SpiritPetCombatIntegration {
  constructor() {
    this.petBonuses = null;
    this.hasActivePet = false;
    this.petAbilities = [];
    this.petElement = null;
    this.petLoyalty = 0;
    this.petHunger = 0;
    this.petId = null;
    this.petName = null;
    this.abilityUsed = false;
    this.damageDealt = 0;
    this.battleId = null;
    this.fled = false;
  }
  
  // Инициализация питомца для боя
  async initializeForCombat(battleId) {
    this.battleId = battleId;
    this.damageDealt = 0;
    this.abilityUsed = false;
    this.fled = false;
    
    try {
      // Получаем боевые бонусы активного питомца
      const { bonuses, hasActivePet } = await fetchPetCombatBonuses();
      
      if (!hasActivePet || !bonuses) {
        this.hasActivePet = false;
        this.petBonuses = null;
        return null;
      }
      
      this.hasActivePet = true;
      this.petBonuses = bonuses;
      this.petAbilities = bonuses.combatAbilities || [];
      this.petElement = bonuses.element;
      this.petLoyalty = bonuses.petLoyalty;
      this.petHunger = bonuses.petHunger;
      this.petId = bonuses.petId;
      this.petName = bonuses.petName;
      
      return bonuses;
    } catch (error) {
      console.error('Ошибка при инициализации питомца для боя:', error);
      this.hasActivePet = false;
      return null;
    }
  }
  
  // Получение боевых бонусов от питомца
  getBonuses() {
    if (!this.hasActivePet || !this.petBonuses) {
      return null;
    }
    
    // Если питомец сбежал, бонусы не применяются
    if (this.fled) {
      return null;
    }
    
    return this.petBonuses;
  }
  
  // Получение стихийного бонуса питомца
  getElementalBonus() {
    if (!this.hasActivePet || !this.petBonuses || this.fled) {
      return null;
    }
    
    return this.petBonuses.elementalBonus;
  }
  
  // Проверка на возможное бегство питомца из боя
  async checkForFlee() {
    if (!this.hasActivePet || this.fled) {
      return false;
    }
    
    try {
      const { willFlee, fleeChance } = await checkPetFlee();
      
      if (willFlee) {
        this.fled = true;
        console.log(`Питомец ${this.petName} сбежал из боя (шанс: ${fleeChance}%)`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка при проверке бегства питомца:', error);
      return false;
    }
  }
  
  // Использование способности питомца
  async useAbility(abilityId) {
    if (!this.hasActivePet || this.fled) {
      return { success: false, message: 'Нет активного питомца или питомец сбежал' };
    }
    
    // Проверяем, есть ли такая способность у питомца
    const ability = this.petAbilities.find(a => a.id === abilityId);
    if (!ability) {
      return { success: false, message: 'Способность не найдена у данного питомца' };
    }
    
    try {
      const result = await usePetAbility(abilityId, this.battleId);
      
      if (result.success) {
        this.abilityUsed = true;
        
        // Обновляем статус питомца
        this.petHunger = result.petStatus.hunger;
        this.petLoyalty = result.petStatus.loyalty;
        
        // Проверяем, не сбежит ли питомец после использования способности
        const shouldCheckFlee = this.petHunger < 20 || this.petLoyalty < 30;
        if (shouldCheckFlee) {
          await this.checkForFlee();
        }
        
        return {
          success: true,
          ability: result.ability,
          fled: this.fled
        };
      } else {
        return { success: false, message: 'Не удалось использовать способность' };
      }
    } catch (error) {
      console.error('Ошибка при использовании способности питомца:', error);
      return { success: false, message: 'Произошла ошибка при использовании способности' };
    }
  }
  
  // Добавление нанесенного урона к статистике
  addDamageDealt(damage) {
    if (this.hasActivePet && !this.fled) {
      this.damageDealt += damage;
    }
  }
  
  // Завершение боя и обновление статистики питомца
  async finalizeCombat(victory) {
    if (!this.hasActivePet) {
      return { success: true, petUpdated: false };
    }
    
    try {
      const result = await processBattleResults({
        battleId: this.battleId,
        victory,
        damageDealt: this.damageDealt,
        fled: this.fled
      });
      
      return result;
    } catch (error) {
      console.error('Ошибка при финализации боя для питомца:', error);
      return { success: false, error: 'Не удалось обновить статистику питомца' };
    }
  }
  
  // Получение доступных способностей питомца
  getAvailableAbilities() {
    if (!this.hasActivePet || this.fled) {
      return [];
    }
    
    return this.petAbilities;
  }
  
  // Проверка состояния питомца
  getPetStatus() {
    if (!this.hasActivePet) {
      return { hasActivePet: false };
    }
    
    return {
      hasActivePet: true,
      petId: this.petId,
      petName: this.petName,
      petElement: this.petElement,
      petLoyalty: this.petLoyalty,
      petHunger: this.petHunger,
      fled: this.fled
    };
  }
}

export default SpiritPetCombatIntegration;