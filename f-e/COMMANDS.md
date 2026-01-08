# Pivotal AI Frontend Commands

This document provides essential commands for development, testing, and version control in the Pivotal AI frontend project.

## Development

### Start Development Server
```bash
pnpm dev
```
Starts the Next.js development server on `http://localhost:3000`.

### Build for Production
```bash
pnpm build
```
Creates an optimized production build in the `.next` directory.

### Start Production Server
```bash
pnpm start
```
Starts the production server after building.

### Install Dependencies
```bash
pnpm install
```
Installs all project dependencies using pnpm.

## Testing

### Run All Unit Tests
```bash
pnpm test
```
Runs the entire test suite using Jest.

### Run Specific Test File
```bash
pnpm test -- __tests__/pages/home.test.jsx
```
Runs tests for a specific file (adjust path as needed).

### Run Tests in Watch Mode
```bash
pnpm test -- --watch
```
Runs tests in watch mode for continuous testing during development.

### Run Tests with Coverage
```bash
pnpm test -- --coverage
```
Runs tests and generates a coverage report.

## Git Version Control

### Check Repository Status
```bash
git status
```
Shows the current state of the working directory and staging area.

### View Commit History
```bash
git log --oneline
```
Displays a concise commit history.

### Commit Changes
```bash
git commit -am "Your commit message"
```
Stages all modified files and commits with a message.

### Push Changes
```bash
git push
```
Pushes committed changes to the remote repository.

### Pull Latest Changes
```bash
git pull
```
Fetches and merges changes from the remote repository.

### Create and Switch to New Branch
```bash
git checkout -b feature/new-feature
```
Creates a new branch and switches to it.

### Switch to Existing Branch
```bash
git checkout branch-name
```
Switches to an existing branch.

## Additional Scripts

Check `package.json` for more available scripts. Common ones include:
- `pnpm lint` - Run ESLint for code quality checks
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier

## Notes
- Ensure you have Node.js and pnpm installed.
- Use `clear` command in terminal to clear the screen before running commands if desired.
- For Windows PowerShell, some commands may need adjustments.