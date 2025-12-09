# SillyTavern Extension Development Guide

This repository contains a SillyTavern UI extension. Follow these guidelines when contributing to or modifying this extension.

## Project Structure

- `manifest.json` - Extension metadata and configuration
- `index.js` - Main extension script (entry point)
- `style.css` - Extension-specific styles
- `example.html` - UI components and settings panels
- `README.md` - User-facing documentation

## Core Principles

### Extension Architecture

1. **Global Context Access**: Always use `SillyTavern.getContext()` to access app state, functions, and utilities
2. **Event-Driven Design**: Use `eventSource.on()` to listen for SillyTavern events rather than polling
3. **Relative Paths**: All imports and file references should be relative to `/scripts/extensions/third-party/[extension-name]`
4. **No Server Dependencies**: UI extensions must not require server plugins to function

### Manifest Configuration

The `manifest.json` file must contain:
- `display_name` (required): User-facing extension name
- `js` (required): Entry point JavaScript file
- `author` (required): Author name or contact info
- `loading_order` (optional): Higher numbers load later; affects event handler execution order
- `css` (optional): Stylesheet reference
- `version`, `homePage`, `auto_update` (recommended)
- `dependencies` (optional): Array of required extension folder names
- `minimum_client_version` (optional): Minimum SillyTavern version required
- `generate_interceptor` (optional): Global function name for prompt interception
- `i18n` (optional): Object mapping locale codes to translation files

### State Management

#### Extension Settings
```javascript
const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();
const MODULE_NAME = 'extension-name';

// Initialize settings with defaults
if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
}

// Modify settings
extensionSettings[MODULE_NAME].someKey = newValue;

// Persist to server
saveSettingsDebounced();
```

#### Chat Metadata (per-chat data)
```javascript
const { chatMetadata, saveMetadata } = SillyTavern.getContext();

// Always get fresh reference - changes when chat switches
chatMetadata['my_key'] = 'value';
await saveMetadata();
```

#### Character Card Data
```javascript
const { writeExtensionField, characterId } = SillyTavern.getContext();

// Write to character card (undefined in group chats!)
if (characterId !== undefined) {
    await writeExtensionField(characterId, 'my_extension_key', dataObject);
}

// Read from character card
const character = SillyTavern.getContext().characters[characterId];
const myData = character.data?.extensions?.my_extension_key;
```

### Event Handling

#### Common Event Types
- `APP_READY` - App loaded (auto-fires for new listeners after ready)
- `MESSAGE_RECEIVED` - LLM response generated (not yet rendered)
- `MESSAGE_SENT` - User message sent (not yet rendered)
- `USER_MESSAGE_RENDERED` - User message displayed
- `CHARACTER_MESSAGE_RENDERED` - LLM message displayed
- `CHAT_CHANGED` - Chat switched (different character/group)
- `GENERATION_AFTER_COMMANDS` - About to start generation after slash commands
- `GENERATION_STOPPED` - Generation cancelled by user
- `GENERATION_ENDED` - Generation completed or errored
- `SETTINGS_UPDATED` - App settings changed
- `PRESET_CHANGED` - API preset changed
- `MAIN_API_CHANGED` - API type switched

#### Event Usage
```javascript
const { eventSource, event_types } = SillyTavern.getContext();

eventSource.on(event_types.MESSAGE_RECEIVED, (data) => {
    // Handle event - check source for data structure
});

// Emit custom events
await eventSource.emit('myCustomEvent', { data: 'value' });
```

### Importing and Dependencies

#### Preferred: Use getContext()
```javascript
// Access stable API through context
const context = SillyTavern.getContext();
const { chat, characters, characterId, groups } = context;
```

#### Shared Libraries
Available via `SillyTavern.libs`:
- `lodash` - Utility functions
- `localforage` - Browser storage
- `Fuse` - Fuzzy search
- `DOMPurify` - HTML sanitization
- `Handlebars` - Templating
- `moment` - Date/time manipulation
- `showdown` - Markdown conversion

```javascript
const { DOMPurify } = SillyTavern.libs;
const clean = DOMPurify.sanitize(unsafeHtml);
```

#### Direct Imports (less stable)
```javascript
// Relative to public/scripts/extensions/third-party/[extension-name]
import { generateQuietPrompt } from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";
```

### Text Generation

#### In-Chat Generation
```javascript
const { generateQuietPrompt } = SillyTavern.getContext();

const result = await generateQuietPrompt({
    quietPrompt: 'Your instruction here',
    jsonSchema: optionalSchemaObject, // For structured outputs
});
```

#### Raw Generation
```javascript
const { generateRaw } = SillyTavern.getContext();

const result = await generateRaw({
    systemPrompt: 'System instruction',
    prompt: 'User prompt or chat completion array',
    prefill: 'Optional assistant prefix',
    jsonSchema: optionalSchemaObject,
});
```

#### Structured Outputs (JSON Schema)
Only works with compatible Chat Completion models:
```javascript
const jsonSchema = {
    name: 'MySchema',
    description: 'Schema description',
    strict: true,
    value: {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'type': 'object',
        'properties': {
            'field': { 'type': 'string' }
        },
        'required': ['field']
    }
};

const result = await generateRaw({ prompt, jsonSchema });
// Returns stringified JSON or '{}' on failure
```

### Slash Commands (STscript)

Register commands via `SlashCommandParser.addCommandObject()`:
```javascript
SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'mycommand',
    callback: (namedArgs, unnamedArgs) => {
        // Return string result
        return 'output';
    },
    returns: 'description of return value',
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: 'argname',
            description: 'what it does',
            typeList: ARGUMENT_TYPE.STRING,
            defaultValue: 'default',
        })
    ],
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: 'main argument',
            typeList: ARGUMENT_TYPE.STRING,
            isRequired: true,
        })
    ],
    helpString: '<div>Usage examples in HTML</div>',
}));
```

### Prompt Interceptors

Modify chat data before generation:

1. Add to `manifest.json`:
```json
{
    "generate_interceptor": "myInterceptorFunction",
    "loading_order": 10
}
```

2. Define global function:
```javascript
globalThis.myInterceptorFunction = async function(chat, contextSize, abort, type) {
    // Modify chat array (messages are mutable!)
    // Use structuredClone() for ephemeral changes
    
    // Optionally abort generation
    // abort(true); // Prevent subsequent interceptors
};
```

### Custom Macros

Register macros for template substitution:
```javascript
const { registerMacro, unregisterMacro } = SillyTavern.getContext();

// String macro
registerMacro('myvar', 'value');

// Function macro (synchronous only!)
registerMacro('timestamp', () => Date.now().toString());

// Cleanup
unregisterMacro('myvar');
```

Note: Don't wrap names in `{{}}` - SillyTavern adds them automatically.

### Internationalization

#### Via Manifest
```json
{
    "i18n": {
        "fr-fr": "i18n/french.json",
        "de-de": "i18n/german.json"
    }
}
```

#### Direct Registration
```javascript
SillyTavern.getContext().addLocaleData('fr-fr', {
    'Hello': 'Bonjour'
});
```

Use in HTML: `<span data-i18n="Hello">Hello</span>`

### UI Development

#### HTML Structure
- Use `inline-drawer` pattern for collapsible sections
- Follow existing SillyTavern UI conventions
- Add settings to `#extensions_settings` (system) or `#extensions_settings2` (UI/visual)

#### CSS Conventions
- Scope styles to avoid conflicts: `.my-extension-class`
- Use existing SillyTavern classes when possible
- Test with different themes

#### jQuery Patterns
```javascript
jQuery(async () => {
    // Load HTML
    const html = await $.get(`${extensionFolderPath}/example.html`);
    $("#extensions_settings").append(html);
    
    // Attach event handlers
    $("#my_button").on("click", onButtonClick);
    $("#my_checkbox").on("input", onCheckboxChange);
    
    // Load persisted settings
    await loadSettings();
});
```

### TypeScript Support

Create `global.d.ts` in extension root for autocomplete:
```typescript
export {};

// Import for user-scoped extensions
import '../../../../public/global';
// Import for server-scoped extensions
import '../../../../global';

declare global {
    // Additional type declarations
}
```

### Best Practices

1. **Initialization**: Wait for `APP_READY` event before accessing context-dependent data
2. **Error Handling**: Wrap async operations in try-catch blocks
3. **Performance**: Use `saveSettingsDebounced()` instead of direct saves to reduce I/O
4. **Memory**: Don't store long-lived references to `chatMetadata` or `characterId`
5. **Compatibility**: Test with latest SillyTavern release version
6. **Documentation**: Keep README.md updated with features and usage
7. **Licensing**: Use libre license (AGPLv3 recommended for official repo submission)

### Testing Checklist

- [ ] Extension loads without errors
- [ ] Settings persist across sessions
- [ ] Works with character chats and group chats
- [ ] Handles missing/undefined characterId gracefully
- [ ] Compatible with latest SillyTavern release
- [ ] No console errors or warnings
- [ ] UI elements follow SillyTavern styling
- [ ] Event listeners properly registered and cleaned up
- [ ] Slash commands work in STscript contexts
- [ ] i18n strings load correctly (if applicable)

### Debugging

1. Check browser console for errors
2. Verify `manifest.json` is valid JSON
3. Confirm file paths are relative to extension folder
4. Test `loading_order` if events seem out of sequence
5. Use `console.log(SillyTavern.getContext())` to explore API
6. Check `extensionSettings[MODULE_NAME]` for state issues

### Resources

- **Documentation**: https://docs.sillytavern.app/for-contributors/writing-extensions/
- **Example Extensions**: https://github.com/city-unit/st-extension-example
- **Official Extensions**: Search GitHub for `topic:extension org:SillyTavern`
- **Source Code**: https://github.com/SillyTavern/SillyTavern
- **Context API**: `public/scripts/st-context.js`
- **Event Types**: `public/scripts/events.js`
- **Global Libraries**: `public/lib.js`

### Code Style

- Use `async/await` for asynchronous operations
- Prefer `const` over `let`, avoid `var`
- Use template literals for strings with variables
- Follow existing naming conventions in codebase
- Add JSDoc comments for public functions
- Keep functions focused and single-purpose
- Use descriptive variable names

### Security

- Always sanitize user input with `DOMPurify.sanitize()`
- Validate JSON schemas before passing to generation functions
- Don't expose sensitive data in console logs
- Be cautious with `eval()` and dynamic code execution
- Follow Content Security Policy guidelines

## GIT Repository Management

### Commits

Use the Conventional Commits format: `<type>(scope): short summary`

Examples:

- `feature(config): support dynamic environment loading`
- `fix(core): handle missing config file gracefully`
- `test(utils): add unit tests for retry logic`

Allowed types (use these as `<type>` in your commit messages):

- `feature` – New features
- `fix` – Bug fixes
- `documentation` – Documentation changes only
- `style` – Code style, formatting, missing semi-colons, etc. (no code meaning changes)
- `refactor` – Code changes that neither fix a bug nor add a feature
- `performance` – Code changes that improve performance
- `test` – Adding or correcting tests
- `build` – Changes to build system or external dependencies
- `ci` – Changes to CI configuration files and scripts
- `chore` – Maintenance tasks (e.g., updating dependencies, minor tooling)
- `revert` – Reverting previous commits
- `security` – Security-related improvements or fixes
- `ux` – User experience or UI improvements

Other Notes:

- Prefer simple, linear Git history. Use rebase over merge where possible.
- Use `pre-commit` hooks to enforce formatting, linting, and checks before commits.
- If unsure about a change, open a draft PR with a summary and rationale.

### Release Guidelines

We follow a simplified Git-flow model for releases:

#### Branches

- `main`: Represents the latest stable, released version. Only hotfixes and release merges are committed directly to `main`.
- `develop`: Integration branch for ongoing development. All new features and bug fixes are merged into `develop`.
- `feature/<feature-name>`: Used for developing new features. Branch off `develop` and merge back into `develop` upon completion.

Here is the release process:

1. Prepare `develop` for Release:
    - Ensure all desired features and bug fixes are merged into `develop`.
    - Update `CHANGELOG.md` with changes for the new version, with the help of the command: `git log --pretty=format:"- (%h) %s" ...`
    - Update version numbers in relevant project files (e.g., `pyproject.toml`, `package.json`).
2. Make sure we start from a clean state:
    - Make sure you are on the `develop`, and that we start from there.
    - Perform final testing and bug fixing on this branch.
3. Merge to `main` and Tag:
    - Once the develop branch is stable, merge it into `main`:
      1. `git checkout main`
      2. `git merge --no-ff develop`
    - Tag the release on `main`: `git tag -a v<version-number> -m "Release v<version-number>"`
    - Ask the user to push the changes to the `main` branch, including tags: `git push origin main --tags`
4. Merge back to `develop`:
    - Merge the main branch back into `develop` to ensure `develop` has all release changes:
      1. `git checkout develop`
      2. `git merge --no-ff main`
    - Ask the user to push the changes to `develop` branch: `git push origin develop`