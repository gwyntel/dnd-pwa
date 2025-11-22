/**
 * LevelUpModal Component
 * Handles the multi-step wizard for leveling up a character.
 */

import { rollDice } from "../utils/dice.js"
import { CLASS_PROGRESSION, XP_THRESHOLDS } from "../data/classes.js"
import { FEATS } from "../data/feats.js"
import store from "../state/store.js"

let currentStep = 0
let hpRoll = null
let selectedSpells = []
let selectedASI = { type: null, stats: [], feat: null } // { type: 'feat' | 'asi', stats: ['str', 'dex'], feat: 'Alert' }

export function renderLevelUpModal(character, onClose) {
    const nextLevel = character.level + 1
    // Check for custom progression first, then fall back to CLASS_PROGRESSION
    const classData = character.customProgression || CLASS_PROGRESSION[character.class]
    const levelData = classData ? classData[nextLevel] : null

    if (!levelData) {
        return `<div class="modal-content">
      <h3>Level Up Error</h3>
      <p>No progression data found for ${character.class} Level ${nextLevel}.</p>
      <p class="text-secondary text-sm mt-2">This may be a custom class that needs progression data generated.</p>
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
            ${levelData.asi ? `<li><strong>Ability Score Improvement:</strong> Increase stats or choose a Feat</li>` : ''}
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
          
          <button class="card p-4 text-center hover:border-primary cursor-pointer ${hpRoll && typeof hpRoll === 'object' ? 'border-primary' : ''}"
                  onclick="window.rollLevelUpHP('${classData.hp_die}', ${conMod})"
                  ${hpRoll && typeof hpRoll === 'object' ? 'disabled' : ''}>
            <div class="text-xl font-bold mb-1">Roll Dice</div>
            <div class="text-3xl text-primary">${hpRoll && typeof hpRoll === 'object' ? hpRoll.total : '?'}</div>
            <div class="text-sm text-secondary">(${classData.hp_die} + ${conMod} CON)</div>
          </button>
        </div>

        ${hpRoll ? `<button class="btn btn-primary w-full" onclick="window.nextLevelStep()">Next</button>` : ''}
      </div>
    `
    }

    // Step 2: Features (Informational)
    if (currentStep === 2) {
        // Check if we need to show ASI selection next
        const hasASI = levelData.asi
        const nextButtonText = hasASI ? "Next: Ability Scores" : "Next"

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
        <button class="btn btn-primary w-full" onclick="window.nextLevelStep()">${nextButtonText}</button>
      </div>
    `
    }

    // Step 3: Spells (Placeholder for now, skipping to ASI if present)
    // In a full implementation, we'd check levelData.new_spells_known

    // Step 4: ASI / Feat Selection
    if (currentStep === 3 && levelData.asi) {
        const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

        const renderASIInputs = () => `
            <div class="asi-selection mb-4">
                <p class="text-sm mb-2">Choose one stat to increase by +2, or two stats to increase by +1.</p>
                <div class="grid grid-cols-2 gap-2">
                    ${stats.map(stat => `
                        <div class="flex items-center justify-between card p-2">
                            <span class="capitalize">${stat.substring(0, 3)}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-lg font-bold">${character.stats[stat]}</span>
                                <div class="flex gap-1">
                                    <button class="btn btn-xs ${selectedASI.stats.filter(s => s === stat).length > 0 ? 'btn-primary' : 'btn-ghost'}" 
                                            onclick="window.toggleASIStat('${stat}')">+1</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="text-center mt-2 text-sm text-secondary">
                    Selected: ${selectedASI.stats.length}/2 points
                </div>
            </div>
        `

        const renderFeatSelection = () => `
            <div class="feat-selection mb-4">
                <p class="text-sm mb-2">Choose a Feat:</p>
                <select class="w-full p-2 rounded bg-base-200 border border-base-300 mb-2" onchange="window.selectFeat(this.value)">
                    <option value="">-- Select a Feat --</option>
                    ${FEATS.map(f => `<option value="${f.name}" ${selectedASI.feat === f.name ? 'selected' : ''}>${f.name}</option>`).join('')}
                </select>
                ${selectedASI.feat ? `
                    <div class="card p-3 bg-base-200 text-sm">
                        ${FEATS.find(f => f.name === selectedASI.feat)?.description}
                    </div>
                ` : ''}
            </div>
        `

        return `
            <div class="modal-content">
                <h3>Ability Score Improvement</h3>
                
                <div class="tabs flex gap-2 mb-4 border-b border-base-300 pb-2">
                    <button class="flex-1 pb-2 ${selectedASI.type !== 'feat' ? 'border-b-2 border-primary font-bold' : 'text-secondary'}" 
                            onclick="window.setASIType('asi')">Increase Stats</button>
                    <button class="flex-1 pb-2 ${selectedASI.type === 'feat' ? 'border-b-2 border-primary font-bold' : 'text-secondary'}" 
                            onclick="window.setASIType('feat')">Choose Feat</button>
                </div>

                ${selectedASI.type === 'feat' ? renderFeatSelection() : renderASIInputs()}

                <button class="btn btn-primary w-full" 
                        onclick="window.nextLevelStep()"
                        ${(selectedASI.type === 'feat' && !selectedASI.feat) || (selectedASI.type !== 'feat' && selectedASI.stats.length !== 2) ? 'disabled' : ''}>
                    Next
                </button>
            </div>
        `
    }

    // Final Step: Confirmation
    return `
    <div class="modal-content text-center">
      <h3>Ready to Level Up?</h3>
      <p class="mb-4">Confirm your changes to become Level ${nextLevel}.</p>
      
      <div class="summary text-left card p-3 mb-4 text-sm">
        <div><strong>HP:</strong> +${typeof hpRoll === 'object' ? hpRoll.total : (hpRoll === 'avg' ? (Math.floor(parseInt(classData.hp_die.substring(2)) / 2) + 1 + Math.floor((character.stats.constitution - 10) / 2)) : '?')}</div>
        ${selectedASI.type === 'feat' ? `<div><strong>Feat:</strong> ${selectedASI.feat}</div>` : ''}
        ${selectedASI.type !== 'feat' && selectedASI.stats.length > 0 ? `<div><strong>Stats:</strong> ${selectedASI.stats.map(s => `+1 ${s.substring(0, 3).toUpperCase()}`).join(', ')}</div>` : ''}
      </div>

      <button class="btn btn-primary w-full" onclick="window.finalizeLevelUp()">Confirm Level Up</button>
    </div>
  `
}

// Window handlers (to be attached in game.js)
export function attachLevelUpHandlers(game, character, onClose) {
    window.nextLevelStep = () => {
        const nextLevel = character.level + 1
        const classData = character.customProgression || CLASS_PROGRESSION[character.class]
        const levelData = classData ? classData[nextLevel] : null

        // Logic to skip steps if not applicable
        if (currentStep === 2 && !levelData.asi) {
            currentStep = 99 // Jump to confirmation
        } else {
            currentStep++
        }
        onClose() // Re-render
    }

    window.setLevelUpHP = (type, value) => {
        hpRoll = type === 'avg' ? 'avg' : { total: value }
        onClose()
    }

    window.rollLevelUpHP = (die, mod) => {
        const roll = rollDice(die)
        hpRoll = { total: roll.total + mod, raw: roll.total }
        onClose()
    }

    // ASI Handlers
    window.setASIType = (type) => {
        selectedASI.type = type
        // Reset selections when switching types to avoid confusion
        if (type === 'feat') {
            selectedASI.stats = []
        } else {
            selectedASI.feat = null
        }
        onClose()
    }

    window.toggleASIStat = (stat) => {
        // Logic: Can select up to 2 stats. If same stat selected twice, it's +2.
        // Implementation: Just push to array. If array length > 2, remove first.

        if (selectedASI.stats.length < 2) {
            selectedASI.stats.push(stat)
        } else {
            // If full, replace the first one (FIFO)
            selectedASI.stats.shift()
            selectedASI.stats.push(stat)
        }
        onClose()
    }

    window.selectFeat = (featName) => {
        selectedASI.feat = featName
        onClose()
    }

    window.finalizeLevelUp = async () => {
        const nextLevel = character.level + 1
        const classData = character.customProgression || CLASS_PROGRESSION[character.class]

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

                // Update Proficiency Bonus
                // Level 1-4: +2, 5-8: +3, 9-12: +4, 13-16: +5, 17-20: +6
                char.proficiencyBonus = Math.ceil(nextLevel / 4) + 1

                // Add features
                const levelData = classData[nextLevel]
                if (levelData && levelData.features) {
                    if (!char.features) char.features = []
                    char.features.push(...levelData.features)
                }

                // Apply ASI or Feat
                if (levelData && levelData.asi) {
                    if (selectedASI.type === 'feat' && selectedASI.feat) {
                        const feat = FEATS.find(f => f.name === selectedASI.feat)
                        if (feat) {
                            if (!char.features) char.features = []
                            char.features.push(`Feat: ${feat.name}`)
                        }
                    } else if (selectedASI.stats.length === 2) {
                        selectedASI.stats.forEach(stat => {
                            char.stats[stat] = (char.stats[stat] || 10) + 1
                        })
                    }
                }

                // Update spell slots
                if (levelData && levelData.spell_slots) {
                    if (!char.spellSlots) char.spellSlots = {}
                    Object.entries(levelData.spell_slots).forEach(([lvl, count]) => {
                        if (!char.spellSlots[lvl]) char.spellSlots[lvl] = { current: 0, max: 0 }
                        char.spellSlots[lvl].max = count
                        char.spellSlots[lvl].current = count // Refill on level up
                    })
                }
            }
        })

        // Reset local state
        currentStep = 0
        hpRoll = null
        selectedASI = { type: null, stats: [], feat: null }

        window.closeLevelUp()
    }
}
