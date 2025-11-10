/**
 * UI Template and Component Library
 * Modular, reusable template functions for consistent UI patterns
 */

/**
 * Standard button variants
 */
export const ButtonStyle = {
  PRIMARY: "btn",
  SECONDARY: "btn-secondary",
  SMALL: "btn-small",
  DANGER: "btn-danger",
}

/**
 * Card template with optional header
 */
export function cardTemplate(content, { title = null, className = "", footer = null } = {}) {
  return `
    <div class="card ${className}">
      ${title ? `<div class="card-header"><h3 style="margin-top: 0;">${escapeHtml(title)}</h3></div>` : ""}
      ${content}
      ${footer ? `<div class="card-footer" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">${footer}</div>` : ""}
    </div>
  `
}

/**
 * Form field template with label
 */
export function formFieldTemplate(label, input, { help = null, required = false } = {}) {
  return `
    <div class="form-field mb-3">
      <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
        ${escapeHtml(label)}${required ? ' <span style="color: var(--error-color);">*</span>' : ""}
      </label>
      ${input}
      ${help ? `<p class="text-secondary" style="font-size: 0.875rem; margin-top: 0.35rem;">${escapeHtml(help)}</p>` : ""}
    </div>
  `
}

/**
 * Stat display (for character sheets, etc)
 */
export function statDisplayTemplate(label, value, { modifier = null, highlight = false } = {}) {
  return `
    <div class="stat-display" style="text-align: center; padding: 0.75rem; background-color: var(--bg-tertiary); border-radius: 6px; ${highlight ? "border: 2px solid var(--accent-color);" : ""}">
      <div class="stat-label" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">${escapeHtml(label)}</div>
      <div class="stat-value" style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">${value}</div>
      ${modifier !== null ? `<div class="stat-mod" style="font-size: 0.875rem; color: var(--text-secondary);">${modifier >= 0 ? "+" : ""}${modifier}</div>` : ""}
    </div>
  `
}

/**
 * Badge component
 */
export function badgeTemplate(text, { variant = "default" } = {}) {
  const variantClass =
    {
      default: "badge",
      success: "badge-success",
      error: "badge-error",
      warning: "badge-warning",
    }[variant] || "badge"

  return `<span class="${variantClass}">${escapeHtml(text)}</span>`
}

/**
 * Alert/message component
 */
export function alertTemplate(message, { type = "info", dismissible = true } = {}) {
  const typeClass =
    {
      info: "message",
      success: "message-success",
      error: "message-error",
      warning: "message-warning",
    }[type] || "message"

  return `
    <div class="${typeClass}" role="alert">
      <div style="display: flex; gap: 1rem; align-items: flex-start;">
        <div style="flex: 1;">${escapeHtml(message)}</div>
        ${dismissible ? '<button class="close-btn" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.5rem; padding: 0;">×</button>' : ""}
      </div>
    </div>
  `
}

/**
 * Grid helper
 */
export function gridTemplate(items, { columns = 2, gap = "1rem" } = {}) {
  return `
    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(${100 / columns}%, 1fr)); gap: ${gap};">
      ${items.map((item) => `<div>${item}</div>`).join("")}
    </div>
  `
}

/**
 * Navigation breadcrumbs
 */
export function breadcrumbTemplate(items) {
  return `
    <nav aria-label="breadcrumb" class="mb-3">
      <ol style="list-style: none; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${items
          .map(
            (item, idx) => `
          <li style="display: flex; align-items: center; gap: 0.5rem;">
            ${idx > 0 ? '<span style="color: var(--text-secondary);">›</span>' : ""}
            ${item.href ? `<a href="${item.href}">${escapeHtml(item.label)}</a>` : `<span>${escapeHtml(item.label)}</span>`}
          </li>
        `,
          )
          .join("")}
      </ol>
    </nav>
  `
}

/**
 * HTML escape utility
 */
export function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
