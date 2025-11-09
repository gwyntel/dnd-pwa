/**
 * Character Validation and Improvement
 * Better validation for character fields, especially dice sizes
 */

/**
 * Validate and normalize hit dice string
 */
export function validateHitDice(value) {
  // Normalize: "1d10", "2d8", etc.
  const normalized = String(value || "").trim()

  // Valid patterns: 1d4, 2d6, 1d8, 1d10, 1d12, etc.
  const pattern = /^(\d+)d(\d+)$/i
  const match = normalized.match(pattern)

  if (!match) {
    // Return default if invalid
    console.warn(`[Character] Invalid hit dice: ${value}, using default 1d10`)
    return "1d10"
  }

  const [, numDice, diceSize] = match
  const num = Number.parseInt(numDice, 10)
  const size = Number.parseInt(diceSize, 10)

  // Validate reasonable bounds
  if (num < 1 || num > 20 || ![4, 6, 8, 10, 12, 20].includes(size)) {
    console.warn(`[Character] Out-of-bounds hit dice: ${normalized}, using default 1d10`)
    return "1d10"
  }

  return `${num}d${size}`
}

/**
 * Validate ability scores
 */
export function validateAbilityScore(value) {
  const num = Number.parseInt(value, 10)

  if (!Number.isFinite(num)) {
    console.warn(`[Character] Invalid ability score: ${value}, using 10`)
    return 10
  }

  // Clamp to reasonable D&D range (3-20)
  if (num < 3 || num > 20) {
    console.warn(`[Character] Ability score out of range (3-20): ${value}, clamping`)
    return Math.max(3, Math.min(20, num))
  }

  return num
}

/**
 * Validate AC (armor class)
 */
export function validateAC(value) {
  const num = Number.parseInt(value, 10)

  if (!Number.isFinite(num)) {
    console.warn(`[Character] Invalid AC: ${value}, using 10`)
    return 10
  }

  if (num < 1 || num > 30) {
    console.warn(`[Character] AC out of range (1-30): ${value}, clamping`)
    return Math.max(1, Math.min(30, num))
  }

  return num
}

/**
 * Validate HP
 */
export function validateHP(value) {
  const num = Number.parseInt(value, 10)

  if (!Number.isFinite(num)) {
    console.warn(`[Character] Invalid HP: ${value}, using 1`)
    return 1
  }

  if (num < 1) {
    console.warn(`[Character] HP must be positive: ${value}, using 1`)
    return 1
  }

  return num
}

/**
 * Validate level
 */
export function validateLevel(value) {
  const num = Number.parseInt(value, 10)

  if (!Number.isFinite(num)) {
    console.warn(`[Character] Invalid level: ${value}, using 1`)
    return 1
  }

  if (num < 1 || num > 20) {
    console.warn(`[Character] Level out of range (1-20): ${value}, clamping`)
    return Math.max(1, Math.min(20, num))
  }

  return num
}

/**
 * Calculate proficiency bonus from level
 */
export function calculateProficiencyBonus(level) {
  return Math.floor((validateLevel(level) - 1) / 4) + 2
}

/**
 * Validate entire character object
 */
export function validateCharacter(character) {
  if (!character || typeof character !== "object") {
    throw new Error("Invalid character object")
  }

  return {
    name: (character.name || "Unnamed").trim(),
    race: (character.race || "Human").trim(),
    class: (character.class || "Fighter").trim(),
    level: validateLevel(character.level),
    stats: {
      strength: validateAbilityScore(character.stats?.strength || 10),
      dexterity: validateAbilityScore(character.stats?.dexterity || 10),
      constitution: validateAbilityScore(character.stats?.constitution || 10),
      intelligence: validateAbilityScore(character.stats?.intelligence || 10),
      wisdom: validateAbilityScore(character.stats?.wisdom || 10),
      charisma: validateAbilityScore(character.stats?.charisma || 10),
    },
    maxHP: validateHP(character.maxHP || 10),
    armorClass: validateAC(character.armorClass || 10),
    speed: Math.max(0, Number.parseInt(character.speed, 10) || 30),
    hitDice: validateHitDice(character.hitDice),
    skills: Array.isArray(character.skills) ? character.skills : [],
    features: Array.isArray(character.features) ? character.features : [],
    backstory: (character.backstory || "").trim(),
  }
}
