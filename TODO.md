# Variable Editor Extension - TODO List

## Code Quality & Structure

- [X] Reduce code duplication: The local/global variable handling in utils.js has repetitive patterns. Consider creating a unified interface or factory functions.
- [X] Magic strings: Hard-coded strings like 'local', 'global', and CSS class names should be extracted to constants.
- [X] Import paths: Deep relative imports like "../../../../../script.js" are fragile. Consider using a more robust import strategy or bundler.
- [X] JSDoc consistency: Only utils.js has comprehensive JSDoc. Add documentation to other modules for better maintainability.

## Performance Optimizations

- [ ] Polling overhead: The 100ms update loop in state.js runs continuously while the panel is open, consuming resources even when no changes occur.
- [ ] Unnecessary re-renders: Manual operations (add/delete/update) trigger renderPanel(), but the update loop may immediately detect changes and update again, causing double work.
- [ ] DOM queries: Frequent document.querySelector calls in storeInputReferences could be optimized with cached references.
- [ ] Implement event-driven updates where possible (e.g., listen for SillyTavern's variable change events)
- [ ] Add throttling to the update loop or increase interval to 500ms for less critical updates
- [ ] Cache DOM element references instead of querying repeatedly
- [ ] Use requestAnimationFrame for UI updates to sync with browser repaint cycles

## User Experience Enhancements

- [X] Input validation: Add client-side validation for variable names (e.g., no special characters, length limits)
- [X] Keyboard navigation: Support Tab navigation and Enter to confirm additions
- [ ] Bulk operations: Allow selecting multiple variables for batch delete/edit
- [ ] Search/filter: Add search functionality for large variable lists
- [ ] Undo functionality: Implement undo for accidental deletions

## Robustness & Error Handling

- [ ] Race conditions: Multiple rapid changes could cause inconsistent state
- [X] Memory leaks: Event listeners and timers aren't explicitly cleaned up in all scenarios
- [ ] Edge cases: No handling for very large numbers of variables or extremely long values
- [ ] Add input sanitization using DOMPurify for variable values
- [ ] Implement proper cleanup in unrenderPanel() to remove event listeners
- [ ] Add limits on variable count and value length with user warnings
- [ ] Better handling of concurrent operations with optimistic updates

## Testing & Quality Assurance

- [ ] No unit tests or integration tests
- [ ] No linting configuration (ESLint, Prettier)
- [ ] No type checking (TypeScript would be beneficial for a complex extension)
- [ ] Add Jest or similar for unit testing core logic
- [ ] Implement E2E tests for critical user flows
- [ ] Set up ESLint with appropriate rules for browser JavaScript
- [ ] Consider migrating to TypeScript for better type safety

## Documentation & Maintenance

- [ ] Add API documentation for public functions
- [ ] Include development setup instructions (if any build steps are added)
- [ ] Add code comments explaining complex logic (e.g., the update loop algorithm)
- [ ] Create contribution guidelines beyond the basic Git workflow

## Security Considerations

- [ ] Validate variable names against a whitelist pattern
- [ ] Sanitize all user inputs before storage
- [ ] Consider Content Security Policy compliance if adding dynamic content

## Manifest & Extension Standards

- [X] Add auto_update: true to manifest.json for automatic updates
- [ ] Include minimum_client_version if there are specific SillyTavern version requirements
- [ ] Add i18n support for internationalization if targeting multiple languages

## Code Style & Consistency

- [X] Inconsistent naming: extensionName vs EXTENSION_NAME
- [X] Mixed quote styles (single vs double)
- [ ] Some functions are overly long and could be broken down
- [ ] Adopt a consistent code style guide (e.g., Airbnb or Google JS style)
- [ ] Use Prettier for automatic formatting
- [ ] Implement pre-commit hooks for code quality checks

## Priority Implementation Order

- [X] High Priority: Fix performance issues (reduce polling frequency, eliminate double updates) - Partially done, basic fixes applied
- [ ] Medium Priority: Add input validation and error boundaries
- [ ] Medium Priority: Implement testing framework and basic test coverage
- [ ] Low Priority: Add TypeScript migration and advanced UX features
