/**
 * Migration Popup Component
 * Displays a message during data migration
 */
export function showMigrationPopup() {
    const popup = document.createElement('div');
    popup.id = 'migration-popup';
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.color = 'white';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.zIndex = '9999';
    popup.style.flexDirection = 'column';
    popup.style.fontFamily = 'system-ui, sans-serif';

    popup.innerHTML = `
    <div style="background: #222; padding: 2rem; border-radius: 8px; text-align: center; border: 1px solid #444;">
      <h2 style="margin-top: 0;">Updating World Data</h2>
      <p>Migrating your worlds to the new schema...</p>
      <div class="spinner" style="margin: 1rem auto;"></div>
    </div>
    <style>
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

    document.body.appendChild(popup);
    return popup;
}

export function hideMigrationPopup() {
    const popup = document.getElementById('migration-popup');
    if (popup) {
        // Add a small delay to ensure the user sees it briefly if migration is instant
        setTimeout(() => {
            popup.remove();
        }, 1500);
    }
}
