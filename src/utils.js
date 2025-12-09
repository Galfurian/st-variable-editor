// Utility functions for Variable Editor
import { chat_metadata } from "../../../../../script.js";

// Extension configuration
const extensionName = "st-variable-editor";

// Variable item class for better management.
class VariableItem {
  constructor(key, value, type) {
    this.key = key;
    this.value = value;
    this.type = type;
    this.row = null;
    this.nameInput = null;
    this.valueInput = null;
  }

  /** Renders the variable item as a DOM element */
  render() {
    if (this.row) return this.row;

    this.row = document.createElement('div');
    this.row.classList.add('variable-row');

    this.nameInput = this.createNameInput();
    this.valueInput = this.createValueInput();
    const deleteBtn = this.createDeleteButton();

    this.row.append(this.nameInput, this.valueInput, deleteBtn);

    return this.row;
  }

  /** Creates the name input element */
  createNameInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.key;
    input.classList.add('var-name');
    input.setAttribute('data-var-key', this.key);
    input.setAttribute('data-var-type', this.type);
    input.onchange = () => updateVariableName(this.key, input.value, this.type);
    return input;
  }

  /** Creates the value input element */
  createValueInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.value;
    input.classList.add('var-value');
    input.setAttribute('data-var-key', this.key);
    input.setAttribute('data-var-type', this.type);
    input.onchange = () => updateVariableValue(this.nameInput.value, input.value, this.type);
    return input;
  }

  /** Creates the delete button with confirmation logic */
  createDeleteButton() {
    const button = document.createElement('button');
    button.classList.add('fa-solid', 'fa-circle-xmark');
    button.title = 'Delete variable';
    button.onclick = () => {
      if (button.classList.contains('confirm-delete')) {
        deleteVariable(this.key, this.type);
      } else {
        button.classList.add('confirm-delete');
        button.title = 'Click again to confirm deletion';
      }
    };
    return button;
  }

  /** Updates the value input with new value */
  update(newValue) {
    if (this.valueInput) {
      this.valueInput.value = newValue;
    }
    this.value = newValue;
  }

  /** Removes the row from DOM */
  remove() {
    if (this.row) {
      this.row.remove();
    }
  }
}

export { VariableItem };

// Create an add row element
/** Creates a row for adding new variables */
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
  addBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const value = valueInput.value.trim();
    const added = await addVariable(type, name, value);
    if (added) {
      nameInput.value = '';
      valueInput.value = '';
    }
  };

  row.append(nameInput);
  row.append(valueInput);
  row.append(addBtn);

  return row;
}

/** Adds a new variable to the specified scope */
export async function addVariable(type, providedName, providedValue) {
  try {
    const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();

    if (!providedName) {
      toastr.error('Variable name cannot be empty.');
      return false;
    }
    if (!providedValue) {
      toastr.error('Variable value cannot be empty.');
      return false;
    }

    if (type === 'local') {
      if (!chat_metadata.variables) chat_metadata.variables = {};
      chat_metadata.variables[providedName] = providedValue;
    } else {
      if (!extensionSettings.variables) extensionSettings.variables = {};
      if (!extensionSettings.variables.global) extensionSettings.variables.global = {};
      extensionSettings.variables.global[providedName] = providedValue;
    }

    saveSettingsDebounced();
    toastr.success('Variable added successfully!');
    const { renderPanel } = await import('./ui.js');
    await renderPanel();
    return true;
  } catch (error) {
    console.error('[Variable Editor] Error adding variable:', error);
    toastr.error('Failed to add variable. Please try again.');
    return false;
  }
}

/** Deletes a variable from the specified scope */
export async function deleteVariable(key, type) {
  try {
    const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();

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
    toastr.success('Variable deleted successfully!');
    const { renderPanel } = await import('./ui.js');
    await renderPanel();
  } catch (error) {
    console.error('[Variable Editor] Error deleting variable:', error);
    toastr.error('Failed to delete variable. Please try again.');
  }
}

/** Updates the name of an existing variable */
export async function updateVariableName(oldKey, newKey, type) {
  try {
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
    await renderPanel();
  } catch (error) {
    console.error('[Variable Editor] Error updating variable name:', error);
    toastr.error('Failed to update variable name. Please try again.');
  }
}

/** Updates the value of an existing variable */
export async function updateVariableValue(key, value, type) {
  try {
    const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();

    if (type === 'local') {
      const vars = chat_metadata.variables;
      if (vars) {
        vars[key] = value;
      }
    } else {
      const vars = extensionSettings.variables?.global;
      if (vars) {
        vars[key] = value;
      }
    }

    saveSettingsDebounced();
    const { renderPanel } = await import('./ui.js');
    await renderPanel();
  } catch (error) {
    console.error('[Variable Editor] Error updating variable value:', error);
    toastr.error('Failed to update variable value. Please try again.');
  }
}