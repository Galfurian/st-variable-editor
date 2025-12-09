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
  panel.classList.add('variable-editor-panel');

  const title = document.createElement('h3');
  title.textContent = 'Variable Editor';
  panel.append(title);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.onclick = togglePanel;
  panel.append(closeBtn);

  // Local Variables Section
  const localDiv = document.createElement('div');
  localDiv.classList.add('variable-section');
  const localTitle = document.createElement('h4');
  localTitle.textContent = 'Local Variables';
  localDiv.append(localTitle);

  const localVars = chat_metadata.variables || {};
  for (const key in localVars) {
    const row = createVariableRow(key, localVars[key], 'local');
    localDiv.append(row);
  }
  const addLocalBtn = document.createElement('button');
  addLocalBtn.textContent = 'Add Local Variable';
  addLocalBtn.onclick = () => addVariable('local');
  localDiv.append(addLocalBtn);
  panel.append(localDiv);

  // Global Variables Section
  const globalDiv = document.createElement('div');
  globalDiv.classList.add('variable-section');
  const globalTitle = document.createElement('h4');
  globalTitle.textContent = 'Global Variables';
  globalDiv.append(globalTitle);

  const globalVars = extension_settings.variables?.global || {};
  for (const key in globalVars) {
    const row = createVariableRow(key, globalVars[key], 'global');
    globalDiv.append(row);
  }
  const addGlobalBtn = document.createElement('button');
  addGlobalBtn.textContent = 'Add Global Variable';
  addGlobalBtn.onclick = () => addVariable('global');
  globalDiv.append(addGlobalBtn);
  panel.append(globalDiv);

  document.body.append(panel);
}

function createVariableRow(key, value, type) {
  const row = document.createElement('div');
  row.classList.add('variable-row');

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = key;
  nameInput.classList.add('var-name');
  nameInput.onchange = () => updateVariableName(key, nameInput.value, type);

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.value = value;
  valueInput.classList.add('var-value');
  valueInput.onchange = () => updateVariableValue(nameInput.value, valueInput.value, type);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => deleteVariable(key, type);

  row.append(nameInput);
  row.append(valueInput);
  row.append(deleteBtn);

  return row;
}

function updateVariableName(oldKey, newKey, type) {
  if (type === 'local') {
    const vars = chat_metadata.variables;
    if (vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
    }
  } else {
    const vars = extension_settings.variables.global;
    if (vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
      saveSettingsDebounced();
    }
  }
  // Re-render to update
  renderPanel();
}

function updateVariableValue(key, value, type) {
  if (type === 'local') {
    chat_metadata.variables[key] = value;
  } else {
    extension_settings.variables.global[key] = value;
    saveSettingsDebounced();
  }
}

function deleteVariable(key, type) {
  if (type === 'local') {
    delete chat_metadata.variables[key];
  } else {
    delete extension_settings.variables.global[key];
    saveSettingsDebounced();
  }
  // Re-render
  renderPanel();
}

function addVariable(type) {
  const key = prompt('Enter variable name:');
  if (!key) return;
  const value = prompt('Enter variable value:');
  if (value === null) return;

  if (type === 'local') {
    chat_metadata.variables[key] = value;
  } else {
    if (!extension_settings.variables) extension_settings.variables = {};
    if (!extension_settings.variables.global) extension_settings.variables.global = {};
    extension_settings.variables.global[key] = value;
    saveSettingsDebounced();
  }
  // Re-render
  renderPanel();
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
