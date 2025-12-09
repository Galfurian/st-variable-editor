// The main script for the extension
// Variable Editor for SillyTavern

// Import dependencies
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { registerSlashCommand } from '../../../slash-commands.js';

// Import our modules
import { renderPanel } from './src/ui.js';

// Extension configuration
const extensionName = "st-variable-editor";
const defaultSettings = {
    isShown: false,
    fontSize: 1.0
};

// Initialize extension settings if they don't exist
if (!extension_settings[extensionName]) {
  extension_settings[extensionName] = { ...defaultSettings };
}

// Register slash command immediately (like temp_viewer does)
registerSlashCommand('variableeditor', () => {
  extension_settings[extensionName].isShown = !extension_settings[extensionName].isShown;
  if (extension_settings[extensionName].isShown) {
    renderPanel();
  } else {
    const panel = document.getElementById('variable-editor-panel');
    if (panel) panel.style.display = 'none';
  }
  saveSettingsDebounced();
}, [], 'show / hide the variable editor panel', true, true);

// This function is called when the extension is loaded
jQuery(async () => {
  try {
    console.log('[Variable Editor] Starting initialization');
    const context = SillyTavern.getContext();
    console.log('[Variable Editor] Got context');
    const { eventSource, event_types } = context;

    // Always render the panel (but keep it hidden initially)
    renderPanel();
    const panel = document.getElementById('variable-editor-panel');
    if (panel) {
      panel.style.display = extension_settings[extensionName].isShown ? 'block' : 'none';
    }

    // Add event listeners for dynamic updates
    eventSource.on(event_types.CHAT_CHANGED, () => {
      console.log('[Variable Editor] Chat changed event');
      // Re-render the panel when chat changes
      renderPanel();
      const panel = document.getElementById('variable-editor-panel');
      if (panel) {
        panel.style.display = extension_settings[extensionName].isShown ? 'block' : 'none';
      }
    });

    console.log('[Variable Editor] Initialization completed');
  } catch (error) {
    console.error('[Variable Editor] Initialization error:', error);
  }
});
