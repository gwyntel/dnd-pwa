/**
 * localStorage wrapper for D&D PWA
 * Handles all data persistence with schema validation
 */

const STORAGE_KEY = 'dnd_pwa_data';
const SCHEMA_VERSION = '1.0.0';

// Default data structure
const DEFAULT_DATA = {
  version: SCHEMA_VERSION,
  lastModified: new Date().toISOString(),
  settings: {
    defaultNarrativeModel: null,
    theme: 'auto',
    autoSave: true,
    diceAnimation: true,
    hasSeenTutorial: false
  },
  characterTemplates: [
    {
      id: 'template_fighter',
      name: 'Brave Fighter',
      description: 'Strong warrior good at melee combat. High HP and armor.',
      race: 'Human',
      class: 'Fighter',
      level: 1,
      stats: { 
        strength: 16, 
        dexterity: 12, 
        constitution: 14, 
        intelligence: 10, 
        wisdom: 11, 
        charisma: 8 
      },
      maxHP: 12,
      armorClass: 16,
      skills: ['Athletics', 'Intimidation'],
      inventory: [
        { item: 'Longsword', equipped: true, quantity: 1 },
        { item: 'Chain Mail', equipped: true, quantity: 1 },
        { item: 'Shield', equipped: true, quantity: 1 },
        { item: 'Healing Potion', equipped: false, quantity: 2 }
      ],
      backstory: 'A brave warrior trained in the art of combat.'
    },
    {
      id: 'template_wizard',
      name: 'Wise Wizard',
      description: 'Powerful spellcaster with high intelligence. Low HP but devastating magic.',
      race: 'Elf',
      class: 'Wizard',
      level: 1,
      stats: { 
        strength: 8, 
        dexterity: 14, 
        constitution: 12, 
        intelligence: 16, 
        wisdom: 13, 
        charisma: 10 
      },
      maxHP: 8,
      armorClass: 12,
      skills: ['Arcana', 'Investigation'],
      inventory: [
        { item: 'Quarterstaff', equipped: true, quantity: 1 },
        { item: 'Spellbook', equipped: false, quantity: 1 },
        { item: 'Robes', equipped: true, quantity: 1 },
        { item: 'Component Pouch', equipped: false, quantity: 1 }
      ],
      backstory: 'A scholar of the arcane arts seeking knowledge and power.'
    },
    {
      id: 'template_rogue',
      name: 'Cunning Rogue',
      description: 'Stealthy and agile. Excels at sneaking and dealing critical strikes.',
      race: 'Halfling',
      class: 'Rogue',
      level: 1,
      stats: { 
        strength: 10, 
        dexterity: 16, 
        constitution: 12, 
        intelligence: 13, 
        wisdom: 11, 
        charisma: 14 
      },
      maxHP: 10,
      armorClass: 14,
      skills: ['Stealth', 'Sleight of Hand', 'Deception'],
      inventory: [
        { item: 'Shortsword', equipped: true, quantity: 1 },
        { item: 'Dagger', equipped: true, quantity: 2 },
        { item: 'Leather Armor', equipped: true, quantity: 1 },
        { item: 'Thieves\' Tools', equipped: false, quantity: 1 }
      ],
      backstory: 'A nimble thief with a mysterious past and quick reflexes.'
    },
    {
      id: 'template_cleric',
      name: 'Holy Cleric',
      description: 'Divine healer and support. Can heal allies and turn undead.',
      race: 'Dwarf',
      class: 'Cleric',
      level: 1,
      stats: { 
        strength: 14, 
        dexterity: 10, 
        constitution: 14, 
        intelligence: 11, 
        wisdom: 16, 
        charisma: 12 
      },
      maxHP: 11,
      armorClass: 15,
      skills: ['Medicine', 'Religion'],
      inventory: [
        { item: 'Mace', equipped: true, quantity: 1 },
        { item: 'Scale Mail', equipped: true, quantity: 1 },
        { item: 'Shield', equipped: true, quantity: 1 },
        { item: 'Holy Symbol', equipped: false, quantity: 1 }
      ],
      backstory: 'A devoted servant of the gods, bringing healing and hope to those in need.'
    }
  ],
  characters: [],
  games: []
};

/**
 * Load data from localStorage
 * @returns {Object} The stored data or default data if none exists
 */
export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_DATA };
    }
    
    const data = JSON.parse(stored);
    
    // Validate schema version
    if (data.version !== SCHEMA_VERSION) {
      console.warn(`Schema version mismatch. Expected ${SCHEMA_VERSION}, got ${data.version}`);
      // TODO: Implement migration logic in future versions
    }
    
    return data;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return { ...DEFAULT_DATA };
  }
}

/**
 * Save data to localStorage
 * @param {Object} data - The data to save
 */
export function saveData(data) {
  try {
    data.lastModified = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    throw error;
  }
}

/**
 * Debounced save function to prevent excessive writes
 */
let saveTimeout = null;
export function debouncedSave(data, delay = 300) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveData(data);
  }, delay);
}

/**
 * Export data as JSON file
 * @param {Object} data - The data to export
 * @param {string} filename - Optional filename
 */
export function exportData(data, filename = `dnd-pwa-backup-${Date.now()}.json`) {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Import data from JSON file
 * @param {File} file - The file to import
 * @returns {Promise<Object>} The imported data
 */
export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Basic validation
        if (!data.version || !data.settings || !data.characters || !data.games) {
          throw new Error('Invalid data format');
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse import file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Clear all data (with confirmation)
 */
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

/**
 * Get storage usage info
 * @returns {Object} Storage usage information
 */
export function getStorageInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const bytes = data ? new Blob([data]).size : 0;
    const kb = (bytes / 1024).toFixed(2);
    
    return {
      bytes,
      kb,
      characterCount: loadData().characters.length,
      gameCount: loadData().games.length
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { bytes: 0, kb: '0', characterCount: 0, gameCount: 0 };
  }
}
