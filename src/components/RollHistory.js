/**
 * RollHistory Component
 * Renders recent dice roll history
 */

export function RollHistory(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return '<div class="roll-history-empty text-secondary">No rolls yet.</div>'
  }

  // Take last 20 messages that have diceRoll metadata
  const rolls = messages.filter((m) => m?.metadata?.diceRoll).slice(-20)

  if (rolls.length === 0) {
    return '<div class="roll-history-empty text-secondary">No rolls yet.</div>'
  }

  return `
    <ul class="roll-history-list">
      ${rolls
        .map((m) => {
          const meta = m.metadata || {}
          const labelParts = []

          if (meta.type === "attack") {
            labelParts.push("Attack")
            if (meta.key) labelParts.push(meta.key)
            if (meta.targetAC) labelParts.push(`vs AC ${meta.targetAC}`)
            if (meta.success === true) labelParts.push("✓")
            if (meta.success === false) labelParts.push("✗")
          } else if (meta.type === "save") {
            labelParts.push("Save")
            if (meta.key) labelParts.push(meta.key.toUpperCase())
            if (meta.dc) labelParts.push(`DC ${meta.dc}`)
            if (meta.success === true) labelParts.push("✓")
            if (meta.success === false) labelParts.push("✗")
          } else if (meta.type === "skill") {
            labelParts.push("Skill")
            if (meta.key) labelParts.push(meta.key)
            if (meta.dc) labelParts.push(`DC ${meta.dc}`)
            if (meta.success === true) labelParts.push("✓")
            if (meta.success === false) labelParts.push("✗")
          } else {
            labelParts.push("Roll")
          }

          const label = labelParts.join(" ")

          const id = meta.rollId || ""
          const ts = meta.timestamp || ""
          const total =
            typeof meta.diceRoll?.total === "number"
              ? meta.diceRoll.total
              : (meta.diceRoll?.toHit?.total ?? meta.diceRoll?.damage?.total ?? "")

          return `
            <li class="roll-history-item">
              <div class="roll-history-main">
                <span class="roll-history-label-text">${label || "Roll"}</span>
                ${total !== "" ? `<span class="roll-history-total">${total}</span>` : ""}
              </div>
              <div class="roll-history-meta">
                ${id ? `<span class="roll-history-id">${id}</span>` : ""}
                ${ts ? `<span class="roll-history-ts">${ts}</span>` : ""}
                ${meta.source ? `<span class="roll-history-source">${meta.source}</span>` : ""}
              </div>
            </li>
          `
        })
        .join("")}
    </ul>
  `
}
