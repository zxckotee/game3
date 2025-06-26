module.exports = (sequelize, DataTypes) => {
  const WeatherSystem = sequelize.define('WeatherSystem', {
    // Время
    hour: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12
    },
    minute: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    dayCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    
    // Погода
    currentWeather: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'clear' // ясно, облачно, дождь, гроза, туман, снег
    },
    weatherIntensity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0 // от 0.1 до 2.0
    },
    nextWeatherChange: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 180 // через сколько минут сменится погода
    },
    
    // День/Ночь
    isDayTime: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    
    // Сезон
    currentSeason: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'spring' // весна, лето, осень, зима
    },
    seasonDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1 // день сезона
    },
    seasonLength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30 // дней в сезоне
    },
    
    // Особые события
    activeEvent: {
      type: DataTypes.STRING,
      allowNull: true // особое погодное событие
    },
    eventRemainingTime: {
      type: DataTypes.INTEGER,
      allowNull: true // время до окончания события в минутах
    },
    
    // Эффекты погоды
    weatherEffects: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [] // массив эффектов
    },
    
    // ID локации, к которой привязана погода
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Locations',
        key: 'id'
      }
    },
    
    // Прогноз погоды (для отображения игроку)
    forecast: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [] // массив прогнозируемых погодных условий
    }
  });

  return WeatherSystem;
};
