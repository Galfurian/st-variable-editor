// UI rendering and DOM manipulation for Variable Editor
import { chat_metadata } from "../../../../../script.js";
import { VariableItem, createAddRow } from './utils.js';
import { startUpdateLoop, stopUpdateLoop, updatePreviousVars } from './state.js';

// Extension configuration
const extensionName = "st-variable-editor";

// Debug prefix for console messages
const CONSOLE_PREFIX = '[Variable Editor] ';

// Store references to content elements for toggle handlers
let localContentRef, globalContentRef;

// Variable item lists for better management
let localItems = [];
let globalItems = [];

// Render the variable editor panel
export function renderPanel() {
  const { extensionSettings } = SillyTavern.getContext();
  if (!extensionSettings[extensionName].isShown) return;

  // Remove existing panel if it exists
  document.getElementById('variable-editor-panel')?.remove();

  // Create and setup the panel
  const panel = createPanel();
  setupResize(panel);
  panel.appendChild(createHeader());
  panel.appendChild(createDragHandle());
  panel.appendChild(createVariableSection('Local Variables', true));
  panel.appendChild(createVariableSection('Global Variables', false));

  document.body.appendChild(panel);

  // Update previous variable states
  updatePreviousVars(chat_metadata.variables || {}, extensionSettings.variables?.global || {});

  // Start the continuous update loop
  startUpdateLoop();
}

// Helper functions for panel creation

/** Creates the main panel container */
function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'variable-editor-panel';
  panel.classList.add('variable-editor-panel', 'fillRight', 'openDrawer', 'pinnedOpen');
  return panel;
}

/** Sets up the resize functionality for the panel */
function setupResize(panel) {
  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');
  panel.appendChild(resizeHandle);

  let isResizing = false;
  let startX, startWidth;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = panel.getBoundingClientRect().width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  const onMouseMove = (e) => {
    if (!isResizing) return;
    const dx = startX - e.clientX;
    const newWidth = startWidth + dx;
    if (newWidth > 300 && newWidth < window.innerWidth * 0.8) {
      panel.style.width = `${newWidth}px`;
    }
  };

  const onMouseUp = () => {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
}

/** Creates the header with title and close button */
function createHeader() {
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
  closeBtn.classList.add('fa-solid', 'fa-circle-xmark');
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

  return header;
}

/** Creates the drag handle for moving the panel */
function createDragHandle() {
  const dragHandle = document.createElement('div');
  dragHandle.id = 'variable-editor-drag-handle';
  dragHandle.classList.add('drag-grabber', 'fa-solid', 'fa-grip');
  return dragHandle;
}

/** Creates a variable section (local or global) with items and add row */
function createVariableSection(title, isLocal) {
  const { extensionSettings } = SillyTavern.getContext();

  const div = document.createElement('div');
  div.classList.add('variable-section');

  const sectionHeader = document.createElement('div');
  sectionHeader.classList.add('variable-editor-header');

  const sectionTitle = document.createElement('b');
  sectionTitle.textContent = title;
  sectionHeader.append(sectionTitle);

  div.append(sectionHeader);

  const content = document.createElement('div');
  content.classList.add('variable-content');

  if (isLocal) {
    localContentRef = content;
    localItems = [];
    const vars = chat_metadata.variables || {};
    for (const key in vars) {
      const item = new VariableItem(key, vars[key], 'local');
      localItems.push(item);
      content.append(item.render());
    }
    content.append(createAddRow('local'));
  } else {
    globalContentRef = content;
    globalItems = [];
    const vars = extensionSettings.variables?.global || {};
    for (const key in vars) {
      const item = new VariableItem(key, vars[key], 'global');
      globalItems.push(item);
      content.append(item.render());
    }
    content.append(createAddRow('global'));
  }

  div.append(content);
  return div;
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
  localItems = localItems.filter(item => {
    if (localVars[item.key] === undefined) {
      item.remove();
      return false;
    }
    if (localVars[item.key] !== item.value) {
      item.update(localVars[item.key]);
      // Add blink effect
      if (item.valueInput) {
        item.valueInput.classList.add('value-updated');
        setTimeout(() => item.valueInput.classList.remove('value-updated'), 600);
      }
    }
    return true;
  });

  // Add new local variables
  for (const key in localVars) {
    if (!localItems.find(item => item.key === key)) {
      const item = new VariableItem(key, localVars[key], 'local');
      localItems.push(item);
      localContentRef.append(item.render());
    }
  }

  // Update global variables
  globalItems = globalItems.filter(item => {
    if (globalVars[item.key] === undefined) {
      item.remove();
      return false;
    }
    if (globalVars[item.key] !== item.value) {
      item.update(globalVars[item.key]);
      // Add blink effect
      if (item.valueInput) {
        item.valueInput.classList.add('value-updated');
        setTimeout(() => item.valueInput.classList.remove('value-updated'), 600);
      }
    }
    return true;
  });

  // Add new global variables
  for (const key in globalVars) {
    if (!globalItems.find(item => item.key === key)) {
      const item = new VariableItem(key, globalVars[key], 'global');
      globalItems.push(item);
      globalContentRef.append(item.render());
    }
  }
}