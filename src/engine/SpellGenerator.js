/**
 * SpellGenerator - Dynamically generates spell definitions with mechanical effects
 * Similar to MonsterGenerator and ItemGenerator
 * Infers spell properties from name and context, generates D&D 5e-appropriate mechanics
 */

import { sendChatCompletion, parseStreamingResponse } from '../utils/ai-provider.js'

/**
 * Damage scaling by spell level (D&D 5e standard)
 */
const DAMAGE_BY_LEVEL = {
    0: '1d4',      // Cantrips (scale with character level, but we'll use base)
    1: '1d8',      // 1st level
    2: '2d8',      // 2nd level
    3: '8d6',      // 3rd level (Fireball)
    4: '4d10',     // 4th level
    5: '10d6',     // 5th level
    6: '10d8',     // 6th level
    7: '11d8',     // 7th level
    8: '12d8',     // 8th level
    9: '14d6'      // 9th level
}

const HEALING_BY_LEVEL = {
    0: '1d4',
    1: '1d8',
    2: '2d8',
    3: '3d8',
    4: '4d8',
    5: '5d8',
    6: '6d8',
    7: '7d8',
    8: '8d8',
    9: '9d8'
}

/**
 * Spell schools
 */
const SCHOOLS = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation']

/**
 * Damage types for spells
 */
const DAMAGE_TYPES = ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder']

/**
 * Generate a spell with mechanical effects using AI
 * @param {string} spellName - Name of the spell
 * @param {number} level - Spell level (0-9)
 * @param {Object} context - Optional context (character, world, etc.)
 * @returns {Promise<Object>} Generated spell definition
 */
export async function generateSpell(spellName, level = 1, context = {}) {
    console.log('[SpellGenerator] Generating spell:', { spellName, level })

    try {
        // Try AI generation first
        const aiSpell = await generateSpellWithAI(spellName, level, context)
        if (aiSpell) {
            console.log('[SpellGenerator] AI generated spell:', aiSpell)
            return aiSpell
        }
    } catch (error) {
        console.warn('[SpellGenerator] AI generation failed, using fallback:', error)
    }

    // Fallback to rule-based generation
    const fallbackSpell = generateSpellFallback(spellName, level)
    console.log('[SpellGenerator] Fallback generated spell:', fallbackSpell)
    return fallbackSpell
}

/**
 * Generate spell using AI with structured output
 * @param {string} spellName 
 * @param {number} level 
 * @param {Object} context 
 * @returns {Promise<Object|null>}
 */
async function generateSpellWithAI(spellName, level, context) {
    const prompt = buildSpellGenerationPrompt(spellName, level, context)

    const messages = [
        {
            role: 'system',
            content: 'You are a D&D 5e spell designer. Generate spell mechanics that are balanced and fun.'
        },
        {
            role: 'user',
            content: prompt
        }
    ]

    const response = await sendChatCompletion({
        messages,
        temperature: 0.7,
        max_tokens: 1000
    })

    let spellData = null
    for await (const chunk of parseStreamingResponse(response)) {
        if (chunk.type === 'content' && chunk.content) {
            try {
                // Try to parse JSON from the response
                const jsonMatch = chunk.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                    chunk.content.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    spellData = JSON.parse(jsonMatch[1] || jsonMatch[0])
                }
            } catch (e) {
                // Continue collecting content
            }
        }
    }

    if (spellData && spellData.id) {
        return normalizeGeneratedSpell(spellData, spellName, level)
    }

    return null
}

/**
 * Rule-based spell generation fallback
 * @param {string} spellName 
 * @param {number} level 
 * @returns {Object}
 */
function generateSpellFallback(spellName, level) {
    const id = spellName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const spellType = inferSpellType(spellName)
    const school = inferSchool(spellName, spellType)
    const damageType = inferDamageType(spellName)

    const spell = {
        id,
        name: spellName,
        level,
        school,
        concentration: shouldRequireConcentration(spellName, spellType, level),
        effects: [],
        generated: true,
        generatedAt: new Date().toISOString()
    }

    // Generate effects based on spell type
    switch (spellType) {
        case 'damage':
            spell.effects.push(`DAMAGE[target|${DAMAGE_BY_LEVEL[level] || '1d6'}|${damageType}]`)
            // Add save if it's an AoE spell
            if (isAoESpell(spellName)) {
                spell.requiresSave = 'dexterity'
                spell.saveForHalf = true
            }
            break

        case 'healing':
            spell.effects.push(`HEAL[player|${HEALING_BY_LEVEL[level] || '1d8'}+spellcasting_mod]`)
            break

        case 'buff':
            const buffEffect = inferBuffEffect(spellName, level)
            if (buffEffect) {
                spell.effects.push(buffEffect)
                spell.duration = inferDuration(spellName, level)
                spell.durationType = 'rounds'
            }
            break

        case 'debuff':
            spell.effects.push('Status effect (AI-narrated)')
            spell.duration = inferDuration(spellName, level)
            spell.durationType = 'rounds'
            spell.requiresSave = inferSaveType(spellName)
            break

        case 'utility':
            spell.duration = inferDuration(spellName, level)
            spell.durationType = spellName.toLowerCase().includes('hour') ? 'hours' : 'minutes'
            break
    }

    return spell
}

/**
 * Infer spell type from name
 */
function inferSpellType(name) {
    const lower = name.toLowerCase()

    // Damage spells
    if (lower.match(/bolt|missile|ray|blast|arrow|strike|weapon|flame|shock|beam/)) return 'damage'
    if (lower.match(/fire|ice|lightning|acid|poison|thunder|meteor|storm/)) return 'damage'

    // Healing spells
    if (lower.match(/cure|heal|word|aid|restoration|prayer/)) return 'healing'

    // Buff spells
    if (lower.match(/shield|armor|bless|enhance|enlarge|haste|fly|strength|aid|heroism/)) return 'buff'

    // Debuff spells
    if (lower.match(/bane|slow|hold|charm|sleep|fear|curse|weakness|blindness/)) return 'debuff'

    // Default to utility
    return 'utility'
}

/**
 * Infer school of magic
 */
function inferSchool(name, type) {
    const lower = name.toLowerCase()

    if (lower.match(/shield|ward|protection|armor|barrier/)) return 'abjuration'
    if (lower.match(/summon|conjure|create|wall/)) return 'conjuration'
    if (lower.match(/detect|identify|see|sense|scry/)) return 'divination'
    if (lower.match(/charm|command|dominate|suggestion|sleep|fear/)) return 'enchantment'
    if (lower.match(/bolt|missile|fire|ice|lightning|thunder|force|blast/)) return 'evocation'
    if (lower.match(/illusion|image|phantom|disguise|invisibility/)) return 'illusion'
    if (lower.match(/animate|raise|drain|wither|curse|blight/)) return 'necromancy'
    if (lower.match(/alter|polymorph|enlarge|reduce|haste|slow|fly/)) return 'transmutation'

    // Default based on type
    if (type === 'damage') return 'evocation'
    if (type === 'healing') return 'evocation'
    if (type === 'buff') return 'abjuration'
    if (type === 'debuff') return 'enchantment'

    return 'transmutation'
}

/**
 * Infer damage type from spell name
 */
function inferDamageType(name) {
    const lower = name.toLowerCase()

    if (lower.match(/fire|flame|burn|heat|inferno/)) return 'fire'
    if (lower.match(/ice|cold|frost|freeze|chill/)) return 'cold'
    if (lower.match(/lightning|thunder|shock|storm/)) return 'lightning'
    if (lower.match(/acid|corrosive|dissolve/)) return 'acid'
    if (lower.match(/poison|venom|toxic/)) return 'poison'
    if (lower.match(/necrotic|death|drain|wither/)) return 'necrotic'
    if (lower.match(/radiant|holy|divine|light/)) return 'radiant'
    if (lower.match(/psychic|mind|mental/)) return 'psychic'
    if (lower.match(/force|missile|magic/)) return 'force'

    return 'force' // Safe default
}

/**
 * Check if spell should require concentration
 */
function shouldRequireConcentration(name, type, level) {
    const lower = name.toLowerCase()

    // Instantaneous effects don't need concentration
    if (lower.match(/missile|bolt|strike|cure|healing word/)) return false

    // Buffs and debuffs usually need concentration
    if (type === 'buff' || type === 'debuff') return true

    // Higher level spells more likely to need concentration
    if (level >= 3 && type !== 'damage') return true

    return false
}

/**
 * Check if spell is AoE
 */
function isAoESpell(name) {
    const lower = name.toLowerCase()
    return lower.match(/ball|burst|storm|wave|cloud|cone|blast|explosion/)
}

/**
 * Infer buff effect from name
 */
function inferBuffEffect(name, level) {
    const lower = name.toLowerCase()

    if (lower.match(/shield/) && !lower.match(/fire|ice/)) return '+5 AC'
    if (lower.match(/armor|protection/)) return '+3 AC'
    if (lower.match(/bless|aid/)) return '+1d4 to attack rolls'
    if (lower.match(/strength|enhance ability/)) return 'advantage on STR checks'
    if (lower.match(/resistance/)) return 'APPLY_RESISTANCE[player|fire]'
    if (lower.match(/speed|haste/)) return '+10 movement speed'

    return '+2 to saves' // Generic buff
}

/**
 * Infer save type from name
 */
function inferSaveType(name) {
    const lower = name.toLowerCase()

    if (lower.match(/charm|dominate|fear|sleep/)) return 'wisdom'
    if (lower.match(/fire|explosion|burst/)) return 'dexterity'
    if (lower.match(/poison|disease/)) return 'constitution'
    if (lower.match(/hold|paralyze/)) return 'wisdom'

    return 'wisdom' // Most common save
}

/**
 * Infer duration in rounds/hours
 */
function inferDuration(name, level) {
    const lower = name.toLowerCase()

    if (lower.match(/instantaneous|missile|bolt|strike/)) return 0
    if (lower.match(/hour/)) return 1
    if (lower.match(/day/)) return 8
    if (lower.match(/minute/)) return 10

    // Default to level-based duration
    return Math.max(1, Math.floor(level / 2))
}

/**
 * Normalize AI-generated spell data
 */
function normalizeGeneratedSpell(spellData, spellName, level) {
    return {
        id: spellData.id || spellName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: spellData.name || spellName,
        level: spellData.level || level,
        school: spellData.school || 'evocation',
        concentration: spellData.concentration || false,
        effects: Array.isArray(spellData.effects) ? spellData.effects : [],
        duration: spellData.duration,
        durationType: spellData.durationType,
        requiresSave: spellData.requiresSave,
        saveForHalf: spellData.saveForHalf,
        generated: true,
        generatedAt: new Date().toISOString()
    }
}

/**
 * Build prompt for AI spell generation
 */
function buildSpellGenerationPrompt(spellName, level, context) {
    return `Generate D&D 5e spell mechanics for "${spellName}" (Level ${level}).

Return ONLY valid JSON with this structure:
{
  "id": "spell-id-kebab-case",
  "name": "${spellName}",
  "level": ${level},
  "school": "evocation|abjuration|etc",
  "concentration": true|false,
  "effects": ["DAMAGE[target|8d6|fire]", "+5 AC", etc],
  "duration": 1,
  "durationType": "rounds|minutes|hours",
  "requiresSave": "dexterity|wisdom|etc",
  "saveForHalf": true|false
}

Valid effect formats:
- Damage: "DAMAGE[target|XdY|type]" (types: fire, cold, lightning, force, acid, poison, necrotic, radiant, psychic, thunder)
- Healing: "HEAL[player|XdY+mod]"
- AC Bonus: "+X AC"
- Attack Bonus: "+XdY to attack rolls"
- Save Bonus: "+X to saves"
- Resistance: "APPLY_RESISTANCE[player|type]"
- Temp HP: "TEMP_HP[player|X]"

Make effects balanced for level ${level}. Use standard 5e power levels.`
}
