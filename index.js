// The main script for the extension
// Variable Editor for SillyTavern

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced, chat_metadata } from "../../../../script.js";
import { registerSlashCommand } from '../../../slash-commands.js';

// Keep track of where your extension is located, name should match repo name
const extensionName = "st-variable-editor";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    isShown: true,
    fontSize: 1.0
};


 
// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }
}

function togglePanel() {
  extension_settings[extensionName].isShown = !extension_settings[extensionName].isShown;
  if (extension_settings[extensionName].isShown) {
    renderPanel();
  } else {
    unrenderPanel();
  }
  saveSettingsDebounced();
}

function renderPanel() {
  // Create the panel
  const panel = document.createElement('div');
  panel.id = 'variable-editor-panel';
  panel.style.position = 'fixed';
  panel.style.top = '100px';
  panel.style.right = '10px';
  panel.style.width = '300px';
  panel.style.maxHeight = '80vh';
  panel.style.overflow = 'auto';
  panel.style.background = 'white';
  panel.style.border = '1px solid black';
  panel.style.padding = '10px';
  panel.style.zIndex = '1000';

  const title = document.createElement('h3');
  title.textContent = 'Variable Editor';
  panel.append(title);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.onclick = togglePanel;
  panel.append(closeBtn);

  // Display variables
  const localVars = chat_metadata.variables || {};
  const globalVars = extension_settings.variables?.global || {};

  const localDiv = document.createElement('div');
  localDiv.innerHTML = '<h4>Local Variables</h4>';
  const localPre = document.createElement('pre');
  localPre.textContent = JSON.stringify(localVars, null, 2);
  localDiv.append(localPre);
  panel.append(localDiv);

  const globalDiv = document.createElement('div');
  globalDiv.innerHTML = '<h4>Global Variables</h4>';
  const globalPre = document.createElement('pre');
  globalPre.textContent = JSON.stringify(globalVars, null, 2);
  globalDiv.append(globalPre);
  panel.append(globalDiv);

  document.body.append(panel);
}

function unrenderPanel() {
  const panel = document.getElementById('variable-editor-panel');
  if (panel) panel.remove();
}

// This function is called when the extension is loaded
jQuery(async () => {
  // Load settings
  loadSettings();

  // Register slash command
  registerSlashCommand('variableeditor', togglePanel, [], 'show / hide the variable editor panel', true, true);

  // Initial render if shown
  if (extension_settings[extensionName].isShown) {
    renderPanel();
  }
});
