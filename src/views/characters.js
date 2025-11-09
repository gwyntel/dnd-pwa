/**
 * Characters View
 * List, create, and manage characters
 */

import { loadData, saveData } from '../utils/storage.js';
import { navigateTo } from '../router.js';

export function renderCharacters() {
  const app = document.getElementById('app');
  const data = loadData();
  
  app.innerHTML = `
    <nav>
      <div class="container">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/characters">Characters</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </div>
    </nav>
    
    <div class="container">
      <div class="flex justify-between align-center mb-3">
        <h1>Your Characters</h1>
        <button id="new-character-btn" class="btn">+ New Character</button>
      </div>
      
      ${data.characters.length === 0 ? renderEmptyState() : renderCharacterList(data.characters)}
    </div>
  `;
  
  // Event listeners
  document.getElementById('new-character-btn')?.addEventListener('click', () => {
    navigateTo('/characters/new');
  });
  
  // Character card click handlers
  document.querySelectorAll('.character-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-btn')) {
        const characterId = card.dataset.characterId;
        navigateTo(`/characters/edit/${characterId}`);
      }
    });
  });
  
  // Delete button handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const characterId = btn.dataset.characterId;
      deleteCharacter(characterId);
    });
  });
}

function renderEmptyState() {
  return `
    <div class="card text-center" style="padding: 3rem;">
      <h2>No Characters Yet</h2>
      <p class="text-secondary mb-3">Create your first character to begin your adventure!</p>
      <div class="flex gap-2 justify-center" style="flex-wrap: wrap;">
        <button id="quick-start-btn" class="btn">Quick Start (Random)</button>
        <button id="template-btn" class="btn-secondary">Use Template</button>
      </div>
    </div>
  `;
}

function renderCharacterList(characters) {
  return `
    <div class="grid grid-2">
      ${characters.map(char => `
        <div class="card character-card" data-character-id="${char.id}" style="cursor: pointer; position: relative;">
          <button class="delete-btn" data-character-id="${char.id}" style="position: absolute; top: 1rem; right: 1rem; padding: 0.5rem; background: var(--error-color); border-radius: 6px; border: none; color: white; cursor: pointer;">✕</button>
          <h3>${escapeHtml(char.name)}</h3>
          <p class="text-secondary">Level ${char.level} ${char.race} ${char.class}</p>
          <div class="flex gap-2 mt-2" style="flex-wrap: wrap;">
            <span class="badge">HP: ${char.maxHP}</span>
            <span class="badge">AC: ${char.armorClass}</span>
          </div>
          <div class="mt-2" style="font-size: 0.875rem;">
            <div class="flex justify-between">
              <span>STR: ${char.stats.strength}</span>
              <span>DEX: ${char.stats.dexterity}</span>
              <span>CON: ${char.stats.constitution}</span>
            </div>
            <div class="flex justify-between mt-1">
              <span>INT: ${char.stats.intelligence}</span>
              <span>WIS: ${char.stats.wisdom}</span>
              <span>CHA: ${char.stats.charisma}</span>
            </div>
          </div>
          ${char.fromTemplate ? `<p class="text-secondary mt-2" style="font-size: 0.75rem;">From template: ${char.fromTemplate}</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function deleteCharacter(characterId) {
  if (!confirm('Are you sure you want to delete this character? This cannot be undone.')) {
    return;
  }
  
  const data = loadData();
  data.characters = data.characters.filter(c => c.id !== characterId);
  saveData(data);
  
  // Re-render
  renderCharacters();
}

export function renderCharacterCreator(state = {}) {
  const app = document.getElementById('app');
  const data = loadData();
  const isEdit = state.params?.id;
  const character = isEdit ? data.characters.find(c => c.id === state.params.id) : null;
  
  // Initialize form data
  const formData = character || {
    name: '',
    race: 'Human',
    class: 'Fighter',
    level: 1,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    maxHP: 10,
    armorClass: 10,
    proficiencyBonus: 2,
    speed: 30,
    hitDice: '1d10',
    savingThrows: [],
    skills: [],
    proficiencies: {
      armor: [],
      weapons: [],
      tools: []
    },
    features: [],
    spells: [],
    inventory: [],
    backstory: ''
  };
  
  app.innerHTML = `
    <nav>
      <div class="container">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/characters">Characters</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </div>
    </nav>
    
    <div class="container">
      <div class="flex justify-between align-center mb-3">
        <h1>${isEdit ? 'Edit Character' : 'Create Character'}</h1>
        <a href="/characters" class="btn-secondary">Cancel</a>
      </div>
      
      ${!isEdit ? renderTemplateSelector(data.characterTemplates) : ''}
      
      <div class="card">
        <form id="character-form">
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Character Name *</label>
            <input type="text" id="char-name" value="${escapeHtml(formData.name)}" required placeholder="Enter character name">
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Race *</label>
              <select id="char-race">
                ${['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'].map(race => 
                  `<option value="${race}" ${formData.race === race ? 'selected' : ''}>${race}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Class *</label>
              <select id="char-class">
                ${['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock'].map(cls => 
                  `<option value="${cls}" ${formData.class === cls ? 'selected' : ''}>${cls}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Level</label>
            <input type="number" id="char-level" value="${formData.level}" min="1" max="20">
          </div>
          
          <h3 class="mb-2">Ability Scores</h3>
          <p class="text-secondary mb-2" style="font-size: 0.875rem;">Standard range: 8-18. Higher is better.</p>
          <div class="grid grid-2 mb-3">
            ${Object.entries(formData.stats).map(([stat, value]) => `
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; text-transform: uppercase;">${stat.substring(0, 3)}: ${value}</label>
                <input type="range" id="stat-${stat}" min="3" max="20" value="${value}" style="width: 100%;">
              </div>
            `).join('')}
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Max HP *</label>
              <input type="number" id="char-hp" value="${formData.maxHP}" min="1" required>
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Armor Class (AC) *</label>
              <input type="number" id="char-ac" value="${formData.armorClass}" min="1" required>
            </div>
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Speed (ft)</label>
              <input type="number" id="char-speed" value="${formData.speed}" min="0">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Hit Dice</label>
              <input type="text" id="char-hitdice" value="${formData.hitDice}" placeholder="e.g., 1d10">
            </div>
          </div>
          
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Skills (comma-separated)</label>
            <input type="text" id="char-skills" value="${formData.skills.join(', ')}" placeholder="e.g., Athletics, Stealth, Perception">
          </div>
          
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Features & Traits (comma-separated)</label>
            <input type="text" id="char-features" value="${formData.features.join(', ')}" placeholder="e.g., Second Wind, Sneak Attack">
          </div>
          
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Backstory (optional)</label>
            <textarea id="char-backstory" placeholder="Tell us about your character's history...">${escapeHtml(formData.backstory || '')}</textarea>
          </div>
          
          <button type="submit" class="btn" style="width: 100%;">${isEdit ? 'Save Changes' : 'Create Character'}</button>
        </form>
      </div>
    </div>
  `;
  
  // Update stat labels when sliders change
  Object.keys(formData.stats).forEach(stat => {
    const slider = document.getElementById(`stat-${stat}`);
    slider?.addEventListener('input', (e) => {
      const label = e.target.previousElementSibling;
      label.textContent = `${stat.substring(0, 3).toUpperCase()}: ${e.target.value}`;
    });
  });
  
  // Form submission
  document.getElementById('character-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCharacter(isEdit ? character.id : null);
  });
  
  // Template selection
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const templateId = card.dataset.templateId;
      applyTemplate(templateId);
    });
  });
}

function renderTemplateSelector(templates) {
  return `
    <div class="card mb-3">
      <h3>Quick Start Templates</h3>
      <p class="text-secondary mb-2">Choose a pre-built character or create your own below.</p>
      <div class="grid grid-2">
        ${templates.map(template => `
          <div class="template-card card" data-template-id="${template.id}" style="cursor: pointer; padding: 1rem;">
            <h4>${template.name}</h4>
            <p class="text-secondary" style="font-size: 0.875rem;">${template.description}</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">
              <strong>${template.race} ${template.class}</strong> - HP: ${template.maxHP}, AC: ${template.armorClass}
            </p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function applyTemplate(templateId) {
  const data = loadData();
  const template = data.characterTemplates.find(t => t.id === templateId);
  
  if (!template) return;
  
  // Fill form with template data
  document.getElementById('char-name').value = template.name;
  document.getElementById('char-race').value = template.race;
  document.getElementById('char-class').value = template.class;
  document.getElementById('char-level').value = template.level;
  document.getElementById('char-hp').value = template.maxHP;
  document.getElementById('char-ac').value = template.armorClass;
  document.getElementById('char-speed').value = template.speed;
  document.getElementById('char-hitdice').value = template.hitDice;
  document.getElementById('char-skills').value = template.skills.join(', ');
  document.getElementById('char-features').value = template.features.join(', ');
  document.getElementById('char-backstory').value = template.backstory;
  
  // Update stats
  Object.entries(template.stats).forEach(([stat, value]) => {
    const slider = document.getElementById(`stat-${stat}`);
    if (slider) {
      slider.value = value;
      slider.previousElementSibling.textContent = `${stat.substring(0, 3).toUpperCase()}: ${value}`;
    }
  });
  
  // Scroll to form
  document.getElementById('character-form').scrollIntoView({ behavior: 'smooth' });
}

function saveCharacter(existingId = null) {
  const data = loadData();
  
  const level = parseInt(document.getElementById('char-level').value);
  const profBonus = Math.floor((level - 1) / 4) + 2;
  
  const character = {
    id: existingId || `char_${Date.now()}`,
    name: document.getElementById('char-name').value.trim(),
    race: document.getElementById('char-race').value,
    class: document.getElementById('char-class').value,
    level: level,
    stats: {
      strength: parseInt(document.getElementById('stat-strength').value),
      dexterity: parseInt(document.getElementById('stat-dexterity').value),
      constitution: parseInt(document.getElementById('stat-constitution').value),
      intelligence: parseInt(document.getElementById('stat-intelligence').value),
      wisdom: parseInt(document.getElementById('stat-wisdom').value),
      charisma: parseInt(document.getElementById('stat-charisma').value)
    },
    maxHP: parseInt(document.getElementById('char-hp').value),
    armorClass: parseInt(document.getElementById('char-ac').value),
    proficiencyBonus: profBonus,
    speed: parseInt(document.getElementById('char-speed').value) || 30,
    hitDice: document.getElementById('char-hitdice').value.trim() || '1d10',
    savingThrows: existingId ? data.characters.find(c => c.id === existingId).savingThrows : [],
    skills: document.getElementById('char-skills').value.split(',').map(s => s.trim()).filter(s => s),
    proficiencies: existingId ? data.characters.find(c => c.id === existingId).proficiencies : { armor: [], weapons: [], tools: [] },
    features: document.getElementById('char-features').value.split(',').map(s => s.trim()).filter(s => s),
    spells: existingId ? data.characters.find(c => c.id === existingId).spells : [],
    inventory: existingId ? data.characters.find(c => c.id === existingId).inventory : [],
    backstory: document.getElementById('char-backstory').value.trim(),
    createdAt: existingId ? data.characters.find(c => c.id === existingId).createdAt : new Date().toISOString(),
    fromTemplate: null
  };
  
  if (existingId) {
    // Update existing
    const index = data.characters.findIndex(c => c.id === existingId);
    data.characters[index] = character;
  } else {
    // Add new
    data.characters.push(character);
  }
  
  saveData(data);
  
  // Show success and navigate
  showMessage(existingId ? 'Character updated!' : 'Character created!', 'success');
  setTimeout(() => {
    navigateTo('/characters');
  }, 1000);
}

function showMessage(text, type) {
  const message = document.createElement('div');
  message.className = `message message-${type}`;
  message.textContent = text;
  message.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 1rem; border-radius: 8px; background: var(--success-color); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.remove();
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
