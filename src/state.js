/**
 * @fileoverview State management and update logic for the Variable Editor extension
 * Handles real-time synchronization and change detection for variable displays
 */

// State management and update logic for Variable Editor
import { VARIABLE_TYPES } from './utils.js';

// Extension configuration
const EXTENSION_NAME = 'st-variable-editor';

// Debug prefix for console messages
const CONSOLE_PREFIX = '[Variable Editor] ';

// Store previous variable states to detect changes
let previousLocalVars = JSON.stringify({});
let previousGlobalVars = JSON.stringify({});

// Flag to control the update loop
let isUpdating = false;

/**
 * Starts a continuous polling loop to detect and update variable changes
 * 
 * Algorithm Overview:
 * 1. Polls every 500ms while panel is visible (balance between responsiveness and performance)
 * 2. Compares current variables against previous state using JSON stringification
 * 3. If changes detected:
 *    - Structure changes (keys added/removed): Full panel re-render required
 *    - Value changes only: Update existing inputs without re-rendering
 * 4. Uses DOM reference caching to avoid repeated querySelector calls
 * 
 * This approach ensures real-time synchronization while minimizing DOM operations
 */
export async function startUpdateLoop() {
  const { extensionSettings } = SillyTavern.getContext();
  if (isUpdating) return;
  isUpdating = true;

  while (extensionSettings[EXTENSION_NAME].isShown) {
    try {
      const { chatMetadata } = SillyTavern.getContext();
      const currentLocalVars = chatMetadata.variables || {};
      const currentGlobalVars = extensionSettings.variables?.global || {};

      // Serialize current state for comparison (deep equality check)
      const localVarsStr = JSON.stringify(currentLocalVars);
      const globalVarsStr = JSON.stringify(currentGlobalVars);

      // Detect any changes in variables (keys or values)
      if (localVarsStr !== previousLocalVars || globalVarsStr !== previousGlobalVars) {
        // Update cached previous state
        previousLocalVars = localVarsStr;
        previousGlobalVars = globalVarsStr;

        // Determine change type: structure (keys) vs values
        if (hasStructureChanged(currentLocalVars, currentGlobalVars)) {
          // Structure changed - need full re-render to add/remove input fields
          const { renderPanel } = await import('./ui.js');
          renderPanel();
        } else {
          // Only values changed - update existing inputs efficiently
          const { updateExistingInputs } = await import('./ui.js');
          updateExistingInputs(currentLocalVars, currentGlobalVars);
        }
      }

      // Wait 500ms before next check (reduced frequency for better performance)
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(CONSOLE_PREFIX, 'Error in update loop:', error);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait longer on error
    }
  }

  isUpdating = false;
}

/**
 * Stops the continuous update loop
 */
export function stopUpdateLoop() {
  isUpdating = false;
  
  // Clear DOM references to prevent memory leaks
  localVarInputs.clear();
  globalVarInputs.clear();
}

/**
 * Determines if the variable structure has changed (keys added/removed)
 * 
 * Algorithm:
 * 1. Extract keys from current and previous variable objects
 * 2. Compare set sizes (different count = structure change)
 * 3. Check for added keys (in current but not previous)
 * 4. Check for removed keys (in previous but not current)
 * 
 * This optimization avoids full re-renders when only values change
 * 
 * @param {Object} currentLocalVars - Current local variables
 * @param {Object} currentGlobalVars - Current global variables
 * @returns {boolean} True if structure changed, requiring full re-render
 */
function hasStructureChanged(currentLocalVars, currentGlobalVars) {
  // Extract key sets for comparison
  const currentLocalKeys = new Set(Object.keys(currentLocalVars));
  const currentGlobalKeys = new Set(Object.keys(currentGlobalVars));

  const previousLocalKeys = new Set(Object.keys(JSON.parse(previousLocalVars)));
  const previousGlobalKeys = new Set(Object.keys(JSON.parse(previousGlobalVars)));

  // Check for key additions/removals in local variables
  const localKeysChanged = currentLocalKeys.size !== previousLocalKeys.size ||
    [...currentLocalKeys].some(key => !previousLocalKeys.has(key)) ||
    [...previousLocalKeys].some(key => !currentLocalKeys.has(key));

  // Check for key additions/removals in global variables
  const globalKeysChanged = currentGlobalKeys.size !== previousGlobalKeys.size ||
    [...currentGlobalKeys].some(key => !previousGlobalKeys.has(key)) ||
    [...previousGlobalKeys].some(key => !currentGlobalKeys.has(key));

  return localKeysChanged || globalKeysChanged;
}

/**
 * Caches DOM references to variable input elements for performance optimization
 * 
 * Performance Optimization:
 * - Avoids repeated document.querySelector() calls during updates
 * - Maps variable keys directly to DOM elements for O(1) access
 * - Reduces DOM query overhead in the update loop
 * - References are cleared and rebuilt when panel re-renders
 * 
 * @param {Object} localVars - Local variables object
 * @param {Object} globalVars - Global variables object
 */
export function storeInputReferences(localVars, globalVars) {
  // Clear stale references from previous render
  localVarInputs.clear();
  globalVarInputs.clear();

  // Cache local variable input element references
  for (const key in localVars) {
    const input = document.querySelector(`input[data-var-key="${key}"][data-var-type="local"]`);
    if (input) {
      localVarInputs.set(key, input);
    }
  }

  // Cache global variable input element references
  for (const key in globalVars) {
    const input = document.querySelector(`input[data-var-key="${key}"][data-var-type="global"]`);
    if (input) {
      globalVarInputs.set(key, input);
    }
  }
}

/**
 * Updates the cached previous state of variables for change detection
 * @param {Object} localVars - Local variables object
 * @param {Object} globalVars - Global variables object
 */
export function updatePreviousVars(localVars, globalVars) {
  previousLocalVars = JSON.stringify(localVars);
  previousGlobalVars = JSON.stringify(globalVars);
}

// Keep references to current input elements for efficient updates
let localVarInputs = new Map();
let globalVarInputs = new Map();