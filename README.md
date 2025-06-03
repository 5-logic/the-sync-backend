# TheSync Backend

> Backend for TheSync - A modern API built with NestJS and TypeScript.

## 📑 Table of Contents

- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Development Workflow](#-development-workflow)
  - [Required VS Code Extensions](#required-vs-code-extensions)
  - [Available Scripts](#available-scripts)
  - [Tech Stack](#tech-stack)
  - [Commit Conventions](#commit-conventions)
- [Code Quality](#-code-quality)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.19.2 exactly)
- [pnpm](https://pnpm.io/) (v10 or later)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended IDE)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/FiveLogic/the-sync-backend.git
   cd the-sync-backend
   ```

2. Install dependencies:

   ```bash
   pnpm install --frozen-lockfile
   ```

3. Start the development server:

   ```bash
   pnpm start:dev
   ```

4. The API will be available at [http://localhost:4000/swagger](http://localhost:4000/swagger).

## 🧰 Development Workflow

### Required VS Code Extensions

For the best development experience, please install the following VS Code extensions:

- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

You can install them by running:

```bash
code --install-extension EditorConfig.EditorConfig
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
```

### Available Scripts

- `pnpm start:dev` - Start the development server with hot-reload
- `pnpm build` - Build the application for production
- `pnpm start` - Start the server in development mode
- `pnpm start:prod` - Start the production server
- `pnpm lint` - Run ESLint to check code quality
- `pnpm test` - Run tests
- `pnpm test:cov` - Run tests with coverage report
- `pnpm test:e2e` - Run end-to-end tests

### Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Jest](https://jestjs.io/)

### Commit Conventions

We use conventional commit messages to ensure consistency and maintain a clean git history. This project enforces commit conventions using commitlint.

#### Commit Message Format

Each commit message should follow this format:

```
<type>: <description>

[optional body]

[optional footer(s)]
```

#### Allowed Types

| Type       | Description                                     |
| ---------- | ----------------------------------------------- |
| `add`      | Adding a new file, feature or dependency        |
| `update`   | Updating existing functionality                 |
| `fix`      | Bug fixes                                       |
| `docs`     | Documentation changes                           |
| `feat`     | New features                                    |
| `refactor` | Code refactoring without changing functionality |
| `delete`   | Removing code or files                          |

#### Examples

```
feat: add user authentication controller
```

```
fix: resolve database connection issue
```

```
docs: update API documentation
```

```
refactor: improve error handling in auth service
```

## 🔍 Code Quality

We maintain code quality with:

- **ESLint**: For code linting
- **Prettier**: For code formatting
- **TypeScript**: For type safety
- **Jest**: For unit and integration testing
