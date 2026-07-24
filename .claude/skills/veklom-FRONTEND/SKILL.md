```markdown
# veklom-FRONTEND Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and conventions used in the `veklom-FRONTEND` TypeScript codebase. It covers file organization, import/export styles, commit message habits, and testing patterns, providing a foundation for consistent and effective contributions.

## Coding Conventions

### File Naming
- **Pattern:** PascalCase
- **Example:**  
  - `UserProfile.tsx`
  - `LoginForm.ts`

### Import Style
- **Pattern:** Alias imports are used for modules.
- **Example:**
  ```typescript
  import UserService from '@services/UserService';
  import { Button } from '@components/Button';
  ```

### Export Style
- **Pattern:** Default exports are preferred.
- **Example:**
  ```typescript
  // UserProfile.tsx
  const UserProfile = () => { /* ... */ };
  export default UserProfile;
  ```

### Commit Patterns
- **Type:** Freeform messages, no enforced structure.
- **Prefixes:** Occasionally used, but not standardized.
- **Average Length:** ~38 characters.

## Workflows

### Adding a New Component
**Trigger:** When you need to create a new UI component.
**Command:** `/add-component`

1. Create a new file in the appropriate directory using PascalCase (e.g., `NewComponent.tsx`).
2. Implement the component logic.
3. Use alias imports for dependencies.
4. Export the component as default.
5. If needed, create a corresponding test file (`NewComponent.test.tsx`).

### Refactoring Imports
**Trigger:** When updating import paths for consistency or restructuring.
**Command:** `/refactor-imports`

1. Identify files with outdated or relative imports.
2. Update imports to use the alias style.
   ```typescript
   // Before
   import UserService from '../../services/UserService';
   // After
   import UserService from '@services/UserService';
   ```
3. Test to ensure no import errors.

### Writing Tests
**Trigger:** When adding or updating features.
**Command:** `/write-test`

1. Create a test file alongside the target file, following the pattern `*.test.*` (e.g., `UserProfile.test.tsx`).
2. Write tests using the project's chosen (unknown) testing framework.
3. Run tests to verify correctness.

## Testing Patterns

- **Framework:** Not detected; use the project's existing setup.
- **File Pattern:** Test files are named with the `*.test.*` convention.
- **Example:**
  ```
  UserProfile.test.tsx
  LoginForm.test.ts
  ```
- Place test files next to the files they test or in a dedicated `__tests__` directory if present.

## Commands
| Command           | Purpose                                  |
|-------------------|------------------------------------------|
| /add-component    | Scaffold and add a new UI component      |
| /refactor-imports | Update imports to use alias style        |
| /write-test       | Create and run tests for a component     |
```
