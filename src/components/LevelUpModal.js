/**
 * LevelUpModal Component
 * Handles the multi-step wizard for leveling up a character.
 */

import { rollDice } from "../utils/dice.js"
import { CLASS_PROGRESSION, XP_THRESHOLDS } from "../data/classes.js"
import store from "../state/store.js"

let currentStep = 0
let hpRoll = null
let selectedSpells = []
let selectedASI = { type: null, stats: [] } // { type: 'feat' | 'asi', stats: ['str', 'dex'] }

export function renderLevelUpModal(character, onClose) {
    const nextLevel = character.level + 1
    const classData = CLASS_PROGRESSION[character.class]
    const levelData = classData ? classData[nextLevel] : null

    if (!levelData) {
        return `<div class="modal-content">
      <h3>Level Up Error</h3>
      <p>No progression data found for ${character.class} Level ${nextLevel}.</p>
      <button class="btn btn-primary" onclick="window.closeLevelUp()">Close</button>
    </div>`
    }

    // Step 0: Intro
    if (currentStep === 0) {
        return `
      <div class="modal-content text-center">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
        <h2>Level Up Available!</h2>
        <p class="text-lg mb-4">Congratulations! You have reached <strong>Level ${nextLevel}</strong>.</p>
        
        <div class="level-up-summary card mb-4 text-left">
          <h4>What you get:</h4>
          <ul class="list-disc pl-5">
            <li><strong>Hit Points:</strong> Increase by 1${classData.hp_die} + ${Math.floor((character.stats.constitution - 10) / 2)}</li>
            ${levelData.features.map(f => `<li><strong>Feature:</strong> ${f}</li>`).join('')}
            ${levelData.new_spells_known ? `<li><strong>New Spells:</strong> Learn ${levelData.new_spells_known} new spells</li>` : ''}
            ${levelData.asi ? `<li><strong>Ability Score Improvement:</strong> Increase stats</li>` : ''}
          </ul>
        </div>

        <button class="btn btn-primary w-full" onclick="window.nextLevelStep()">Start Level Up</button>
      </div>
    `
    }

    // Step 1: HP
    if (currentStep === 1) {
        const conMod = Math.floor((character.stats.constitution - 10) / 2)
        const dieSize = parseInt(classData.hp_die.substring(2))
        const average = Math.floor(dieSize / 2) + 1

        return `
      <div class="modal-content">
        <h3>Increase Hit Points</h3>
        <p class="mb-4">Your maximum hit points increase. You can take the average or roll for it.</p>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <button class="card p-4 text-center hover:border-primary cursor-pointer ${hpRoll === 'avg' ? 'border-primary' : ''}" 
                  onclick="window.setLevelUpHP('avg', ${average + conMod})">
            <div class="text-xl font-bold mb-1">Take Average</div>
            <div class="text-3xl text-primary">${average + conMod}</div>
            <div class="text-sm text-secondary">(${average} + ${conMod} CON)</div>
          </button>
          
          <button class="card p-4 text-center hover:border-primary cursor-pointer ${typeof hpRoll === 'object' ? 'border-primary' : ''}"
                  onclick="window.rollLevelUpHP('${classData.hp_die}', ${conMod})"
                  ${typeof hpRoll === 'object' ? 'disabled' : ''}>
            <div class="text-xl font-bold mb-1">Roll Dice</div>
            <div class="text-3xl text-primary">${typeof hpRoll === 'object' ? hpRoll.total : '?'}</div>
            <div class="text-sm text-secondary">(${classData.hp_die} + ${conMod} CON)</div>
          </button>
        </div>

        ${hpRoll ? `<button class="btn btn-primary w-full" onclick="window.nextLevelStep()">Next</button>` : ''}
      </div>
    `
    }

    // Step 2: Features (Informational)
    if (currentStep === 2) {
        return `
      <div class="modal-content">
        <h3>New Features</h3>
        <div class="features-list mb-4">
          ${levelData.features.map(f => `
            <div class="card p-3 mb-2">
              <div class="font-bold text-primary">✨ ${f.split('(')[0]}</div>
              <div class="text-sm text-secondary">${f.includes('(') ? f.split('(')[1].replace(')', '') : ''}</div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary w-full" onclick="window.nextLevelStep()">Next</button>
      </div>
    `
    }

    // Step 3: Spells (if applicable) - Placeholder for MVP
    // Step 4: ASI (if applicable) - Placeholder for MVP

    // Final Step: Confirmation
    return `
    <div class="modal-content text-center">
      <h3>Ready to Level Up?</h3>
      <p class="mb-4">Confirm your changes to become Level ${nextLevel}.</p>
      <button class="btn btn-primary w-full" onclick="window.finalizeLevelUp()">Confirm Level Up</button>
    </div>
  `
}

// Window handlers (to be attached in game.js)
export function attachLevelUpHandlers(game, character, onClose) {
    window.nextLevelStep = () => {
        currentStep++
        onClose() // Re-render
    }

    window.setLevelUpHP = (type, value) => {
        hpRoll = type === 'avg' ? 'avg' : { total: value } // Simplified for now
        onClose()
    }

    window.rollLevelUpHP = (die, mod) => {
        const roll = rollDice(die)
        hpRoll = { total: roll.total + mod, raw: roll.total }
        onClose()
    }

    window.finalizeLevelUp = async () => {
        const nextLevel = character.level + 1
        const classData = CLASS_PROGRESSION[character.class]

        // Calculate new HP
        let hpIncrease = 0
        if (hpRoll === 'avg') {
            const dieSize = parseInt(classData.hp_die.substring(2))
            hpIncrease = (Math.floor(dieSize / 2) + 1) + Math.floor((character.stats.constitution - 10) / 2)
        } else {
            hpIncrease = hpRoll.total
        }

        await store.update(state => {
            const char = state.characters.find(c => c.id === character.id)
            if (char) {
                char.level = nextLevel
                char.maxHP += hpIncrease
                char.currentHP += hpIncrease // Heal the amount gained
                char.xp.max = XP_THRESHOLDS[nextLevel + 1] || 999999

                // Add features
                const levelData = classData[nextLevel]
                if (levelData && levelData.features) {
                    if (!char.features) char.features = []
                    char.features.push(...levelData.features)
                }

                // Update spell slots
                if (levelData && levelData.spell_slots) {
                    if (!char.spellSlots) char.spellSlots = {}
                    Object.entries(levelData.spell_slots).forEach(([lvl, count]) => {
                        if (!char.spellSlots[lvl]) char.spellSlots[lvl] = { current: 0, max: 0 }
                        char.spellSlots[lvl].max = count
                        char.spellSlots[lvl].current = count // Refill on level up? Or just max? Let's refill.
                    })
                }
            }
        })

        // Reset local state
        currentStep = 0
        hpRoll = null

        window.closeLevelUp()
    }
}
