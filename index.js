// The main script for the extension
// Variable Editor for SillyTavern

// Import dependencies
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { registerSlashCommand } from '../../../slash-commands.js';

// Import our modules
import { renderPanel } from './src/ui.js';
import { stopUpdateLoop } from './src/state.js';

// Debug prefix for console messages
const CONSOLE_PREFIX = '[Variable Editor] ';

// Extension configuration
const EXTENSION_NAME = 'st-variable-editor';
const defaultSettings = {
    isShown: false,
    fontSize: 1.0
};

// Initialize extension settings if they don't exist
if (!extension_settings[EXTENSION_NAME]) {
  extension_settings[EXTENSION_NAME] = { ...defaultSettings };
}

/**
 * Register slash command immediately (like temp_viewer does).
 */
registerSlashCommand('variableeditor', () => {
  extension_settings[EXTENSION_NAME].isShown = !extension_settings[EXTENSION_NAME].isShown;
  if (extension_settings[EXTENSION_NAME].isShown) {
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
    // Extension initialization
    const context = SillyTavern.getContext();
    const { eventSource, event_types } = context;

    // Always render the panel (but keep it hidden initially)
    renderPanel();
    const panel = document.getElementById('variable-editor-panel');
    if (panel) {
      panel.style.display = extension_settings[EXTENSION_NAME].isShown ? 'block' : 'none';
    }

    // Add event listeners for dynamic updates
    eventSource.on(event_types.CHAT_CHANGED, () => {
      // Stop the current update loop to prevent interference
      stopUpdateLoop();
      
      // Re-render the panel when chat changes
      renderPanel();
      const panel = document.getElementById('variable-editor-panel');
      if (panel) {
        panel.style.display = extension_settings[EXTENSION_NAME].isShown ? 'block' : 'none';
      }
    });

    // Extension initialization complete
  } catch (error) {
    console.error(CONSOLE_PREFIX, 'Initialization error:', error);
  }
});
