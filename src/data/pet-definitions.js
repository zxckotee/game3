/**
 * Определения и константы для системы духовных питомцев
 */

// Типы питомцев
const petTypes = {
  FIRE: 'FIRE',     // Огненный
  WATER: 'WATER',   // Водный
  EARTH: 'EARTH',   // Земляной
  AIR: 'AIR',       // Воздушный
  LIGHTNING: 'LIGHTNING', // Грозовой
  METAL: 'METAL',   // Металлический
  WOOD: 'WOOD',     // Древесный
  VOID: 'VOID',     // Пустотный
  LIGHT: 'LIGHT'    // Светлый
};

// Названия типов питомцев на русском
const petTypeNames = {
  FIRE: 'Огненный',
  WATER: 'Водный',
  EARTH: 'Земляной',
  AIR: 'Воздушный',
  LIGHTNING: 'Грозовой',
  METAL: 'Металлический',
  WOOD: 'Древесный',
  VOID: 'Пустотный',
  LIGHT: 'Светлый'
};

// Базовые характеристики питомцев по типам
const petBaseStats = {
  FIRE: {
    strength: 15,
    intelligence: 10,
    agility: 12,
    vitality: 8,
    spirit: 10
  },
  WATER: {
    strength: 8,
    intelligence: 15,
    agility: 10,
    vitality: 12,
    spirit: 10
  },
  EARTH: {
    strength: 12,
    intelligence: 8,
    agility: 6,
    vitality: 18,
    spirit: 10
  },
  AIR: {
    strength: 7,
    intelligence: 12,
    agility: 18,
    vitality: 7,
    spirit: 10
  },
  LIGHTNING: {
    strength: 10,
    intelligence: 13,
    agility: 15,
    vitality: 7,
    spirit: 10
  },
  METAL: {
    strength: 17,
    intelligence: 8,
    agility: 8,
    vitality: 15,
    spirit: 10
  },
  WOOD: {
    strength: 10,
    intelligence: 10,
    agility: 8,
    vitality: 14,
    spirit: 12
  },
  VOID: {
    strength: 12,
    intelligence: 12,
    agility: 12,
    vitality: 7,
    spirit: 15
  },
  LIGHT: {
    strength: 10,
    intelligence: 14,
    agility: 10,
    vitality: 10,
    spirit: 14
  }
};

// Способности питомцев по типам
const petAbilities = {
  FIRE: [
    { 
      id: 'fire_bolt', 
      name: 'Огненный снаряд', 
      unlockLevel: 1, 
      description: 'Атака огненным снарядом, наносит урон огнем', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'fire',
        power: 30,
        scaling: 'strength'
      }
    },
    { 
      id: 'fire_shield', 
      name: 'Огненный щит', 
      unlockLevel: 5, 
      description: 'Создает щит из огня, снижающий урон и наносящий урон в ближнем бою', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'buff',
        duration: 3,
        defense: 20,
        counterDamage: {
          element: 'fire',
          power: 15
        }
      }
    },
    { 
      id: 'fire_explosion', 
      name: 'Огненный взрыв', 
      unlockLevel: 10, 
      description: 'Мощный взрыв, наносящий урон всем врагам вокруг', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'aoe_damage',
        element: 'fire',
        power: 50,
        radius: 5,
        scaling: 'strength'
      }
    }
  ],
  
  WATER: [
    { 
      id: 'water_arrow', 
      name: 'Водная стрела', 
      unlockLevel: 1, 
      description: 'Атака водной стрелой, наносит урон водой', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'water',
        power: 25,
        scaling: 'intelligence'
      }
    },
    { 
      id: 'healing_wave', 
      name: 'Волна исцеления', 
      unlockLevel: 5, 
      description: 'Исцеляет владельца, восстанавливая здоровье', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'healing',
        power: 40,
        scaling: 'intelligence'
      }
    },
    { 
      id: 'water_prison', 
      name: 'Водная тюрьма', 
      unlockLevel: 10, 
      description: 'Запирает противника в водной тюрьме, временно обездвиживая его', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'control',
        duration: 2,
        controlType: 'immobilize'
      }
    }
  ],
  
  EARTH: [
    { 
      id: 'stone_throw', 
      name: 'Бросок камня', 
      unlockLevel: 1, 
      description: 'Бросает камень во врага, вызывая оглушение', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'earth',
        power: 20,
        scaling: 'strength',
        additionalEffect: {
          type: 'stun',
          chance: 0.2,
          duration: 1
        }
      }
    },
    { 
      id: 'stone_skin', 
      name: 'Каменная кожа', 
      unlockLevel: 5, 
      description: 'Покрывает владельца каменной защитой, увеличивая устойчивость к урону', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'buff',
        duration: 3,
        defense: 40
      }
    },
    { 
      id: 'earthquake', 
      name: 'Землетрясение', 
      unlockLevel: 10, 
      description: 'Вызывает локальное землетрясение, наносящее урон и замедляющее врагов', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'aoe_damage',
        element: 'earth',
        power: 40,
        radius: 6,
        scaling: 'strength',
        additionalEffect: {
          type: 'slow',
          power: 0.3,
          duration: 2
        }
      }
    }
  ],
  
  AIR: [
    { 
      id: 'wind_slice', 
      name: 'Воздушный срез', 
      unlockLevel: 1, 
      description: 'Атакует врага острыми потоками воздуха', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'air',
        power: 20,
        scaling: 'agility',
        additionalEffect: {
          type: 'bleed',
          damage: 5,
          duration: 2
        }
      }
    },
    { 
      id: 'wind_rush', 
      name: 'Порыв ветра', 
      unlockLevel: 5, 
      description: 'Ускоряет владельца, увеличивая скорость атаки и передвижения', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'buff',
        duration: 3,
        attackSpeed: 0.2,
        moveSpeed: 0.3
      }
    },
    { 
      id: 'tornado', 
      name: 'Торнадо', 
      unlockLevel: 10, 
      description: 'Вызывает торнадо, наносящее урон и разбрасывающее врагов', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'aoe_damage',
        element: 'air',
        power: 35,
        radius: 4,
        scaling: 'agility',
        additionalEffect: {
          type: 'knockback',
          distance: 3
        }
      }
    }
  ],
  
  LIGHTNING: [
    { 
      id: 'lightning_bolt', 
      name: 'Молния', 
      unlockLevel: 1, 
      description: 'Поражает противника молнией, нанося урон и замедляя', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'lightning',
        power: 30,
        scaling: 'intelligence',
        additionalEffect: {
          type: 'slow',
          power: 0.2,
          duration: 1
        }
      }
    },
    { 
      id: 'static_field', 
      name: 'Статическое поле', 
      unlockLevel: 5, 
      description: 'Создает поле статики вокруг владельца, наносящее урон приблизившимся врагам', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'aura',
        duration: 3,
        radius: 3,
        damage: {
          element: 'lightning',
          power: 15,
          interval: 1
        }
      }
    },
    { 
      id: 'chain_lightning', 
      name: 'Цепная молния', 
      unlockLevel: 10, 
      description: 'Молния, перескакивающая между несколькими целями', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'chain_damage',
        element: 'lightning',
        power: 40,
        targets: 3,
        scaling: 'intelligence',
        falloff: 0.2
      }
    }
  ],
  
  METAL: [
    { 
      id: 'metal_spike', 
      name: 'Металлический шип', 
      unlockLevel: 1, 
      description: 'Создает острый шип, пробивающий защиту врага', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'metal',
        power: 25,
        scaling: 'strength',
        armorPenetration: 0.2
      }
    },
    { 
      id: 'metal_armor', 
      name: 'Металлическая броня', 
      unlockLevel: 5, 
      description: 'Покрывает владельца металлической броней, значительно увеличивая защиту', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'buff',
        duration: 3,
        defense: 50,
        movementPenalty: 0.1
      }
    },
    { 
      id: 'blade_storm', 
      name: 'Буря клинков', 
      unlockLevel: 10, 
      description: 'Создает вихрь металлических лезвий вокруг владельца', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'aoe_damage',
        element: 'metal',
        power: 45,
        radius: 4,
        scaling: 'strength',
        hits: 3,
        interval: 1
      }
    }
  ],
  
  WOOD: [
    { 
      id: 'thorn_throw', 
      name: 'Бросок шипа', 
      unlockLevel: 1, 
      description: 'Бросает отравленный шип во врага', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'wood',
        power: 15,
        scaling: 'intelligence',
        additionalEffect: {
          type: 'poison',
          damage: 5,
          duration: 3
        }
      }
    },
    { 
      id: 'regeneration', 
      name: 'Регенерация', 
      unlockLevel: 5, 
      description: 'Усиливает естественную регенерацию владельца', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'healing_over_time',
        power: 10,
        duration: 5,
        interval: 1,
        scaling: 'vitality'
      }
    },
    { 
      id: 'entangling_roots', 
      name: 'Опутывающие корни', 
      unlockLevel: 10, 
      description: 'Опутывает противников корнями, обездвиживая их и нанося урон', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'aoe_control',
        element: 'wood',
        radius: 5,
        damage: {
          power: 20,
          scaling: 'intelligence'
        },
        control: {
          type: 'root',
          duration: 2
        }
      }
    }
  ],
  
  VOID: [
    { 
      id: 'void_touch', 
      name: 'Прикосновение пустоты', 
      unlockLevel: 1, 
      description: 'Атакует врага энергией пустоты, игнорируя часть защиты', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'void',
        power: 20,
        scaling: 'spirit',
        defenseIgnore: 0.3
      }
    },
    { 
      id: 'void_shield', 
      name: 'Щит пустоты', 
      unlockLevel: 5, 
      description: 'Создает щит, поглощающий урон и восстанавливающий энергию', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'buff',
        duration: 3,
        absorbDamage: 40,
        energyReturn: 0.5
      }
    },
    { 
      id: 'void_collapse', 
      name: 'Схлопывание пустоты', 
      unlockLevel: 10, 
      description: 'Создает точку схлопывания пустоты, наносящую сильный урон в области', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'aoe_damage',
        element: 'void',
        power: 60,
        radius: 3,
        scaling: 'spirit',
        selfDamage: 10
      }
    }
  ],
  
  LIGHT: [
    { 
      id: 'light_beam', 
      name: 'Луч света', 
      unlockLevel: 1, 
      description: 'Поражает врага лучом яркого света', 
      energyCost: 10, 
      cooldown: 2,
      effect: {
        type: 'damage',
        element: 'light',
        power: 25,
        scaling: 'intelligence',
        additionalEffect: {
          type: 'blind',
          chance: 0.2,
          duration: 1
        }
      }
    },
    { 
      id: 'blessing', 
      name: 'Благословение', 
      unlockLevel: 5, 
      description: 'Благословляет владельца, увеличивая все характеристики', 
      energyCost: 20, 
      cooldown: 4,
      effect: {
        type: 'buff',
        duration: 3,
        allStats: 0.1
      }
    },
    { 
      id: 'purification', 
      name: 'Очищение', 
      unlockLevel: 10, 
      description: 'Очищает владельца от всех негативных эффектов и восстанавливает здоровье', 
      energyCost: 30, 
      cooldown: 6,
      effect: {
        type: 'cleanse',
        healing: {
          power: 30,
          scaling: 'spirit'
        }
      }
    }
  ]
};

// Ступени эволюции питомцев
const evolutionStages = {
  1: { name: 'Детеныш', statMultiplier: 1.0 },
  2: { name: 'Юный', statMultiplier: 1.2, requiredLevel: 5 },
  3: { name: 'Взрослый', statMultiplier: 1.5, requiredLevel: 10 },
  4: { name: 'Зрелый', statMultiplier: 1.8, requiredLevel: 15 },
  5: { name: 'Древний', statMultiplier: 2.2, requiredLevel: 20 }
};

// Локации для приручения питомцев
const petSpawnLocations = {
  'Огненная гора': [petTypes.FIRE, petTypes.METAL],
  'Лазурное озеро': [petTypes.WATER, petTypes.WOOD],
  'Каменный лес': [petTypes.EARTH, petTypes.WOOD],
  'Грозовые пики': [petTypes.LIGHTNING, petTypes.AIR],
  'Небесная долина': [petTypes.AIR, petTypes.LIGHT],
  'Мрачный лес': [petTypes.VOID, petTypes.WOOD],
  'Сверкающие пещеры': [petTypes.METAL, petTypes.EARTH],
  'Светящийся оазис': [petTypes.LIGHT, petTypes.WATER],
  'Бездонная пропасть': [petTypes.VOID, petTypes.EARTH]
};

// Расчет опыта, необходимого для повышения уровня
function calculateExpForLevel(level) {
  return Math.floor(50 * Math.pow(level, 1.5));
}

// Расчет бонусов к характеристикам от питомца для владельца
function calculateStatBonus(pet) {
  const evolutionBonus = evolutionStages[pet.evolutionStage].statMultiplier;
  return {
    strength: Math.floor(pet.strength * 0.1 * evolutionBonus),
    intelligence: Math.floor(pet.intelligence * 0.1 * evolutionBonus),
    agility: Math.floor(pet.agility * 0.1 * evolutionBonus),
    vitality: Math.floor(pet.vitality * 0.1 * evolutionBonus),
    spirit: Math.floor(pet.spirit * 0.1 * evolutionBonus)
  };
}

// Расчет боевых бонусов от питомца для владельца
function calculateCombatBonus(pet) {
  const evolutionBonus = evolutionStages[pet.evolutionStage].statMultiplier;
  const levelBonus = 1 + (pet.level * 0.05);
  
  let bonuses = {
    attack: Math.floor((pet.strength * 0.5 + pet.level) * evolutionBonus),
    defense: Math.floor((pet.vitality * 0.5 + pet.level) * evolutionBonus),
    speed: Math.floor(pet.agility * 0.3 * evolutionBonus),
    critChance: Math.floor(pet.agility * 0.1 * evolutionBonus),
    healthBonus: Math.floor(pet.vitality * evolutionBonus * levelBonus),
    energyBonus: Math.floor(pet.spirit * evolutionBonus * levelBonus)
  };
  
  // Элементальные бонусы в зависимости от типа питомца
  switch(pet.type) {
    case petTypes.FIRE:
      bonuses.fireResistance = Math.floor(10 * evolutionBonus);
      bonuses.fireDamage = Math.floor(pet.strength * 0.2 * evolutionBonus);
      break;
    case petTypes.WATER:
      bonuses.waterResistance = Math.floor(10 * evolutionBonus);
      bonuses.healingPower = Math.floor(pet.intelligence * 0.2 * evolutionBonus);
      break;
    case petTypes.EARTH:
      bonuses.earthResistance = Math.floor(10 * evolutionBonus);
      bonuses.physicalDefense = Math.floor(pet.vitality * 0.3 * evolutionBonus);
      break;
    case petTypes.AIR:
      bonuses.airResistance = Math.floor(10 * evolutionBonus);
      bonuses.dodgeChance = Math.floor(pet.agility * 0.2 * evolutionBonus);
      break;
    case petTypes.LIGHTNING:
      bonuses.lightningResistance = Math.floor(10 * evolutionBonus);
      bonuses.attackSpeed = Math.floor(pet.agility * 0.15 * evolutionBonus);
      break;
    case petTypes.METAL:
      bonuses.metalResistance = Math.floor(10 * evolutionBonus);
      bonuses.armorPenetration = Math.floor(pet.strength * 0.2 * evolutionBonus);
      break;
    case petTypes.WOOD:
      bonuses.woodResistance = Math.floor(10 * evolutionBonus);
      bonuses.healthRegen = Math.floor(pet.vitality * 0.2 * evolutionBonus);
      break;
    case petTypes.VOID:
      bonuses.voidResistance = Math.floor(10 * evolutionBonus);
      bonuses.defenseIgnore = Math.floor(pet.spirit * 0.2 * evolutionBonus);
      break;
    case petTypes.LIGHT:
      bonuses.lightResistance = Math.floor(10 * evolutionBonus);
      bonuses.allResistance = Math.floor(pet.spirit * 0.1 * evolutionBonus);
      break;
  }
  
  return bonuses;
}

module.exports = {
  petTypes,
  petTypeNames,
  petBaseStats,
  petAbilities,
  evolutionStages,
  petSpawnLocations,
  calculateExpForLevel,
  calculateStatBonus,
  calculateCombatBonus
};
