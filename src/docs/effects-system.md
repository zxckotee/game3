# Effects System Documentation

## Overview

The Effects System is designed to collect, synchronize, and apply status effects from various sources throughout the game. The system aggregates effects from different sources (weather, location, sect, equipment, etc.) and applies them consistently to the player's stats and gameplay.

## Key Components

### Effect Data Structure

Each effect has the following structure:
```javascript
{
  id: "unique_effect_id",          // Unique identifier for the effect
  type: "effect_type",             // Type of effect (e.g., 'combat_damage', 'stealth', etc.)
  name: "Effect Name",             // Display name of the effect
  modifier: 5,                     // Numerical value/modifier (can be positive or negative)
  source: "source_name",           // Source of the effect (e.g., 'weather', 'sect', etc.)
  icon: "✨",                      // Icon to display
  description: "Effect description" // Optional description
}
```

### Aggregated Effects Object

When collected, effects are organized in the following structure:
```javascript
{
  // Flat list of all effects
  all: [effect1, effect2, ...],
  
  // Effects grouped by type
  grouped: {
    "effect_type1": {
      type: "effect_type1",
      name: "Effect Type Name",
      effects: [effect1, effect2, ...],
      totalModifier: 15  // Sum of all modifiers for this type
    },
    "effect_type2": { /* ... */ }
  },
  
  // Effects grouped by source
  sources: [
    {
      id: "source_id",
      name: "Source Name",
      effects: [effect1, effect2, ...]
    }
  ],
  
  // Timestamp for last update
  lastUpdate: 1713045987654
}
```

## Main Files

1. **src/utils/effectsUtils.js**: Core utilities for effect handling
   - `syncStatusEffects()` - Main function to collect and synchronize effects
   - Helper functions for formatting and display

2. **src/utils/effectsUpdater.js**: Updates effects when time changes
   - `handleTimeBasedEffectsUpdate()` - Updates effects when time changes
   - `recalculatePlayerEffectsReducer()` - Reducer for recalculating effects
   - `effectsUpdaterMiddleware()` - Middleware to automate effect updates

3. **src/context/reducers/playerReducer.js**: Applies effects to player state
   - Handles `RECALCULATE_PLAYER_EFFECTS` action
   - Handles `UPDATE_PLAYER_STATUS_EFFECTS` action

## UI Components

1. **src/components/ui/ActiveEffectsPanel.js**: Displays active effects in the UI
   - Groups effects by source or type
   - Shows detailed effect information

2. **src/components/combat/StatusEffects.js**: Displays effects in combat
   - Shows combat-relevant effects
   - Formats effect values for combat display

3. **src/components/combat/EffectsSynchronizer.js**: Syncs effects to combat system
   - Maps player effects to combat effects
   - Updates combat state when effects change

## Effect Sources

Effects are collected from multiple sources:

1. **Weather**: From `state.world.weather` - affects combat damage, stealth, and resource bonuses
2. **Location**: From `state.world.currentLocation` - various effects based on location
3. **Sect**: From `state.player.sect` - cultivation bonuses, resource gathering, etc.
4. **Equipment**: From `state.player.equipmentBonuses` - armor, weapon effects
5. **Spirit Pets**: From `state.spiritPets.activePet` - pet bonuses and abilities
6. **Temporary Effects**: From `state.player.temporaryEffects` - potions, techniques, etc.

## Workflow

1. The system regularly recalculates effects when:
   - Game time changes (via `GameTimeUpdater.js`)
   - Weather changes (via `weatherMiddleware.js`)
   - Player equips/unequips items
   - Other relevant state changes

2. When recalculation is triggered:
   - `syncStatusEffects()` collects effects from all sources
   - Effects are grouped and processed
   - Player state is updated with new effects
   - UI components display the changes

3. Combat synchronization:
   - When in combat, `EffectsSynchronizer.js` maps relevant effects to combat system
   - Only combat-relevant effects are applied during battles

## Debugging

Effects can be debugged in several ways:
1. Console logs in `effectsUpdater.js` show effect recalculation
2. The `ActiveEffectsPanel` component displays current active effects
3. Custom events like `effects_update_required` can be monitored

## Integration Guide

To add a new effect source:

1. Update `syncStatusEffects()` in `effectsUtils.js` to collect from the new source
2. Ensure the effects follow the standard format (with id, type, modifier, etc.)
3. Trigger recalculation when the source changes with:
   ```javascript
   dispatch({ type: 'RECALCULATE_PLAYER_EFFECTS' });
   ```
4. Optional: Fire the custom event to ensure all components update:
   ```javascript
   window.dispatchEvent(new CustomEvent('effects_update_required', { 
     detail: { time: Date.now() } 
   }));
   ```
