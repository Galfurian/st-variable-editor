# Contributing to SillyTavern Variable Editor

Thank you for your interest in contributing to the Variable Editor extension for SillyTavern! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js (for syntax checking and potential build tools)
- A working SillyTavern installation
- Git for version control

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Install the extension in your SillyTavern `public/scripts/extensions/third-party/` directory
4. Make your changes
5. Test thoroughly in SillyTavern
6. Submit a pull request

## Development Workflow

### Code Style

- Use single quotes for strings (except where double quotes are required by syntax)
- Follow JSDoc conventions for function documentation
- Use descriptive variable and function names
- Keep functions focused and reasonably sized

### Git Workflow

- Create feature branches from `develop`
- Use descriptive commit messages following conventional commits:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `style:` for code style changes
  - `refactor:` for code refactoring
- Keep commits focused and atomic

### Testing

- Test all changes in SillyTavern before submitting
- Verify that existing functionality still works
- Test edge cases and error conditions
- Check browser console for errors

## Pull Request Process

1. **Create a PR** from your feature branch to the `develop` branch
2. **Provide a clear description** of what your changes do and why they're needed
3. **Reference any related issues** in the PR description
4. **Ensure CI checks pass** (if any are configured)
5. **Wait for review** and address any feedback

## Code of Conduct

- Be respectful and constructive in discussions
- Follow the principle of "strong opinions, weakly held"
- Help create a welcoming environment for all contributors

## Areas for Contribution

### High Priority

- Bug fixes and stability improvements
- Performance optimizations
- Security enhancements

### Medium Priority

- New features (discuss in issues first)
- UI/UX improvements
- Documentation improvements

### Low Priority

- Code refactoring and cleanup
- Additional test coverage
- Advanced features

## Questions?

If you have questions about contributing or need help getting started, feel free to:

- Open an issue on GitHub
- Check existing issues and pull requests
- Review the codebase and existing documentation

Thank you for helping improve the Variable Editor extension!
