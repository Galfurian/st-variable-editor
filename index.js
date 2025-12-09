// The main script for the extension
// Variable Editor for SillyTavern

// Import dependencies
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, chat_metadata } from "../../../../script.js";
import { registerSlashCommand } from '../../../slash-commands.js';

// Import our modules
import { renderPanel, unrenderPanel } from './src/ui.js';
import { loadSettings } from './src/utils.js';

// Extension configuration
const extensionName = "st-variable-editor";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    isShown: true,
    fontSize: 1.0
};

// Toggle panel visibility
function togglePanel() {
  extension_settings[extensionName].isShown = !extension_settings[extensionName].isShown;
  if (extension_settings[extensionName].isShown) {
    renderPanel();
  } else {
    unrenderPanel();
  }
  saveSettingsDebounced();
}

// This function is called when the extension is loaded
jQuery(async () => {
  try {
    console.log('[Variable Editor] Starting initialization');
    const context = SillyTavern.getContext();
    console.log('[Variable Editor] Got context');
    const { eventSource, event_types } = context;

    // Load settings
    await loadSettings();
    console.log('[Variable Editor] Settings loaded');

    // Register slash command
    registerSlashCommand('variableeditor', togglePanel, [], 'show / hide the variable editor panel', true, true);
    console.log('[Variable Editor] Slash command registered');

    // Initial render if shown
    if (extension_settings[extensionName].isShown) {
      console.log('[Variable Editor] Initial render - isShown is true');
      renderPanel();
    } else {
      console.log('[Variable Editor] Initial render - isShown is false');
    }

    // Add event listeners for dynamic updates
    eventSource.on(event_types.CHAT_CHANGED, () => {
      console.log('[Variable Editor] Chat changed event');
      if (extension_settings[extensionName].isShown) {
        renderPanel();
      }
    });

    console.log('[Variable Editor] Initialization completed');
  } catch (error) {
    console.error('[Variable Editor] Initialization error:', error);
  }
});
