/**
 * AI-powered Class Progression Generator
 * Generates full 1-20 level progression for custom/homebrew classes
 * using structured output
 */

import { getProvider } from './model-utils.js'

// Structured output schema for class progression
const CLASS_PROGRESSION_SCHEMA = {
    type: "object",
    properties: {
        className: { type: "string" },
        hp_die: {
            type: "string",
            enum: ["1d6", "1d8", "1d10", "1d12"]
        },
        progression: {
            type: "object",
            properties: {
                "2": { $ref: "#/$defs/levelData" },
                "3": { $ref: "#/$defs/levelData" },
                "4": { $ref: "#/$defs/levelData" },
                "5": { $ref: "#/$defs/levelData" },
                "6": { $ref: "#/$defs/levelData" },
                "7": { $ref: "#/$defs/levelData" },
                "8": { $ref: "#/$defs/levelData" },
                "9": { $ref: "#/$defs/levelData" },
                "10": { $ref: "#/$defs/levelData" },
                "11": { $ref: "#/$defs/levelData" },
                "12": { $ref: "#/$defs/levelData" },
                "13": { $ref: "#/$defs/levelData" },
                "14": { $ref: "#/$defs/levelData" },
                "15": { $ref: "#/$defs/levelData" },
                "16": { $ref: "#/$defs/levelData" },
                "17": { $ref: "#/$defs/levelData" },
                "18": { $ref: "#/$defs/levelData" },
                "19": { $ref: "#/$defs/levelData" },
                "20": { $ref: "#/$defs/levelData" }
            },
            required: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]
        }
    },
    required: ["className", "hp_die", "progression"],
    $defs: {
        levelData: {
            type: "object",
            properties: {
                features: {
                    type: "array",
                    items: { type: "string" }
                },
                asi: { type: "boolean" },
                spell_slots: {
                    type: "object",
                    properties: {
                        "1": { type: "integer", minimum: 0, maximum: 4 },
                        "2": { type: "integer", minimum: 0, maximum: 3 },
                        "3": { type: "integer", minimum: 0, maximum: 3 },
                        "4": { type: "integer", minimum: 0, maximum: 3 },
                        "5": { type: "integer", minimum: 0, maximum: 3 },
                        "6": { type: "integer", minimum: 0, maximum: 2 },
                        "7": { type: "integer", minimum: 0, maximum: 2 },
                        "8": { type: "integer", minimum: 0, maximum: 1 },
                        "9": { type: "integer", minimum: 0, maximum: 1 }
                    }
                },
                new_spells_known: { type: "integer", minimum: 0 }
            },
            required: ["features"]
        }
    }
}

/**
 * Generate full class progression using AI
 * @param {string} className - Name of the custom class
 * @param {string} classDescription - Description of the class concept
 * @returns {Promise<Object>} - Full progression data
 */
export async function generateClassProgression(className, classDescription = '') {
    const provider = getProvider()

    const prompt = `Generate a complete D&D 5e-style class progression for the custom class "${className}".
${classDescription ? `\nClass concept: ${classDescription}` : ''}

Requirements:
- HP die should be 1d6, 1d8, 1d10, or 1d12 based on class type (casters: 1d6, skilled: 1d8, martial: 1d10, tank: 1d12)
- Provide features for every level 2-20
- ASI (Ability Score Improvement) at levels 4, 8, 12, 16, 19
- For spellcasters: provide spell_slots and new_spells_known progression
- Features should be balanced and flavorful
- Follow 5e design patterns (subclass at 3, major features at 5, 11, 17, 20)

Generate the complete progression now.`

    try {
        const response = await provider.generateStructuredOutput(prompt, CLASS_PROGRESSION_SCHEMA)

        if (!response || !response.progression) {
            throw new Error('Invalid progression data generated')
        }

        return {
            hp_die: response.hp_die,
            ...response.progression
        }
    } catch (error) {
        console.error('[ClassProgression] Failed to generate progression:', error)

        // Fallback: simple generic progression
        return generateFallbackProgression()
    }
}

/**
 * Fallback progression if AI generation fails
 */
function generateFallbackProgression() {
    const fallback = {
        hp_die: "1d8"
    }

    for (let level = 2; level <= 20; level++) {
        const features = []

        // ASI at standard levels
        if ([4, 8, 12, 16, 19].includes(level)) {
            features.push("Ability Score Improvement")
            fallback[level] = { features, asi: true }
        } else {
            features.push(`Level ${level} Feature`)
            fallback[level] = { features }
        }
    }

    return fallback
}
