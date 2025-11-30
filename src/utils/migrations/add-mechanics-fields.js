import store from "../../state/store.js"

export function migrateMechanicsFields() {
    const data = store.get()
    let modified = false

    if (!data.characters) return

    // Update characters
    data.characters.forEach(char => {
        if (typeof char.tempHP === 'undefined') {
            char.tempHP = 0
            modified = true
        }
        if (!Array.isArray(char.resistances)) {
            char.resistances = []
            modified = true
        }
        if (!Array.isArray(char.immunities)) {
            char.immunities = []
            modified = true
        }
        if (!Array.isArray(char.vulnerabilities)) {
            char.vulnerabilities = []
            modified = true
        }
        if (!Array.isArray(char.attunedItems)) {
            char.attunedItems = []
            modified = true
        }
    })

    if (modified) {
        console.log("[Migration] Added mechanics fields to characters")
        store.update(s => s)
    }
}
