Hard constraints — read this first
Do NOT run the app (npm run start, npm run start:dev, nest start, etc.).
Do NOT run any migration against any database. Only write the migration file. The user runs migrations themselves via npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts.
Do NOT install, launch, or reference any browser automation tool (Playwright, Puppeteer, Cypress, Chromium, Selenium, etc.) for testing or verification.
Do NOT write or run any test that spins up a server, hits a real database, or launches a browser. A plain, non-executed unit test file is fine if you want to leave one behind, but do not run it.
Do NOT add a CRON job or any scheduled task. This system is already fully lazy/read-time driven (via evaluateStreakState) per the existing implementation — this feature only adds a recording side-effect to logic that already runs, it does not need its own trigger.
Do NOT add any LLM/AI SDK, API key, or AI-related endpoint. Out of scope, unrelated feature.
Do NOT modify any existing migration file. Only add a new one.
Do NOT install any new npm dependency. Everything needed already exists in this project (TypeORM, NestJS, class-validator, etc.).