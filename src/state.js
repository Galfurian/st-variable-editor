// State management and update logic for Variable Editor

// Extension configuration
const extensionName = "st-variable-editor";

// Store previous variable states to detect changes
let previousLocalVars = JSON.stringify({});
let previousGlobalVars = JSON.stringify({});

// Track collapsed/expanded state of sections
export let isLocalCollapsed = false;
export let isGlobalCollapsed = false;

// Flag to control the update loop
let isUpdating = false;

// Toggle functions for collapsed state
export function toggleLocalCollapsed() {
  isLocalCollapsed = !isLocalCollapsed;
}

export function toggleGlobalCollapsed() {
  isGlobalCollapsed = !isGlobalCollapsed;
}

// Continuous update loop like the original Variable Viewer
export async function startUpdateLoop() {
  const { extensionSettings } = SillyTavern.getContext();
  if (isUpdating) return;
  isUpdating = true;

  while (extensionSettings[extensionName].isShown) {
    try {
      const { chatMetadata } = SillyTavern.getContext();
      const currentLocalVars = chatMetadata.variables || {};
      const currentGlobalVars = extensionSettings[extensionName].variables?.global || {};

      const localVarsStr = JSON.stringify(currentLocalVars);
      const globalVarsStr = JSON.stringify(currentGlobalVars);

      // Check if variables have changed
      if (localVarsStr !== previousLocalVars || globalVarsStr !== previousGlobalVars) {
        previousLocalVars = localVarsStr;
        previousGlobalVars = globalVarsStr;

        // Update existing inputs without re-rendering
        const { updateExistingInputs } = await import('./ui.js');
        updateExistingInputs(currentLocalVars, currentGlobalVars);

        // Check if structure changed (added/removed variables)
        if (hasStructureChanged(currentLocalVars, currentGlobalVars)) {
          const { renderPanel } = await import('./ui.js');
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
export function stopUpdateLoop() {
  isUpdating = false;
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

// Store references to input elements for efficient updates
export function storeInputReferences(localVars, globalVars) {
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

// Update previous variable states
export function updatePreviousVars(localVars, globalVars) {
  previousLocalVars = JSON.stringify(localVars);
  previousGlobalVars = JSON.stringify(globalVars);
}

// Keep references to current input elements for efficient updates
let localVarInputs = new Map();
let globalVarInputs = new Map();