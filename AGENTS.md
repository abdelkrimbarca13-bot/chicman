# Repository Guidelines

## Project Summary
A full-stack application for managing costume rentals, featuring a Node.js/Express backend with Prisma/SQLite and a React frontend built with Vite and Tailwind CSS. The system manages authentication (JWT), item inventory, customer data, and rental transactions.

## Project Structure & Module Organization
The project is split into two primary environments located within the `costume/` directory:
- **`backend/`**: Contains the Express.js server logic (`src/index.js`), Prisma schema (`prisma/schema.prisma`), and SQLite database (`prisma/dev.db`). It handles core business logic, database interactions, and secure authentication.
- **`frontend/`**: A React single-page application (SPA) scaffolded with Vite. It features a modern UI layer utilizing Tailwind CSS for utility-first styling and Lucide React for iconography.
- **Root Level Scripts**: Several test scripts (`test-api.js`, `test-items-api.js`) reside at the root for end-to-end API verification.

## Build, Test, and Development Commands

### Backend Operations (`costume/backend`)
- **`npm install`**: Install all necessary server-side dependencies.
- **`npx prisma generate`**: Generate the type-safe Prisma Client based on the schema.
- **`npx prisma migrate dev`**: Apply database migrations and update the schema.
- **`npm run seed`**: Populate the SQLite database with initial testing data.
- **`npm run dev`**: Launch the development server with auto-reload via `nodemon`.

### Frontend Operations (`costume/frontend`)
- **`npm install`**: Install all client-side dependencies.
- **`npm run dev`**: Start the Vite development server (accessible at `http://localhost:5173`).
- **`npm run build`**: Generate a production-ready build in the `dist/` folder.
- **`npm run lint`**: Execute ESLint to ensure code quality and style consistency.

### System Verification
- **`node test-api.js`**: Executes a series of API calls from the root to verify system health.
- **`node costume/backend/test-server.js`**: Basic check for backend server availability.

## Coding Style & Naming Conventions
- **Backend**: Adheres to CommonJS modules. Uses standard Express controller-route patterns. Environment variables are managed via `.env`.
- **Frontend**: Follows modern React best practices using Functional Components and Hooks. Uses ESM for module management.
- **Styling**: Enforces Tailwind CSS for all UI components. Avoid traditional CSS files except for global styles.
- **Consistency**: Linting is enforced in the frontend through the project's ESLint configuration.

## Testing Guidelines
Testing relies on independent verification scripts found in `costume/backend/` and the project root. All test files should be prefixed with `test-` and utilize `axios` for HTTP requests. Developers should verify both positive and negative API response cases when adding new routes.
