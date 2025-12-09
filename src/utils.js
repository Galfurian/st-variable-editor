// Utility functions for Variable Editor
import { chat_metadata } from "../../../../../script.js";

// Extension configuration
const extensionName = "st-variable-editor";

// Variable item class for better management
class VariableItem {
  constructor(key, value, type) {
    this.key = key;
    this.value = value;
    this.type = type;
    this.row = null;
    this.nameInput = null;
    this.valueInput = null;
  }

  render() {
    if (this.row) return this.row;

    this.row = document.createElement('div');
    this.row.classList.add('variable-row');

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.value = this.key;
    this.nameInput.classList.add('var-name');
    this.nameInput.setAttribute('data-var-key', this.key);
    this.nameInput.setAttribute('data-var-type', this.type);
    this.nameInput.onchange = () => updateVariableName(this.key, this.nameInput.value, this.type);

    this.valueInput = document.createElement('input');
    this.valueInput.type = 'text';
    this.valueInput.value = this.value;
    this.valueInput.classList.add('var-value');
    this.valueInput.setAttribute('data-var-key', this.key);
    this.valueInput.setAttribute('data-var-type', this.type);
    this.valueInput.onchange = () => updateVariableValue(this.nameInput.value, this.valueInput.value, this.type);

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('fa-solid', 'fa-circle-xmark');
    deleteBtn.title = 'Delete variable';
    deleteBtn.onclick = () => deleteVariable(this.key, this.type);

    this.row.append(this.nameInput);
    this.row.append(this.valueInput);
    this.row.append(deleteBtn);

    return this.row;
  }

  update(newValue) {
    if (this.valueInput) {
      this.valueInput.value = newValue;
    }
    this.value = newValue;
  }

  remove() {
    if (this.row) {
      this.row.remove();
    }
  }
}

export { VariableItem };

// Create an add row element
export function createAddRow(type) {
  const row = document.createElement('div');
  row.classList.add('variable-row');

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Variable name';
  nameInput.classList.add('var-name');

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'Variable value';
  valueInput.classList.add('var-value');

  const addBtn = document.createElement('button');
  addBtn.classList.add('menu_button', 'menu_button_icon');
  addBtn.title = 'Add variable';
  const icon = document.createElement('i');
  icon.classList.add('fa-fw', 'fa-solid', 'fa-file-circle-plus');
  addBtn.append(icon);
  addBtn.onclick = () => {
    const name = nameInput.value.trim();
    const value = valueInput.value.trim();
    addVariable(type, name, value);
    nameInput.value = '';
    valueInput.value = '';
  };

  row.append(nameInput);
  row.append(valueInput);
  row.append(addBtn);

  return row;
}

// Add a new variable
export async function addVariable(type, providedName, providedValue) {
  const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();

  if (!providedName || !providedValue) return;

  if (type === 'local') {
    if (!chat_metadata.variables) chat_metadata.variables = {};
    chat_metadata.variables[providedName] = providedValue;
  } else {
    if (!extensionSettings.variables) extensionSettings.variables = {};
    if (!extensionSettings.variables.global) extensionSettings.variables.global = {};
    extensionSettings.variables.global[providedName] = providedValue;
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