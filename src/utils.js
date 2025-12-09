// Utility functions for Variable Editor
import { chat_metadata } from "../../../../script.js";

// Extension configuration
const extensionName = "st-variable-editor";

// Create a variable row element
export function createVariableRow(key, value, type) {
  const row = document.createElement('div');
  row.classList.add('variable-row');

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = key;
  nameInput.classList.add('var-name');
  nameInput.setAttribute('data-var-key', key);
  nameInput.setAttribute('data-var-type', type);
  nameInput.onchange = () => updateVariableName(key, nameInput.value, type);

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.value = value;
  valueInput.classList.add('var-value');
  valueInput.setAttribute('data-var-key', key);
  valueInput.setAttribute('data-var-type', type);
  valueInput.onchange = () => updateVariableValue(nameInput.value, valueInput.value, type);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => deleteVariable(key, type);

  row.append(nameInput);
  row.append(valueInput);
  row.append(deleteBtn);

  return row;
}

// Add a new variable
export async function addVariable(type) {
  const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
  const name = prompt(`Enter ${type} variable name:`);
  if (!name) return;

  const value = prompt(`Enter ${type} variable value:`);
  if (value === null || value === undefined) return;

  if (type === 'local') {
    if (!chat_metadata.variables) chat_metadata.variables = {};
    chat_metadata.variables[name] = value;
  } else {
    if (!extensionSettings.variables) extensionSettings.variables = {};
    if (!extensionSettings.variables.global) extensionSettings.variables.global = {};
    extensionSettings.variables.global[name] = value;
  }

  saveSettingsDebounced();
  const { renderPanel } = await import('./ui.js');
  renderPanel();
}

// Delete a variable
export async function deleteVariable(key, type) {
  const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
  if (!confirm(`Are you sure you want to delete the ${type} variable "${key}"?`)) return;

  if (type === 'local') {
    if (chat_metadata.variables) {
      delete chat_metadata.variables[key];
    }
  } else {
    if (extensionSettings.variables?.global) {
      delete extensionSettings.variables.global[key];
    }
  }

  saveSettingsDebounced();
  const { renderPanel } = await import('./ui.js');
  renderPanel();
}

// Update variable name
export async function updateVariableName(oldKey, newKey, type) {
  const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
  if (oldKey === newKey) return;

  if (type === 'local') {
    const vars = chat_metadata.variables;
    if (vars && vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
    }
  } else {
    const vars = extensionSettings.variables?.global;
    if (vars && vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
    }
  }

  saveSettingsDebounced();
  const { renderPanel } = await import('./ui.js');
  renderPanel();
}

// Update variable value
export function updateVariableValue(key, value, type) {
  const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
  if (type === 'local') {
    if (!chat_metadata.variables) chat_metadata.variables = {};
    chat_metadata.variables[key] = value;
  } else {
    if (!extensionSettings.variables) extensionSettings.variables = {};
    if (!extensionSettings.variables.global) extensionSettings.variables.global = {};
    extensionSettings.variables.global[key] = value;
  }

  saveSettingsDebounced();
}

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
export async function loadSettings() {
  const { extensionSettings } = SillyTavern.getContext();
  //Create the settings if they don't exist
  extensionSettings[extensionName] = extensionSettings[extensionName] || {};
  if (Object.keys(extensionSettings[extensionName]).length === 0) {
    Object.assign(extensionSettings[extensionName], defaultSettings);
  }
}