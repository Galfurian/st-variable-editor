// Utility functions for Variable Editor
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

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
  const name = prompt(`Enter ${type} variable name:`);
  if (!name) return;

  const value = prompt(`Enter ${type} variable value:`);
  if (value === null || value === undefined) return;

  if (type === 'local') {
    const { chatMetadata } = SillyTavern.getContext();
    if (!chatMetadata.variables) chatMetadata.variables = {};
    chatMetadata.variables[name] = value;
  } else {
    if (!extension_settings.variables) extension_settings.variables = {};
    if (!extension_settings.variables.global) extension_settings.variables.global = {};
    extension_settings.variables.global[name] = value;
  }

  saveSettingsDebounced();
  const { renderPanel } = await import('./ui.js');
  renderPanel();
}

// Delete a variable
export async function deleteVariable(key, type) {
  if (!confirm(`Are you sure you want to delete the ${type} variable "${key}"?`)) return;

  if (type === 'local') {
    const { chatMetadata } = SillyTavern.getContext();
    if (chatMetadata.variables) {
      delete chatMetadata.variables[key];
    }
  } else {
    if (extension_settings.variables?.global) {
      delete extension_settings.variables.global[key];
    }
  }

  saveSettingsDebounced();
  const { renderPanel } = await import('./ui.js');
  renderPanel();
}

// Update variable name
export async function updateVariableName(oldKey, newKey, type) {
  if (oldKey === newKey) return;

  if (type === 'local') {
    const { chatMetadata } = SillyTavern.getContext();
    const vars = chatMetadata.variables;
    if (vars && vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
    }
  } else {
    const vars = extension_settings.variables?.global;
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
  if (type === 'local') {
    const { chatMetadata } = SillyTavern.getContext();
    if (!chatMetadata.variables) chatMetadata.variables = {};
    chatMetadata.variables[key] = value;
  } else {
    if (!extension_settings.variables) extension_settings.variables = {};
    if (!extension_settings.variables.global) extension_settings.variables.global = {};
    extension_settings.variables.global[key] = value;
  }

  saveSettingsDebounced();
}

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
export async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }
}