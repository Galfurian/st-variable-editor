/**
 * @fileoverview UI rendering and DOM manipulation for the Variable Editor
 * extension Handles panel creation, user interactions, and dynamic updates of
 * variable displays
 */

// UI rendering and DOM manipulation for Variable Editor
import {startUpdateLoop, stopUpdateLoop, updatePreviousVars} from './state.js';
import {createAddRow, VARIABLE_TYPES, VariableItem} from './utils.js';

// Extension configuration
const EXTENSION_NAME = 'st-variable-editor';

// Debug prefix for console messages
const CONSOLE_PREFIX = '[Variable Editor] ';

// UI Constants
const UI_CONSTANTS = {
  PANEL_ID: 'variable-editor-panel',
  DRAG_HANDLE_ID: 'variable-editor-drag-handle',
  DEFAULT_SORT: 'alpha-asc',
  CSS_CLASSES: {
    PANEL: 'variable-editor-panel',
    HEADER: 'variable-editor-header',
    SECTION: 'variable-section',
    CONTENT: 'variable-content',
    ROW: 'variable-row',
    NAME_INPUT: 'var-name',
    VALUE_INPUT: 'var-value'
  }
};

// Store references to content elements for toggle handlers
let localContentRef, globalContentRef;

// Variable item lists for better management
let localItems = [];
let globalItems = [];

// Current sort preferences
let localSortPreference = UI_CONSTANTS.DEFAULT_SORT;
let globalSortPreference = UI_CONSTANTS.DEFAULT_SORT;

/**
 * Renders the main variable editor panel with local and global variable
 * sections
 */
export function renderPanel() {
  const {extensionSettings, characterId} = SillyTavern.getContext();
  if (!extensionSettings[EXTENSION_NAME].isShown) return;

  // Remove existing panel if it exists
  document.getElementById(UI_CONSTANTS.PANEL_ID)?.remove();

  // Create and setup the panel
  const panel = createPanel();
  setupResize(panel);
  panel.appendChild(createHeader());
  panel.appendChild(createDragHandle());
  panel.appendChild(createVariableSection('Local Variables', true, !characterId));
  panel.appendChild(createVariableSection('Global Variables', false, false));

  document.body.appendChild(panel);

  // Update previous variable states
  const {chatMetadata} = SillyTavern.getContext();
  updatePreviousVars(
      chatMetadata.variables || {}, extensionSettings.variables?.global || {});

  // Start the continuous update loop
  startUpdateLoop();
}

// Helper functions for panel creation

/**
 * Creates the main panel container.
 * @returns {HTMLElement} The panel element.
 */
function createPanel() {
  const panel = document.createElement('div');
  panel.id = UI_CONSTANTS.PANEL_ID;
  panel.classList.add(
      UI_CONSTANTS.CSS_CLASSES.PANEL, 'fillRight', 'openDrawer', 'pinnedOpen');
  return panel;
}

/**
 * Sets up the resize functionality for the panel
 * @param {HTMLElement} panel the panel element.
 */
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

  /** Handles mouse movement during panel resizing */
  const onMouseMove = (e) => {
    if (!isResizing) return;
    const dx = startX - e.clientX;
    const newWidth = startWidth + dx;
    if (newWidth > 300 && newWidth < window.innerWidth * 0.8) {
      panel.style.width = `${newWidth}px`;
    }
  };

  /** Handles mouse up event to stop resizing */
  const onMouseUp = () => {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
}

/**
 * Creates the header with title and close button
 * @returns {HTMLElement} The header element
 */
function createHeader() {
  const header = document.createElement('div');
  header.classList.add(UI_CONSTANTS.CSS_CLASSES.HEADER);
  header.style.marginBottom = '10px';

  const title = document.createElement('h3');
  title.textContent = 'Variable Editor';
  title.style.margin = '0';
  header.append(title);

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('fa-solid', 'fa-circle-xmark');
  // Handle close button click to hide the panel
  closeBtn.onclick = () => {
    const {extensionSettings} = SillyTavern.getContext();
    extensionSettings[EXTENSION_NAME].isShown = false;
    const panel = document.getElementById(UI_CONSTANTS.PANEL_ID);
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

/**
 * Creates the drag handle for moving the panel
 * @returns {HTMLElement} The drag handle element
 */
function createDragHandle() {
  const dragHandle = document.createElement('div');
  dragHandle.id = 'variable-editor-drag-handle';
  dragHandle.classList.add('drag-grabber', 'fa-solid', 'fa-grip');
  return dragHandle;
}

/**
 * Creates a variable section (local or global) with items and add row
 * @param {string} title - The section title
 * @param {boolean} isLocal - Whether this is the local variables section
 * @param {boolean} addRowDisabled - Whether the add row should be disabled
 * @returns {HTMLElement} The section element
 */
function createVariableSection(title, isLocal, addRowDisabled = false) {
  const {extensionSettings} = SillyTavern.getContext();

  const div = document.createElement('div');
  div.classList.add(UI_CONSTANTS.CSS_CLASSES.SECTION);

  const sectionHeader = document.createElement('div');
  sectionHeader.classList.add(UI_CONSTANTS.CSS_CLASSES.HEADER);
  sectionHeader.style.marginBottom = '5px';

  const sectionTitle = document.createElement('b');
  sectionTitle.textContent = title;
  sectionHeader.append(sectionTitle);

  // Add sorting dropdown
  const sortSelect = document.createElement('select');
  sortSelect.classList.add('text_pole');

  const sortOptions = [
    {value: 'alpha-asc', text: 'A-Z'}, {value: 'alpha-desc', text: 'Z-A'},
    {value: 'length-asc', text: 'Shortest'},
    {value: 'length-desc', text: 'Longest'}
  ];

  sortOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    sortSelect.append(optionElement);
  });

  // Set current sorting preference
  sortSelect.value = isLocal ? localSortPreference : globalSortPreference;

  // Add sorting functionality
  sortSelect.onchange = () => {
    const sortValue = sortSelect.value;
    if (isLocal) {
      localSortPreference = sortValue;
    } else {
      globalSortPreference = sortValue;
    }
    sortVariables(isLocal ? localItems : globalItems, sortValue, content);
  };

  sectionHeader.append(sortSelect);

  div.append(sectionHeader);

  const content = document.createElement('div');
  content.classList.add(UI_CONSTANTS.CSS_CLASSES.CONTENT);

  if (isLocal) {
    localContentRef = content;
    localItems = [];
    const {chatMetadata} = SillyTavern.getContext();
    const vars = chatMetadata.variables || {};
    for (const key in vars) {
      const item = new VariableItem(key, vars[key], VARIABLE_TYPES.LOCAL);
      localItems.push(item);
    }
    content.append(createAddRow(VARIABLE_TYPES.LOCAL, addRowDisabled));
    // Sort items initially
    sortVariables(localItems, localSortPreference, content);
  } else {
    globalContentRef = content;
    globalItems = [];
    const vars = extensionSettings.variables?.global || {};
    for (const key in vars) {
      const item = new VariableItem(key, vars[key], VARIABLE_TYPES.GLOBAL);
      globalItems.push(item);
    }
    content.append(createAddRow(VARIABLE_TYPES.GLOBAL, false));
    // Sort items initially
    sortVariables(globalItems, globalSortPreference, content);
  }

  div.append(content);
  return div;
}

/** Removes the variable editor panel from the DOM and stops the update loop */
export function unrenderPanel() {
  const panel = document.getElementById(UI_CONSTANTS.PANEL_ID);
  if (panel) panel.remove();

  // Clear item references to prevent memory leaks
  localItems = [];
  globalItems = [];
  localContentRef = null;
  globalContentRef = null;

  // Stop the continuous update loop
  stopUpdateLoop();
}

/**
 * Updates the UI to reflect changes in variable values without full
 * re-rendering
 * @param {Object} localVars - Current local variables object
 * @param {Object} globalVars - Current global variables object
 */
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
        setTimeout(
            () => item.valueInput.classList.remove('value-updated'), 600);
      }
    }
    return true;
  });

  // Add new local variables
  for (const key in localVars) {
    if (!localItems.find(item => item.key === key)) {
      const item = new VariableItem(key, localVars[key], VARIABLE_TYPES.LOCAL);
      localItems.push(item);
      localContentRef.insertBefore(item.render(), localContentRef.lastChild);
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
        setTimeout(
            () => item.valueInput.classList.remove('value-updated'), 600);
      }
    }
    return true;
  });

  // Add new global variables
  for (const key in globalVars) {
    if (!globalItems.find(item => item.key === key)) {
      const item =
          new VariableItem(key, globalVars[key], VARIABLE_TYPES.GLOBAL);
      globalItems.push(item);
      globalContentRef.insertBefore(item.render(), globalContentRef.lastChild);
    }
  }

  // Re-sort items to maintain current sort order
  if (localContentRef) {
    sortVariables(localItems, localSortPreference, localContentRef);
  }
  if (globalContentRef) {
    sortVariables(globalItems, globalSortPreference, globalContentRef);
  }
}

/**
 * Sorts variable items based on the selected criteria
 * @param {Array} items - Array of VariableItem instances
 * @param {string} sortType - Sort type ('alpha-asc', 'alpha-desc',
 *     'length-asc', 'length-desc')
 * @param {HTMLElement} content - The content container element
 * @param {boolean} isLocal - Whether this is for local variables
 */
function sortVariables(items, sortType, content) {
  // Sort the items array
  items.sort((a, b) => {
    switch (sortType) {
      case 'alpha-asc':
        return a.key.localeCompare(b.key);
      case 'alpha-desc':
        return b.key.localeCompare(a.key);
      case 'length-asc':
        return a.key.length - b.key.length || a.key.localeCompare(b.key);
      case 'length-desc':
        return b.key.length - a.key.length || a.key.localeCompare(b.key);
      default:
        return 0;
    }
  });

  // Reorder DOM elements (excluding the add row which is last)
  const addRow = content.lastChild;
  content.innerHTML = '';

  items.forEach(item => {
    content.appendChild(item.render());
  });

  content.appendChild(addRow);
}