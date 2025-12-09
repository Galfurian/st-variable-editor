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

// Store previous variable states to detect changes
let previousLocalVars = JSON.stringify({});
let previousGlobalVars = JSON.stringify({});

// Keep references to current input elements for efficient updates
let localVarInputs = new Map();
let globalVarInputs = new Map();

// Flag to control the update loop
let isUpdating = false;

// Continuous update loop like the original Variable Viewer
async function startUpdateLoop() {
  if (isUpdating) return;
  isUpdating = true;

  while (extension_settings[extensionName].isShown) {
    try {
      const { chatMetadata } = SillyTavern.getContext();
      const currentLocalVars = chatMetadata.variables || {};
      const currentGlobalVars = extension_settings.variables?.global || {};

      const localVarsStr = JSON.stringify(currentLocalVars);
      const globalVarsStr = JSON.stringify(currentGlobalVars);

      // Check if variables have changed
      if (localVarsStr !== previousLocalVars || globalVarsStr !== previousGlobalVars) {
        previousLocalVars = localVarsStr;
        previousGlobalVars = globalVarsStr;

        // Update existing inputs without re-rendering
        updateExistingInputs(currentLocalVars, currentGlobalVars);

        // Check if structure changed (added/removed variables)
        if (hasStructureChanged(currentLocalVars, currentGlobalVars)) {
          renderPanel();
        }
      }

      // Wait 200ms before next check (same as original)
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('[Variable Editor] Error in update loop:', error);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait longer on error
    }
  }

  isUpdating = false;
}

// Stop the update loop
function stopUpdateLoop() {
  isUpdating = false;
}

// Update existing input values without re-rendering the DOM
function updateExistingInputs(currentLocalVars, currentGlobalVars) {
  // Update local variable inputs
  for (const [key, value] of Object.entries(currentLocalVars)) {
    const input = localVarInputs.get(key);
    if (input && input.value !== String(value)) {
      input.value = value;
    }
  }

  // Update global variable inputs
  for (const [key, value] of Object.entries(currentGlobalVars)) {
    const input = globalVarInputs.get(key);
    if (input && input.value !== String(value)) {
      input.value = value;
    }
  }
}

// Check if the variable structure changed (added/removed variables)
function hasStructureChanged(currentLocalVars, currentGlobalVars) {
  const currentLocalKeys = new Set(Object.keys(currentLocalVars));
  const currentGlobalKeys = new Set(Object.keys(currentGlobalVars));

  const previousLocalKeys = new Set(Object.keys(JSON.parse(previousLocalVars)));
  const previousGlobalKeys = new Set(Object.keys(JSON.parse(previousGlobalVars)));

  // Check if any keys were added or removed
  const localKeysChanged = currentLocalKeys.size !== previousLocalKeys.size ||
    [...currentLocalKeys].some(key => !previousLocalKeys.has(key)) ||
    [...previousLocalKeys].some(key => !currentLocalKeys.has(key));

  const globalKeysChanged = currentGlobalKeys.size !== previousGlobalKeys.size ||
    [...currentGlobalKeys].some(key => !previousGlobalKeys.has(key)) ||
    [...previousGlobalKeys].some(key => !currentGlobalKeys.has(key));

  return localKeysChanged || globalKeysChanged;
}


 
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
  console.log('[Variable Editor] renderPanel called');
  const { chatMetadata } = SillyTavern.getContext();
  console.log('[Variable Editor] Got chatMetadata');
  // Create the panel
  const panel = document.createElement('div');
  panel.id = 'variable-editor-panel';
  panel.classList.add('variable-editor-panel');
  panel.classList.add('fillRight');
  panel.classList.add('openDrawer');
  panel.classList.add('pinnedOpen');

  const title = document.createElement('h3');
  title.textContent = 'Variable Editor';
  panel.append(title);

  const dragHandle = document.createElement('div');
  dragHandle.id = 'variable-editor-drag-handle';
  dragHandle.classList.add('drag-grabber');
  dragHandle.classList.add('fa-solid');
  dragHandle.classList.add('fa-grip');
  panel.append(dragHandle);

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('fa-solid');
  closeBtn.classList.add('fa-circle-xmark');
  closeBtn.onclick = togglePanel;
  panel.append(closeBtn);

  // Local Variables Section
  const localDiv = document.createElement('div');
  localDiv.classList.add('variable-section');
  localDiv.classList.add('inline-drawer');

  const localHeader = document.createElement('div');
  localHeader.classList.add('inline-drawer-toggle');
  localHeader.classList.add('inline-drawer-header');

  const localTitle = document.createElement('b');
  localTitle.textContent = 'Local Variables';
  localHeader.append(localTitle);

  const localIcon = document.createElement('div');
  localIcon.classList.add('inline-drawer-icon');
  localIcon.classList.add('fa-solid');
  localIcon.classList.add('fa-circle-chevron-up');
  localIcon.classList.add('down');
  localHeader.append(localIcon);

  const addLocalBtn = document.createElement('button');
  addLocalBtn.textContent = '+';
  addLocalBtn.title = 'Add Local Variable';
  addLocalBtn.onclick = () => addVariable('local');
  localHeader.append(addLocalBtn);

  localHeader.onclick = (e) => {
    if (e.target === addLocalBtn) return; // Don't toggle if clicking add button
    const content = localHeader.nextElementSibling;
    const icon = localHeader.querySelector('.inline-drawer-icon');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.classList.add('down');
    } else {
      content.style.display = 'none';
      icon.classList.remove('down');
    }
  };

  localDiv.append(localHeader);

  const localContent = document.createElement('div');
  localContent.classList.add('inline-drawer-content');
  localContent.style.display = 'block';

  const localVars = chatMetadata.variables || {};
  for (const key in localVars) {
    const row = createVariableRow(key, localVars[key], 'local');
    localContent.append(row);
  }

  localDiv.append(localContent);
  panel.append(localDiv);

  // Global Variables Section
  const globalDiv = document.createElement('div');
  globalDiv.classList.add('variable-section');
  globalDiv.classList.add('inline-drawer');

  const globalHeader = document.createElement('div');
  globalHeader.classList.add('inline-drawer-toggle');
  globalHeader.classList.add('inline-drawer-header');

  const globalTitle = document.createElement('b');
  globalTitle.textContent = 'Global Variables';
  globalHeader.append(globalTitle);

  const globalIcon = document.createElement('div');
  globalIcon.classList.add('inline-drawer-icon');
  globalIcon.classList.add('fa-solid');
  globalIcon.classList.add('fa-circle-chevron-up');
  globalIcon.classList.add('down');
  globalHeader.append(globalIcon);

  const addGlobalBtn = document.createElement('button');
  addGlobalBtn.textContent = '+';
  addGlobalBtn.title = 'Add Global Variable';
  addGlobalBtn.onclick = () => addVariable('global');
  globalHeader.append(addGlobalBtn);

  globalHeader.onclick = (e) => {
    if (e.target === addGlobalBtn) return; // Don't toggle if clicking add button
    const content = globalHeader.nextElementSibling;
    const icon = globalHeader.querySelector('.inline-drawer-icon');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.classList.add('down');
    } else {
      content.style.display = 'none';
      icon.classList.remove('down');
    }
  };

  globalDiv.append(globalHeader);

  const globalContent = document.createElement('div');
  globalContent.classList.add('inline-drawer-content');
  globalContent.style.display = 'block';

  const globalVars = extension_settings.variables?.global || {};
  for (const key in globalVars) {
    const row = createVariableRow(key, globalVars[key], 'global');
    globalContent.append(row);
  }

  globalDiv.append(globalContent);
  panel.append(globalDiv);

  document.body.append(panel);
  console.log('[Variable Editor] Panel appended to body');

  // Store references to input elements for efficient updates
  storeInputReferences(localVars, globalVars);

  // Update previous variable states
  previousLocalVars = JSON.stringify(chatMetadata.variables || {});
  previousGlobalVars = JSON.stringify(extension_settings.variables?.global || {});
  console.log('[Variable Editor] renderPanel completed');

  // Start the continuous update loop
  startUpdateLoop();
}

// Store references to input elements for efficient updates
function storeInputReferences(localVars, globalVars) {
  // Clear existing references
  localVarInputs.clear();
  globalVarInputs.clear();

  // Store local variable input references
  for (const key in localVars) {
    const input = document.querySelector(`input[data-var-key="${key}"][data-var-type="local"]`);
    if (input) {
      localVarInputs.set(key, input);
    }
  }

  // Store global variable input references
  for (const key in globalVars) {
    const input = document.querySelector(`input[data-var-key="${key}"][data-var-type="global"]`);
    if (input) {
      globalVarInputs.set(key, input);
    }
  }
}

function createVariableRow(key, value, type) {
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

function updateVariableName(oldKey, newKey, type) {
  if (type === 'local') {
    const { chatMetadata } = SillyTavern.getContext();
    const vars = chatMetadata.variables;
    if (vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
      // Update input reference
      if (localVarInputs.has(oldKey)) {
        localVarInputs.delete(oldKey);
        const input = document.querySelector(`input[data-var-key="${newKey}"][data-var-type="local"]`);
        if (input) {
          localVarInputs.set(newKey, input);
        }
      }
    }
  } else {
    const vars = extension_settings.variables.global;
    if (vars[oldKey] !== undefined) {
      vars[newKey] = vars[oldKey];
      delete vars[oldKey];
      // Update input reference
      if (globalVarInputs.has(oldKey)) {
        globalVarInputs.delete(oldKey);
        const input = document.querySelector(`input[data-var-key="${newKey}"][data-var-type="global"]`);
        if (input) {
          globalVarInputs.set(newKey, input);
        }
      }
      saveSettingsDebounced();
    }
  }
  // Re-render to update
  renderPanel();
}

function updateVariableValue(key, value, type) {
  if (type === 'local') {
    const { chatMetadata } = SillyTavern.getContext();
    chatMetadata.variables[key] = value;
  } else {
    extension_settings.variables.global[key] = value;
    saveSettingsDebounced();
  }
}

function deleteVariable(key, type) {
  if (type === 'local') {
    const { chatMetadata } = SillyTavern.getContext();
    delete chatMetadata.variables[key];
    // Remove input reference
    localVarInputs.delete(key);
  } else {
    delete extension_settings.variables.global[key];
    // Remove input reference
    globalVarInputs.delete(key);
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
    const { chatMetadata } = SillyTavern.getContext();
    chatMetadata.variables[key] = value;
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

  // Stop the continuous update loop
  stopUpdateLoop();
}

// This function is called when the extension is loaded
jQuery(async () => {
  try {
    console.log('[Variable Editor] Starting initialization');
    const context = SillyTavern.getContext();
    console.log('[Variable Editor] Got context');
    const { eventSource, event_types } = context;

    // Load settings
    loadSettings();
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
      // Reset previous vars when chat changes
      previousLocalVars = JSON.stringify({});
      previousGlobalVars = JSON.stringify({});
      if (extension_settings[extensionName].isShown) {
        renderPanel();
      }
    });

    // Note: Other events removed - continuous update loop handles value changes

    console.log('[Variable Editor] Initialization completed');
  } catch (error) {
    console.error('[Variable Editor] Error during initialization:', error);
  }
});
