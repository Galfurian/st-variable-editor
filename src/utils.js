/**
 * Utility functions and classes for managing variables in SillyTavern.
 */

// Extension configuration
const EXTENSION_NAME = 'st-variable-editor';

// Debug prefix for console messages
const CONSOLE_PREFIX = '[Variable Editor] ';

/**
 * Variable types constants.
 */
const VARIABLE_TYPES = {
  LOCAL: 'local',
  GLOBAL: 'global'
};

/**
 * Variable store class to abstract local/global variable handling.
 */
class VariableStore {
  constructor(type) {
    this.type = type;
  }

  /**
   * Gets all variables for this store type.
   * @returns {Object} The variables object.
   */
  getAll() {
    if (this.type === VARIABLE_TYPES.LOCAL) {
      const {chatMetadata} = SillyTavern.getContext();
      if (!chatMetadata.variables) chatMetadata.variables = {};
      return chatMetadata.variables;
    } else {
      const {extensionSettings} = SillyTavern.getContext();
      if (!extensionSettings.variables) extensionSettings.variables = {};
      if (!extensionSettings.variables.global)
        extensionSettings.variables.global = {};
      return extensionSettings.variables.global;
    }
  }

  /**
   * Sets a variable in this store.
   * @param {*} key the variable name.
   * @param {*} value the variable value.
   */
  set(key, value) {
    const vars = this.getAll();
    vars[key] = value;
  }

  /**
   * Deletes a variable from this store.
   * @param {*} key the variable name.
   */
  delete(key) {
    const vars = this.getAll();
    delete vars[key];
  }

  /**
   * Renames a variable in this store.
   * @param {*} oldKey the current variable name.
   * @param {*} newKey the new variable name.
   */
  rename(oldKey, newKey) {
    const vars = this.getAll();
    if (vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
    }
  }
}

/**
 * Variable item class for better management.
 */
class VariableItem {
  /**
   * Creates a VariableItem instance.
   * @param {*} key the variable name.
   * @param {*} value the variable value.
   * @param {*} type the variable type (local/global).
   */
  constructor(key, value, type) {
    this.key = key;
    this.value = value;
    this.type = type;
    this.row = null;
    this.nameInput = null;
    this.valueInput = null;
  }

  /**
   * Renders the variable item as a DOM element.
   * @returns {HTMLElement} The row element.
   */
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

  /**
   * Creates the name input element.
   * @returns {HTMLElement} The name input element.
   */
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

  /**
   * Creates the value input element.
   * @returns {HTMLElement} The value input element.
   */
  createValueInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.value;
    input.classList.add('var-value');
    input.setAttribute('data-var-key', this.key);
    input.setAttribute('data-var-type', this.type);
    input.onchange = () =>
        updateVariableValue(this.nameInput.value, input.value, this.type);
    return input;
  }

  /**
   * Creates the delete button with confirmation logic.
   * @returns {HTMLElement} The delete button element.
   */
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

  /**
   * Updates the value input with new value.
   * @param {*} newValue the new variable value.
   */
  update(newValue) {
    if (this.valueInput) {
      this.valueInput.value = newValue;
    }
    this.value = newValue;
  }

  /**
   * Removes the row from DOM.
   */
  remove() {
    if (this.row) {
      this.row.remove();
    }
  }
}

export {VariableItem, VARIABLE_TYPES};

/**
 * Creates a row for adding new variables.
 * @param {*} type the variable type (local/global).
 * @returns {HTMLElement} The add row element.
 */
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

  // Add Enter key support for adding variable
  valueInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const name = nameInput.value.trim();
      const value = valueInput.value.trim();
      const added = await addVariable(type, name, value);
      if (added) {
        nameInput.value = '';
        valueInput.value = '';
      }
    }
  });

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

/**
 * Adds a new variable to the specified scope
 * @param {*} type the variable type (local/global).
 * @param {*} providedName the variable name.
 * @param {*} providedValue the variable value.
 * @returns {boolean} True if added successfully, false otherwise.
 */
export async function addVariable(type, providedName, providedValue) {
  try {
    const {saveSettingsDebounced, saveMetadata} = SillyTavern.getContext();
    const store = new VariableStore(type);

    if (!providedName) {
      toastr.error('Variable name cannot be empty.');
      return false;
    }
    if (!providedValue) {
      toastr.error('Variable value cannot be empty.');
      return false;
    }

    // Validate variable value length
    if (providedValue.length > 1000) {
      toastr.error('Variable value cannot exceed 1000 characters.');
      return false;
    }

    // Validate variable name
    if (providedName.length > 50) {
      toastr.error('Variable name cannot exceed 50 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(providedName)) {
      toastr.error('Variable name can only contain letters, numbers, underscores, and dashes.');
      return false;
    }

    // Check for duplicates
    const existingVars = store.getAll();
    if (existingVars[providedName] !== undefined) {
      toastr.error('A variable with this name already exists.');
      return false;
    }

    store.set(providedName, providedValue);

    if (type === VARIABLE_TYPES.LOCAL) {
      await saveMetadata();
    } else {
      saveSettingsDebounced();
    }
    toastr.success('Variable added successfully!');
    const {renderPanel} = await import('./ui.js');
    await renderPanel();
    return true;
  } catch (error) {
    console.error(CONSOLE_PREFIX, 'Error adding variable:', error);
    toastr.error('Failed to add variable. Please try again.');
    return false;
  }
}

/**
 * Deletes a variable from the specified scope.
 * @param {*} key the variable name.
 * @param {*} type the variable type (local/global).
 */
export async function deleteVariable(key, type) {
  try {
    const {saveSettingsDebounced, saveMetadata} = SillyTavern.getContext();
    const store = new VariableStore(type);

    store.delete(key);

    if (type === VARIABLE_TYPES.LOCAL) {
      await saveMetadata();
    } else {
      saveSettingsDebounced();
    }
    toastr.success('Variable deleted successfully!');
    const {renderPanel} = await import('./ui.js');
    await renderPanel();
  } catch (error) {
    console.error(CONSOLE_PREFIX, 'Error deleting variable:', error);
    toastr.error('Failed to delete variable. Please try again.');
  }
}

/**
 * Updates the name of an existing variable.
 * @param {*} oldKey the current variable name.
 * @param {*} newKey the new variable name.
 * @param {*} type the variable type (local/global).
 * @returns {boolean} True if updated successfully, false otherwise.
 */
export async function updateVariableName(oldKey, newKey, type) {
  try {
    const {saveSettingsDebounced, saveMetadata} = SillyTavern.getContext();
    if (oldKey === newKey) return;

    // Validate new variable name
    if (!newKey) {
      toastr.error('Variable name cannot be empty.');
      return false;
    }
    if (newKey.length > 50) {
      toastr.error('Variable name cannot exceed 50 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newKey)) {
      toastr.error('Variable name can only contain letters, numbers, underscores, and dashes.');
      return false;
    }

    const store = new VariableStore(type);
    const existingVars = store.getAll();
    if (existingVars[newKey] !== undefined && newKey !== oldKey) {
      toastr.error('A variable with this name already exists.');
      return false;
    }

    store.rename(oldKey, newKey);

    if (type === VARIABLE_TYPES.LOCAL) {
      await saveMetadata();
    } else {
      saveSettingsDebounced();
    }
    const {renderPanel} = await import('./ui.js');
    await renderPanel();
  } catch (error) {
    console.error(CONSOLE_PREFIX, 'Error updating variable name:', error);
    toastr.error('Failed to update variable name. Please try again.');
  }
}

/**
 * Updates the value of an existing variable.
 * @param {string} key - The variable name.
 * @param {string} value - The new variable value.
 * @param {string} type - The variable type (local/global).
 */
export async function updateVariableValue(key, value, type) {
  try {
    const {saveSettingsDebounced, saveMetadata} = SillyTavern.getContext();
    const store = new VariableStore(type);

    // Validate variable value length
    if (value.length > 1000) {
      toastr.error('Variable value cannot exceed 1000 characters.');
      return false;
    }

    store.set(key, value);

    if (type === VARIABLE_TYPES.LOCAL) {
      await saveMetadata();
    } else {
      saveSettingsDebounced();
    }
    const {renderPanel} = await import('./ui.js');
    await renderPanel();
  } catch (error) {
    console.error(CONSOLE_PREFIX, 'Error updating variable value:', error);
    toastr.error('Failed to update variable value. Please try again.');
  }
}