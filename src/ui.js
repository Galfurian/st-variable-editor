// UI rendering and DOM manipulation for Variable Editor
import { chat_metadata } from "../../../../../script.js";
import { createVariableRow, addVariable, deleteVariable, updateVariableName, updateVariableValue, VariableItem } from './utils.js';
import { startUpdateLoop, stopUpdateLoop, updatePreviousVars } from './state.js';

// Extension configuration
const extensionName = "st-variable-editor";

// Store references to content elements for toggle handlers
let localContentRef, globalContentRef;

// Variable item lists for better management
let localItems = [];
let globalItems = [];

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
  // Note: 'fillRight' usually implies full height/fixed width in some ST themes. 
  // If resizing acts weird, try removing 'fillRight' and relying on your own CSS.
  panel.classList.add('fillRight'); 
  panel.classList.add('openDrawer');
  panel.classList.add('pinnedOpen');

  // ---------------------------------------------------------
  // START: RESIZE LOGIC
  // ---------------------------------------------------------
  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle'); // Must match CSS below
  panel.appendChild(resizeHandle);

  let isResizing = false;
  let startX, startWidth;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = panel.getBoundingClientRect().width;
    
    // Global cursor/select style to prevent text highlighting while dragging
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    // Attach listeners to document so you don't lose focus if mouse moves fast
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  const onMouseMove = (e) => {
    if (!isResizing) return;
    // Calculate distance moved. 
    // Moving LEFT (negative X) should INCREASE width for a right-side panel.
    const dx = startX - e.clientX;
    const newWidth = startWidth + dx;

    // Set min/max limits
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
  // ---------------------------------------------------------
  // END: RESIZE LOGIC
  // ---------------------------------------------------------

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
  // Using a class for these styles is cleaner, but keeping your inline styles for now:
  closeBtn.style.border = 'none';
  closeBtn.style.background = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.color = 'var(--SmartThemeBodyColor)';
  closeBtn.style.padding = '5px';
  header.append(closeBtn);

  panel.append(header);

  // Existing Drag Handle (Likely for moving the panel, keeping it as requested)
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

  // Clear and recreate local items
  localItems = [];
  const localVars = chat_metadata.variables || {};
  for (const key in localVars) {
    const item = new VariableItem(key, localVars[key], 'local');
    localItems.push(item);
    localContent.append(item.render());
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

  // Clear and recreate global items
  globalItems = [];
  const globalVars = extensionSettings.variables?.global || {};
  for (const key in globalVars) {
    const item = new VariableItem(key, globalVars[key], 'global');
    globalItems.push(item);
    globalContent.append(item.render());
  }

  globalDiv.append(globalContent);
  panel.append(globalDiv);

  document.body.append(panel);
  console.log('[Variable Editor] Panel appended to body');

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