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

// UI Constants
const PANEL_ID = 'variable-editor-panel';

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
    return 'Variable editor panel shown.';
  } else {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = 'none';
    return 'Variable editor panel hidden.';
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
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.display = extension_settings[EXTENSION_NAME].isShown ? 'block' : 'none';
    }

    // Add event listeners for dynamic updates
    eventSource.on(event_types.CHAT_CHANGED, async () => {
      const { characterId, chatMetadata, saveMetadata } = SillyTavern.getContext();
      
      // If no chat is opened, clear local variables
      if (!characterId) {
        chatMetadata.variables = {};
        await saveMetadata();
      }
      
      // Stop the current update loop to prevent interference
      stopUpdateLoop();
      
      // Remove the existing panel to prevent showing old variables
      document.getElementById(PANEL_ID)?.remove();
      
      // Re-render the panel when chat changes
      renderPanel();
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        panel.style.display = extension_settings[EXTENSION_NAME].isShown ? 'block' : 'none';
      }
    });

    // Extension initialization complete
  } catch (error) {
    console.error(CONSOLE_PREFIX, 'Initialization error:', error);
  }
});
