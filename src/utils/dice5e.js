/**
 * D&D 5e character-aware dice utilities (Phase 2).
 *
 * Goals:
 * - Derive a dice-ready profile from the existing normalized character data.
 * - Provide semantic roll helpers that use the Phase 1 core dice engine.
 * - Remain strictly additive and backward compatible:
 *   - No changes to existing dice.js exports or shapes.
 *   - No changes required for existing game.js consumers.
 *
 * This module does NOT mutate character objects.
 */

import { getModifier, roll } from "./dice.js"

/**
 * Map of 5e skill names to their governing abilities.
 * Keys are normalized to lower-case for lookups.
 */
const SKILL_ABILITY_MAP = {
  // Strength
  athletics: "str",
  // Dexterity
  acrobatics: "dex",
  "sleight of hand": "dex",
  stealth: "dex",
  // Intelligence
  arcana: "int",
  history: "int",
  investigation: "int",
  nature: "int",
  religion: "int",
  // Wisdom
  animalhandling: "wis",
  "animal handling": "wis",
  insight: "wis",
  medicine: "wis",
  perception: "wis",
  survival: "wis",
  // Charisma
  deception: "cha",
  intimidation: "cha",
  performance: "cha",
  persuasion: "cha",
}

/**
 * Normalize a list of skills into a canonical array of lower-case names.
 * Supports:
 * - character.skills as:
 *   - An array of strings: ["Athletics", "Perception"]
 *   - A single comma-separated string: "Athletics, Perception, Stealth"
 */
function normalizeSkillList(skills) {
  if (!skills) return []
  if (Array.isArray(skills)) {
    return skills
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .map((s) => s.toLowerCase())
  }
  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase())
  }
  return []
}

/**
 * Infer ability modifiers from a character.stats object.
 * Does not throw if fields are missing; missing stats default to 10 (+0).
 */
function buildAbilityModifiers(stats = {}) {
  const get = (key) => {
    const v = typeof stats[key] === "number" ? stats[key] : 10
    return getModifier(v)
  }

  return {
    str: get("strength"),
    dex: get("dexterity"),
    con: get("constitution"),
    int: get("intelligence"),
    wis: get("wisdom"),
    cha: get("charisma"),
  }
}

/**
 * Build saving throw bonuses.
 *
 * Input expectations (best-effort, non-breaking):
 * - character.savingThrows: array of ability names as strings, e.g. ["strength", "constitution"]
 *   - Case-insensitive, uses prefixes: "str", "strength" -> "str"
 *
 * Output:
 * - Object mapping ability keys to total save bonus numbers.
 */
function buildSavingThrows(character, abilities) {
  const prof = typeof character.proficiencyBonus === "number" ? character.proficiencyBonus : 0
  const saves = {
    str: abilities.str,
    dex: abilities.dex,
    con: abilities.con,
    int: abilities.int,
    wis: abilities.wis,
    cha: abilities.cha,
  }

  const list = Array.isArray(character.savingThrows) ? character.savingThrows : []
  for (const raw of list) {
    if (typeof raw !== "string") continue
    const v = raw.trim().toLowerCase()
    if (!v) continue

    const key =
      v.startsWith("str") ? "str" :
      v.startsWith("dex") ? "dex" :
      v.startsWith("con") ? "con" :
      v.startsWith("int") ? "int" :
      v.startsWith("wis") ? "wis" :
      v.startsWith("cha") ? "cha" :
      null

    if (key && typeof saves[key] === "number") {
      saves[key] = saves[key] + prof
    }
  }

  return saves
}

/**
 * Best-effort detection of expertise for skills.
 * This is intentionally conservative:
 * - If the character.features or class hints at "Expertise" and the skill list is small,
 *   we may treat some skills as expertise.
 * - To avoid surprising users, we only apply an expertise heuristic when:
 *   - "expertise" is mentioned in features (case-insensitive)
 *   - AND the skill is clearly thematically associated with that class (e.g. Rogue).
 *
 * For now, this helper returns an empty set to avoid over-assuming.
 * It is left here for easy future expansion.
 */
function detectExpertiseSkills(character, normalizedSkills) {
  const hasExpertise =
    Array.isArray(character.features) &&
    character.features.some(
      (f) => typeof f === "string" && f.toLowerCase().includes("expertise"),
    )

  if (!hasExpertise) return new Set()

  const cls = typeof character.class === "string" ? character.class.toLowerCase() : ""
  const expertise = new Set()

  // Very light-touch heuristic:
  if (cls.includes("rogue")) {
    for (const s of normalizedSkills) {
      if (s.includes("stealth") || s.includes("sleight of hand") || s.includes("thieves' tools")) {
        expertise.add(s)
      }
    }
  }

  return expertise
}

/**
 * Build skill bonuses.
 *
 * Strategy:
 * - Normalize character.skills to a list of skill names.
 * - If a skill is listed, treat it as proficient in that skill.
 * - Map each to its governing ability via SKILL_ABILITY_MAP where possible.
 * - Apply proficiency bonus; apply expertise (2x proficiency) if detected.
 *
 * Output:
 * - skills: { [normalizedSkillName]: bonusNumber }
 *   - normalizedSkillName is lower-case, e.g. "perception"
 */
function buildSkills(character, abilities) {
  const normalizedSkills = normalizeSkillList(character.skills)
  const prof = typeof character.proficiencyBonus === "number" ? character.proficiencyBonus : 0
  const expertise = detectExpertiseSkills(character, normalizedSkills)
  const result = {}

  for (const skill of normalizedSkills) {
    const key = skill
    const abilityKey = SKILL_ABILITY_MAP[skill.replace(/\s+/g, " ")] || SKILL_ABILITY_MAP[skill]
    if (!abilityKey || typeof abilities[abilityKey] !== "number") {
      // Fall back: if we cannot map, just use dex or int as a sane guess.
      const fallback =
        typeof abilities.dex === "number"
          ? abilities.dex
          : typeof abilities.int === "number"
          ? abilities.int
          : 0
      result[key] = fallback + prof
      continue
    }

    const baseMod = abilities[abilityKey]
    const isExpert = expertise.has(skill)
    const total = baseMod + (isExpert ? prof * 2 : prof)
    result[key] = total
  }

  return result
}

/**
 * Build attack entries from equipped weapons / obvious items.
 *
 * Input (best-effort):
 * - character.inventory: array of items:
 *   - { item: "Longsword", equipped: true, damage: "1d8+3" }
 * - character.stats, proficiencyBonus: to compute toHit if not explicitly encoded.
 *
 * Output:
 * - attacks: [
 *     {
 *       id: string,          // stable key, e.g. "longsword" or "longsword_1"
 *       name: string,        // display name
 *       ability: "str"|"dex"|"int"|"wis"|"cha"|null,
 *       toHit: number|null,  // attack bonus
 *       damage: string|null, // damage dice notation (e.g., "1d8+3")
 *       damageType: string|undefined
 *     },
 *   ]
 *
 * Notes:
 * - We avoid overfitting; only derive simple, obvious attacks.
 * - If damage is provided, we respect it.
 * - toHit is approximated as ability mod + proficiency (if it's a "weapon-like" item).
 */
function buildAttacks(character, abilities) {
  const inventory = Array.isArray(character.inventory) ? character.inventory : []
  const prof = typeof character.proficiencyBonus === "number" ? character.proficiencyBonus : 0
  const attacks = []

  const addAttack = (name, base) => {
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, "_")
    attacks.push({
      id,
      name,
      ability: base.ability || null,
      toHit:
        typeof base.toHit === "number"
          ? base.toHit
          : base.ability && typeof abilities[base.ability] === "number"
          ? abilities[base.ability] + (base.proficient ? prof : 0)
          : null,
      damage: base.damage || null,
      damageType: base.damageType,
    })
  }

  for (const it of inventory) {
    if (!it || typeof it.item !== "string") continue
    const name = it.item
    const lower = name.toLowerCase()
    const equipped = !!it.equipped

    // Only consider equipped or obviously weapon-like items
    const looksLikeWeapon =
      lower.includes("sword") ||
      lower.includes("bow") ||
      lower.includes("axe") ||
      lower.includes("mace") ||
      lower.includes("staff") ||
      lower.includes("dagger") ||
      lower.includes("crossbow") ||
      lower.includes("spear") ||
      lower.includes("hammer")

    if (!equipped && !looksLikeWeapon) continue

    const damage = typeof it.damage === "string" ? it.damage.trim() : null

    // Guess ability: simple finesse/ ranged vs. strength heuristic
    let ability = "str"
    if (lower.includes("dagger") || lower.includes("rapier") || lower.includes("shortsword")) {
      ability = "dex"
    }
    if (lower.includes("bow") || lower.includes("crossbow")) {
      ability = "dex"
    }

    addAttack(name, {
      ability,
      proficient: true,
      damage,
    })
  }

  return attacks
}

/**
 * Build spellcasting info and spell save DC if possible.
 *
 * Heuristic:
 * - If class string contains common full casters:
 *   - Wizard -> INT, Cleric/Paladin -> WIS/CHA, etc.
 * - This is intentionally simple; users can ignore if not accurate.
 */
function buildSpellcasting(character, abilities) {
  const prof = typeof character.proficiencyBonus === "number" ? character.proficiencyBonus : 0
  const cls = typeof character.class === "string" ? character.class.toLowerCase() : ""

  let castingAbilityKey = null

  if (cls.includes("wizard") || cls.includes("artificer")) castingAbilityKey = "int"
  else if (cls.includes("cleric") || cls.includes("druid")) castingAbilityKey = "wis"
  else if (cls.includes("paladin") || cls.includes("sorcerer") || cls.includes("warlock") || cls.includes("bard"))
    castingAbilityKey = "cha"

  if (!castingAbilityKey || typeof abilities[castingAbilityKey] !== "number") {
    return {
      spellcastingAbility: null,
      spellSaveDC: null,
      spellAttackBonus: null,
    }
  }

  const mod = abilities[castingAbilityKey]
  return {
    spellcastingAbility: castingAbilityKey,
    spellSaveDC: 8 + prof + mod,
    spellAttackBonus: prof + mod,
  }
}

/**
 * Build a comprehensive dice profile for a character.
 *
 * Input:
 * - character: normalized character object (use normalizeCharacter before calling).
 *
 * Output shape (stable, additive):
 * {
 *   abilities: { str, dex, con, int, wis, cha },
 *   saves:     { str, dex, con, int, wis, cha },
 *   skills:    { [skillNameLower]: bonus },
 *   attacks:   [ { id, name, ability, toHit, damage, damageType? } ],
 *   spellcasting: {
 *     spellcastingAbility: "str"|"dex"|"con"|"int"|"wis"|"cha"|null,
 *     spellSaveDC: number|null,
 *     spellAttackBonus: number|null
 *   }
 * }
 */
export function buildDiceProfile(character) {
  if (!character || typeof character !== "object") {
    throw new Error("buildDiceProfile requires a character object")
  }

  const abilities = buildAbilityModifiers(character.stats || {})
  const saves = buildSavingThrows(character, abilities)
  const skills = buildSkills(character, abilities)
  const attacks = buildAttacks(character, abilities)
  const spellcasting = buildSpellcasting(character, abilities)

  return {
    abilities,
    saves,
    skills,
    attacks,
    spellcasting,
  }
}

/**
 * Common result metadata shape for semantic helpers.
 *
 * @typedef {Object} SemanticRollResult
 * @property {string} id           - Core roll id
 * @property {string} notation     - Dice notation used
 * @property {number[]} rolls      - Underlying dice
 * @property {number} modifier     - Modifier applied
 * @property {number} subtotal     - Sum of dice before modifier
 * @property {number} total        - Final total
 * @property {string} type         - "skill" | "save" | "attack"
 * @property {string} key          - Skill/ability/attack identifier
 * @property {number|null} dc      - Target DC (if provided)
 * @property {boolean|null} success - Whether roll meets/exceeds DC/AC (if applicable)
 * @property {number|null} targetAC - For attacks, the target AC if provided
 * @property {Object|undefined} crit - Optional crit metadata from core roll (if d20)
 */

/**
 * Roll a skill check using the character's profile.
 *
 * @param {Object} character - normalized character
 * @param {string} skillKey  - e.g. "perception", case-insensitive
 * @param {Object} [options]
 * @param {number} [options.dc]               - target DC
 * @param {boolean} [options.advantage]
 * @param {boolean} [options.disadvantage]
 * @returns {SemanticRollResult}
 */
export function rollSkillCheck(character, skillKey, options = {}) {
  const profile = buildDiceProfile(character)
  const normalizedKey = (skillKey || "").toString().trim().toLowerCase()
  const bonus = profile.skills[normalizedKey] ?? 0

  // Construct notation "1d20+X" explicitly for transparency.
  const mod = Number.isFinite(bonus) ? bonus : 0
  const notation = `1d20${mod >= 0 ? `+${mod}` : mod}`

  const core = roll({
    count: 1,
    sides: 20,
    modifier: mod,
    advantage: !!options.advantage,
    disadvantage: !!options.disadvantage,
    rollType: "skill",
    label: `${normalizedKey} check`,
    notation,
  })

  const dc = typeof options.dc === "number" ? options.dc : null
  const success = dc != null ? core.total >= dc : null

  return {
    ...core,
    type: "skill",
    key: normalizedKey,
    dc,
    success,
  }
}

/**
 * Roll a saving throw using the character's profile.
 *
 * @param {Object} character - normalized character
 * @param {string} abilityKey - "str"|"dex"|"con"|"int"|"wis"|"cha" or full name
 * @param {Object} [options]
 * @param {number} [options.dc]
 * @param {boolean} [options.advantage]
 * @param {boolean} [options.disadvantage]
 * @returns {SemanticRollResult}
 */
export function rollSavingThrow(character, abilityKey, options = {}) {
  const profile = buildDiceProfile(character)
  const raw = (abilityKey || "").toString().trim().toLowerCase()

  const key =
    raw === "str" || raw.startsWith("strength")
      ? "str"
      : raw === "dex" || raw.startsWith("dexterity")
      ? "dex"
      : raw === "con" || raw.startsWith("constitution")
      ? "con"
      : raw === "int" || raw.startsWith("intelligence")
      ? "int"
      : raw === "wis" || raw.startsWith("wisdom")
      ? "wis"
      : raw === "cha" || raw.startsWith("charisma")
      ? "cha"
      : null

  const bonus = key ? profile.saves[key] ?? profile.abilities[key] ?? 0 : 0
  const mod = Number.isFinite(bonus) ? bonus : 0
  const notation = `1d20${mod >= 0 ? `+${mod}` : mod}`

  const core = roll({
    count: 1,
    sides: 20,
    modifier: mod,
    advantage: !!options.advantage,
    disadvantage: !!options.disadvantage,
    rollType: "save",
    label: `${key || raw || "save"} saving throw`,
    notation,
  })

  const dc = typeof options.dc === "number" ? options.dc : null
  const success = dc != null ? core.total >= dc : null

  return {
    ...core,
    type: "save",
    key: key || raw,
    dc,
    success,
  }
}

/**
 * Roll an attack using the character's profile.
 *
 * @param {Object} character - normalized character
 * @param {string} attackIdOrName - matches attack.id or attack.name (case-insensitive)
 * @param {Object} [options]
 * @param {number} [options.targetAC]       - target Armor Class
 * @param {boolean} [options.advantage]
 * @param {boolean} [options.disadvantage]
 * @returns {{
 *   attack: {
 *     id: string,
 *     name: string,
 *     ability: string|null,
 *     toHit: number|null,
 *     damage: string|null,
 *     damageType?: string
 *   },
 *   toHit: SemanticRollResult,
 *   damage: (SemanticRollResult | null)
 * }}
 */
export function rollAttack(character, attackIdOrName, options = {}) {
  const profile = buildDiceProfile(character)
  const query = (attackIdOrName || "").toString().trim().toLowerCase()

  const attack =
    profile.attacks.find(
      (a) =>
        (typeof a.id === "string" && a.id.toLowerCase() === query) ||
        (typeof a.name === "string" && a.name.toLowerCase() === query),
    ) || profile.attacks[0] // fallback to first known attack if not found

  if (!attack) {
    // No recognizable attacks; degrade gracefully to a basic STR attack.
    const abilities = profile.abilities
    const mod = abilities.str || 0
    const notation = `1d20${mod >= 0 ? `+${mod}` : mod}`

    const basicCore = roll({
      count: 1,
      sides: 20,
      modifier: mod,
      advantage: !!options.advantage,
      disadvantage: !!options.disadvantage,
      rollType: "attack",
      label: "basic weapon attack",
      notation,
    })

    const targetAC = typeof options.targetAC === "number" ? options.targetAC : null
    const hit = targetAC != null ? basicCore.total >= targetAC : null

    return {
      attack: {
        id: "basic_attack",
        name: "Basic Attack",
        ability: "str",
        toHit: mod,
        damage: null,
      },
      toHit: {
        ...basicCore,
        type: "attack",
        key: "basic_attack",
        targetAC,
        success: hit,
      },
      damage: null,
    }
  }

  const toHitBonus = Number.isFinite(attack.toHit) ? attack.toHit : 0
  const toHitNotation = `1d20${toHitBonus >= 0 ? `+${toHitBonus}` : toHitBonus}`

  const toHitCore = roll({
    count: 1,
    sides: 20,
    modifier: toHitBonus,
    advantage: !!options.advantage,
    disadvantage: !!options.disadvantage,
    rollType: "attack",
    label: `${attack.name} attack roll`,
    notation: toHitNotation,
  })

  const targetAC = typeof options.targetAC === "number" ? options.targetAC : null
  const hit = targetAC != null ? toHitCore.total >= targetAC : null

  let damageResult = null
  if (hit !== false && typeof attack.damage === "string" && attack.damage.trim()) {
    // Use parseNotation via roll(string) for the damage roll; no advantage/disadvantage by default.
    const damageCore = roll({
      ...parseDamageNotation(attack.damage.trim()),
      rollType: "attack",
      label: `${attack.name} damage`,
    })

    damageResult = {
      ...damageCore,
      type: "attack",
      key: `${attack.id || attack.name}_damage`,
      dc: null,
      success: null,
    }
  }

  return {
    attack,
    toHit: {
      ...toHitCore,
      type: "attack",
      key: attack.id || attack.name,
      targetAC,
      success: hit,
    },
    damage: damageResult,
  }
}

/**
 * Parse a damage-like notation into { count, sides, modifier } for use with roll().
 * This is intentionally forgiving and only supports simple "XdY+Z" forms.
 */
function parseDamageNotation(notation) {
  if (typeof notation !== "string") {
    return { count: 1, sides: 1, modifier: 0 }
  }
  const trimmed = notation.trim()
  const match = trimmed.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!match) {
    return { count: 1, sides: 1, modifier: 0 }
  }
  const count = parseInt(match[1], 10)
  const sides = parseInt(match[2], 10)
  const modifier = match[3] ? parseInt(match[3], 10) : 0
  return { count, sides, modifier }
}
