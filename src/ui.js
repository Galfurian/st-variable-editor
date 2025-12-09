// UI rendering and DOM manipulation for Variable Editor
import { chat_metadata } from "../../../../../script.js";
import { createVariableRow, addVariable, deleteVariable, updateVariableName, updateVariableValue } from './utils.js';
import { startUpdateLoop, stopUpdateLoop, storeInputReferences, updatePreviousVars } from './state.js';

// Extension configuration
const extensionName = "st-variable-editor";

// Store references to content elements for toggle handlers
let localContentRef, globalContentRef;

// Keep references to current input elements for efficient updates
let localVarInputs = new Map();
let globalVarInputs = new Map();

// Render the variable editor panel
export function renderPanel() {
  const { extensionSettings } = SillyTavern.getContext();
  if (!extensionSettings[extensionName].isShown) return;

  console.log('[Variable Editor] renderPanel called');

  // Remove existing panel if it exists
  document.getElementById('variable-editor-panel')?.remove();

  // Create the panel
  const panel = document.createElement('div');
  panel.id = 'variable-editor-panel';
  panel.classList.add('variable-editor-panel');
  panel.classList.add('fillRight');
  panel.classList.add('openDrawer');
  panel.classList.add('pinnedOpen');

  // Create header with title and close button
  const header = document.createElement('div');
  header.classList.add('variable-editor-header');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '10px';

  const title = document.createElement('h3');
  title.textContent = 'Variable Editor';
  title.style.margin = '0';
  header.append(title);

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('fa-solid');
  closeBtn.classList.add('fa-circle-xmark');
  closeBtn.onclick = () => {
    const { extensionSettings } = SillyTavern.getContext();
    extensionSettings[extensionName].isShown = false;
    const panel = document.getElementById('variable-editor-panel');
    if (panel) panel.style.display = 'none';
  };
  closeBtn.style.border = 'none';
  closeBtn.style.background = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.color = 'var(--SmartThemeBodyColor)';
  closeBtn.style.padding = '5px';
  header.append(closeBtn);

  panel.append(header);

  const dragHandle = document.createElement('div');
  dragHandle.id = 'variable-editor-drag-handle';
  dragHandle.classList.add('drag-grabber');
  dragHandle.classList.add('fa-solid');
  dragHandle.classList.add('fa-grip');
  panel.append(dragHandle);

  // Local Variables Section
  const localDiv = document.createElement('div');
  localDiv.classList.add('variable-section');

  const localHeader = document.createElement('div');
  localHeader.classList.add('variable-editor-header');

  const localTitle = document.createElement('b');
  localTitle.textContent = 'Local Variables';
  localHeader.append(localTitle);

  const addLocalBtn = document.createElement('button');
  addLocalBtn.textContent = '+';
  addLocalBtn.title = 'Add Local Variable';
  addLocalBtn.onclick = () => addVariable('local');
  localHeader.append(addLocalBtn);

  localDiv.append(localHeader);

  const localContent = document.createElement('div');
  localContent.classList.add('variable-content');
  localContentRef = localContent; // Store reference

  const localVars = chat_metadata.variables || {};
  for (const key in localVars) {
    const row = createVariableRow(key, localVars[key], 'local');
    localContent.append(row);
  }

  localDiv.append(localContent);
  panel.append(localDiv);

  // Global Variables Section
  const globalDiv = document.createElement('div');
  globalDiv.classList.add('variable-section');

  const globalHeader = document.createElement('div');
  globalHeader.classList.add('variable-editor-header');

  const globalTitle = document.createElement('b');
  globalTitle.textContent = 'Global Variables';
  globalHeader.append(globalTitle);

  const addGlobalBtn = document.createElement('button');
  addGlobalBtn.textContent = '+';
  addGlobalBtn.title = 'Add Global Variable';
  addGlobalBtn.onclick = () => addVariable('global');
  globalHeader.append(addGlobalBtn);

  globalDiv.append(globalHeader);

  const globalContent = document.createElement('div');
  globalContent.classList.add('variable-content');
  globalContentRef = globalContent; // Store reference

  const globalVars = extensionSettings.variables?.global || {};
  for (const key in globalVars) {
    const row = createVariableRow(key, globalVars[key], 'global');
    globalContent.append(row);
  }

  globalDiv.append(globalContent);
  panel.append(globalDiv);

  document.body.append(panel);
  console.log('[Variable Editor] Panel appended to body');

  // Store input references for efficient updates
  storeInputReferences(localVars, globalVars);

  // Update previous variable states
  updatePreviousVars(chat_metadata.variables || {}, extensionSettings.variables?.global || {});
  console.log('[Variable Editor] renderPanel completed');

  // Start the continuous update loop
  startUpdateLoop();
}

// Remove the panel from DOM
export function unrenderPanel() {
  const panel = document.getElementById('variable-editor-panel');
  if (panel) panel.remove();

  // Stop the continuous update loop
  stopUpdateLoop();
}

// Update existing input elements with new variable values
export function updateExistingInputs(localVars, globalVars) {
  // Update local variables
  for (const [key, input] of localVarInputs) {
    if (localVars[key] !== undefined) {
      input.value = localVars[key];
    } else {
      // Variable removed, remove the input
      input.closest('.variable-row').remove();
      localVarInputs.delete(key);
    }
  }

  // Add new local variables
  for (const key in localVars) {
    if (!localVarInputs.has(key)) {
      const row = createVariableRow(key, localVars[key], 'local');
      localContentRef.append(row);
      // Update the map
      const input = row.querySelector('.var-value');
      if (input) localVarInputs.set(key, input);
    }
  }

  // Update global variables
  for (const [key, input] of globalVarInputs) {
    if (globalVars[key] !== undefined) {
      input.value = globalVars[key];
    } else {
      // Variable removed, remove the input
      input.closest('.variable-row').remove();
      globalVarInputs.delete(key);
    }
  }

  // Add new global variables
  for (const key in globalVars) {
    if (!globalVarInputs.has(key)) {
      const row = createVariableRow(key, globalVars[key], 'global');
      globalContentRef.append(row);
      // Update the map
      const input = row.querySelector('.var-value');
      if (input) globalVarInputs.set(key, input);
    }
  }
}