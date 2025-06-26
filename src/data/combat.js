/**
 * Данные для боевой системы
 */

// Типы целей для техник
const targetTypes = {
  SELF: 'self',         // Применяется к себе
  SINGLE: 'single',     // Применяется к одной цели
  AREA: 'area',         // Применяется ко всем целям в области
  TEAM: 'team'          // Применяется ко всей команде
};

// Типы урона
const damageTypes = {
  PHYSICAL: 'physical', // Физический урон
  FIRE: 'fire',         // Огненный урон
  WATER: 'water',       // Водный урон
  EARTH: 'earth',       // Земляной урон
  WIND: 'wind',         // Воздушный урон
  LIGHTNING: 'lightning', // Урон молнией
  POISON: 'poison',     // Ядовитый урон
  SPIRIT: 'spirit'      // Духовный урон
};

// Статусные эффекты
const statusEffects = {
  // Положительные эффекты (баффы)
  STRENGTH: {
    id: 'strength',
    name: 'Сила',
    icon: '💪',
    type: 'buff',
    duration: 3,
    effect: (level) => ({ damageBonus: 0.2 * level })
  },
  DEFENSE: {
    id: 'defense',
    name: 'Защита',
    icon: '🛡️',
    type: 'buff',
    duration: 3,
    effect: (level) => ({ defenseBonus: 0.3 * level })
  },
  REGENERATION: {
    id: 'regeneration',
    name: 'Регенерация',
    icon: '💚',
    type: 'buff',
    duration: 3,
    tickRate: 1,
    effect: (level) => ({ healing: 5 * level })
  },
  ENERGY_FLOW: {
    id: 'energy_flow',
    name: 'Поток энергии',
    icon: '⚡',
    type: 'buff',
    duration: 3,
    tickRate: 1,
    effect: (level) => ({ energyRegen: 5 * level })
  },
  
  // Отрицательные эффекты (дебаффы)
  WEAKNESS: {
    id: 'weakness',
    name: 'Слабость',
    icon: '💔',
    type: 'debuff',
    duration: 2,
    effect: (level) => ({ damageReduction: 0.2 * level })
  },
  POISON: {
    id: 'poison',
    name: 'Отравление',
    icon: '☠️',
    type: 'debuff',
    duration: 3,
    tickRate: 1,
    effect: (level) => ({ damage: 5 * level })
  },
  BURN: {
    id: 'burn',
    name: 'Ожог',
    icon: '🔥',
    type: 'debuff',
    duration: 2,
    tickRate: 1,
    effect: (level) => ({ damage: 8 * level })
  },
  STUN: {
    id: 'stun',
    name: 'Оглушение',
    icon: '💫',
    type: 'debuff',
    duration: 1,
    effect: (level) => ({ skipTurn: true })
  }
};

// Техники
const techniques = {
  // Базовые техники
  'basic_strike': {
    id: 'basic_strike',
    name: 'Базовый удар',
    description: 'Простой удар, наносящий физический урон',
    icon: '⚔️',
    targetType: targetTypes.SINGLE,
    damageType: damageTypes.PHYSICAL,
    damage: 15,
    energyCost: 10,
    cooldown: 0,
    effects: []
  },
  'defensive_stance': {
    id: 'defensive_stance',
    name: 'Защитная стойка',
    description: 'Принимает защитную стойку, снижающую получаемый урон',
    icon: '🛡️',
    targetType: targetTypes.SELF,
    damageType: null,
    damage: 0,
    energyCost: 15,
    cooldown: 2,
    effects: [statusEffects.DEFENSE]
  },
  
  // Техники огненного пути
  'fire_palm': {
    id: 'fire_palm',
    name: 'Огненная ладонь',
    description: 'Удар ладонью, наполненной огненной энергией',
    icon: '🔥',
    targetType: targetTypes.SINGLE,
    damageType: damageTypes.FIRE,
    damage: 25,
    energyCost: 20,
    cooldown: 1,
    effects: [
      {
        id: 'burn',
        name: 'Ожог',
        icon: '🔥',
        type: 'debuff',
        duration: 2,
        damage_over_time: 5
      }
    ]
  },
  'flame_burst': {
    id: 'flame_burst',
    name: 'Взрыв пламени',
    description: 'Создает взрыв пламени, поражающий всех противников',
    icon: '💥',
    targetType: targetTypes.AREA,
    damageType: damageTypes.FIRE,
    damage: 15,
    energyCost: 30,
    cooldown: 3,
    effects: []
  },
  
  // Техники водного пути
  'water_shield': {
    id: 'water_shield',
    name: 'Водяной щит',
    description: 'Создает щит из воды, защищающий от атак',
    icon: '🌊',
    targetType: targetTypes.SELF,
    damageType: null,
    damage: 0,
    healing: 0,
    energyCost: 25,
    cooldown: 3,
    effects: [
      {
        id: 'water_shield',
        name: 'Водяной щит',
        icon: '🌊',
        type: 'buff',
        duration: 3,
        damage_reduction: 0.3
      }
    ]
  },
  'healing_rain': {
    id: 'healing_rain',
    name: 'Исцеляющий дождь',
    description: 'Вызывает дождь, восстанавливающий здоровье всей команде',
    icon: '💧',
    targetType: targetTypes.TEAM,
    damageType: null,
    damage: 0,
    healing: 20,
    energyCost: 35,
    cooldown: 4,
    effects: [
      {
        id: 'regeneration',
        name: 'Регенерация',
        icon: '💚',
        type: 'buff',
        duration: 2,
        healing_over_time: 5
      }
    ]
  },
  
  // Техники земляного пути
  'stone_skin': {
    id: 'stone_skin',
    name: 'Каменная кожа',
    description: 'Покрывает тело каменной оболочкой, значительно увеличивая защиту',
    icon: '🪨',
    targetType: targetTypes.SELF,
    damageType: null,
    damage: 0,
    energyCost: 30,
    cooldown: 4,
    effects: [
      {
        id: 'stone_skin',
        name: 'Каменная кожа',
        icon: '🪨',
        type: 'buff',
        duration: 3,
        damage_reduction: 0.5
      }
    ]
  },
  'earth_spike': {
    id: 'earth_spike',
    name: 'Земляной шип',
    description: 'Создает острый шип из земли, наносящий урон и замедляющий противника',
    icon: '⛰️',
    targetType: targetTypes.SINGLE,
    damageType: damageTypes.EARTH,
    damage: 20,
    energyCost: 25,
    cooldown: 2,
    effects: [
      {
        id: 'slow',
        name: 'Замедление',
        icon: '🐌',
        type: 'debuff',
        duration: 2,
        energy_regen: -5
      }
    ]
  },
  
  // Техники воздушного пути
  'wind_blade': {
    id: 'wind_blade',
    name: 'Клинок ветра',
    description: 'Создает острый клинок из воздуха, наносящий урон',
    icon: '🌪️',
    targetType: targetTypes.SINGLE,
    damageType: damageTypes.WIND,
    damage: 30,
    energyCost: 25,
    cooldown: 2,
    effects: []
  },
  'cyclone': {
    id: 'cyclone',
    name: 'Циклон',
    description: 'Создает мощный циклон, наносящий урон всем противникам',
    icon: '🌀',
    targetType: targetTypes.AREA,
    damageType: damageTypes.WIND,
    damage: 20,
    energyCost: 35,
    cooldown: 4,
    effects: [
      {
        id: 'disorientation',
        name: 'Дезориентация',
        icon: '😵',
        type: 'debuff',
        duration: 1,
        damage_reduction: -0.2
      }
    ]
  },
  
  // Техники молнии
  'lightning_strike': {
    id: 'lightning_strike',
    name: 'Удар молнии',
    description: 'Призывает молнию, наносящую большой урон одной цели',
    icon: '⚡',
    targetType: targetTypes.SINGLE,
    damageType: damageTypes.LIGHTNING,
    damage: 40,
    energyCost: 35,
    cooldown: 3,
    effects: [
      {
        id: 'paralysis',
        name: 'Паралич',
        icon: '⚡',
        type: 'debuff',
        duration: 1,
        energy_regen: -10
      }
    ]
  },
  'thunder_clap': {
    id: 'thunder_clap',
    name: 'Громовой хлопок',
    description: 'Создает громовую волну, оглушающую противников',
    icon: '🌩️',
    targetType: targetTypes.AREA,
    damageType: damageTypes.LIGHTNING,
    damage: 15,
    energyCost: 30,
    cooldown: 4,
    effects: [
      {
        id: 'stun',
        name: 'Оглушение',
        icon: '💫',
        type: 'debuff',
        duration: 1
      }
    ]
  },
  
  // Техники яда
  'poison_dart': {
    id: 'poison_dart',
    name: 'Ядовитый дротик',
    description: 'Метает ядовитый дротик, наносящий урон и отравляющий цель',
    icon: '🧪',
    targetType: targetTypes.SINGLE,
    damageType: damageTypes.POISON,
    damage: 15,
    energyCost: 20,
    cooldown: 2,
    effects: [
      {
        id: 'poison',
        name: 'Отравление',
        icon: '☠️',
        type: 'debuff',
        duration: 3,
        damage_over_time: 8
      }
    ]
  },
  'toxic_cloud': {
    id: 'toxic_cloud',
    name: 'Токсичное облако',
    description: 'Создает облако ядовитого газа, отравляющее всех противников',
    icon: '☁️',
    targetType: targetTypes.AREA,
    damageType: damageTypes.POISON,
    damage: 10,
    energyCost: 30,
    cooldown: 4,
    effects: [
      {
        id: 'poison',
        name: 'Отравление',
        icon: '☠️',
        type: 'debuff',
        duration: 2,
        damage_over_time: 5
      }
    ]
  },
  
  // Техники духовного пути
  'spirit_drain': {
    id: 'spirit_drain',
    name: 'Поглощение духа',
    description: 'Поглощает духовную энергию противника, восстанавливая свою',
    icon: '👻',
    targetType: targetTypes.SINGLE,
    damageType: damageTypes.SPIRIT,
    damage: 20,
    energyCost: 25,
    cooldown: 3,
    effects: [
      {
        id: 'energy_drain',
        name: 'Истощение энергии',
        icon: '🔋',
        type: 'debuff',
        duration: 2,
        energy_regen: -5
      }
    ]
  },
  'spiritual_healing': {
    id: 'spiritual_healing',
    name: 'Духовное исцеление',
    description: 'Использует духовную энергию для исцеления себя или союзника',
    icon: '✨',
    targetType: targetTypes.SINGLE,
    damageType: null,
    damage: 0,
    healing: 35,
    energyCost: 30,
    cooldown: 3,
    effects: [
      {
        id: 'spiritual_blessing',
        name: 'Духовное благословение',
        icon: '🙏',
        type: 'buff',
        duration: 2,
        healing_over_time: 10
      }
    ]
  }
};

module.exports = {
  targetTypes,
  damageTypes,
  statusEffects,
  techniques
};
