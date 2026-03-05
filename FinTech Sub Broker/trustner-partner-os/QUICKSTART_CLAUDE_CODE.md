# How to Use Claude Code with Trustner Partner OS

## Step 1: Install Claude Code

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
npm install -g @anthropic-ai/claude-code
```

Or if you prefer npx (no installation):
```bash
npx @anthropic-ai/claude-code
```

## Step 2: Navigate to the Project

```bash
cd "path/to/FinTech Sub Broker/trustner-partner-os"
```

For example, if the folder is on your Desktop:
```bash
cd ~/Desktop/"FinTech Sub Broker"/trustner-partner-os
```

## Step 3: Start Claude Code

```bash
claude
```

That's it! Claude Code will automatically read the `CLAUDE.md` file and understand the entire project structure, tech stack, and business context.

## What You Can Ask Claude Code

Once inside, you can ask things like:

- "Deploy this to my DigitalOcean server at IP 123.456.789.0"
- "Add a new field to the SubBroker model"
- "Fix the login page styling"
- "Add email notification when a new policy is created"
- "Run the database migrations"
- "Build the frontend for production"
- "Add unit tests for the commission service"
- "Create a new API endpoint for partner reports"

## Important Files Claude Code Will Use

- `CLAUDE.md` — Full project context (auto-read by Claude Code)
- `.claude/settings.json` — Permissions for common commands
- `backend/prisma/schema.prisma` — Database models
- `backend/src/app.module.ts` — All backend modules
- `frontend/src/App.jsx` — All frontend routes
- `docker-compose.yml` — Deployment configuration
- `.env.example` — Environment variables template

## Tips

1. Always work from the `trustner-partner-os` directory
2. Claude Code can read, write, and run commands — it's like having a developer on your terminal
3. If you need to deploy, have your DigitalOcean server IP and SSH key ready
4. For database changes, Claude Code will handle Prisma migrations automatically
5. You can share conversation context by saying "continue from where we left off"
