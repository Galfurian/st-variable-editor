// UI rendering and DOM manipulation for Variable Editor
import { isLocalCollapsed, isGlobalCollapsed, toggleLocalCollapsed, toggleGlobalCollapsed } from './state.js';
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
  console.log('[Variable Editor] renderPanel called');
  const { chatMetadata, extensionSettings } = SillyTavern.getContext();
  console.log('[Variable Editor] Got chatMetadata');

  // Remove existing panel if it exists
  $('#variable-editor-panel').remove();

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
  if (!isLocalCollapsed) {
    localIcon.classList.add('down');
  }
  localHeader.append(localIcon);

  const addLocalBtn = document.createElement('button');
  addLocalBtn.textContent = '+';
  addLocalBtn.title = 'Add Local Variable';
  addLocalBtn.onclick = () => addVariable('local');
  localHeader.append(addLocalBtn);

  localHeader.onclick = (e) => {
    if (e.target === addLocalBtn) return; // Don't toggle if clicking add button
    const content = localContentRef;
    const icon = localHeader.querySelector('.inline-drawer-icon');
    toggleLocalCollapsed();
    if (isLocalCollapsed) {
      content.style.display = 'none';
      icon.classList.remove('down');
    } else {
      content.style.display = 'block';
      icon.classList.add('down');
    }
  };

  localDiv.append(localHeader);

  const localContent = document.createElement('div');
  localContent.classList.add('inline-drawer-content');
  localContent.style.display = isLocalCollapsed ? 'none' : 'block';
  localContentRef = localContent; // Store reference

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
  if (!isGlobalCollapsed) {
    globalIcon.classList.add('down');
  }
  globalHeader.append(globalIcon);

  const addGlobalBtn = document.createElement('button');
  addGlobalBtn.textContent = '+';
  addGlobalBtn.title = 'Add Global Variable';
  addGlobalBtn.onclick = () => addVariable('global');
  globalHeader.append(addGlobalBtn);

  globalHeader.onclick = (e) => {
    if (e.target === addGlobalBtn) return; // Don't toggle if clicking add button
    const content = globalContentRef;
    const icon = globalHeader.querySelector('.inline-drawer-icon');
    toggleGlobalCollapsed();
    if (isGlobalCollapsed) {
      content.style.display = 'none';
      icon.classList.remove('down');
    } else {
      content.style.display = 'block';
      icon.classList.add('down');
    }
  };

  globalDiv.append(globalHeader);

  const globalContent = document.createElement('div');
  globalContent.classList.add('inline-drawer-content');
  globalContent.style.display = isGlobalCollapsed ? 'none' : 'block';
  globalContentRef = globalContent; // Store reference

  const globalVars = extensionSettings[extensionName]?.variables?.global || {};
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
  updatePreviousVars(chatMetadata.variables || {}, extension_settings.variables?.global || {});
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