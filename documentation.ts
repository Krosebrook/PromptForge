
export const DOCUMENTATION_CONTENT = {
  'DOC_POLICY.md': `# Documentation Policy
Outlines the governance, versioning, and approval process for all project documentation. All documentation must follow semantic versioning.`,
  'AGENTS_DOCUMENTATION_AUTHORITY.md': `# Agents Documentation Authority
Details the architecture and implementation of the AI-driven Documentation Authority system. This agent ensures all docs are up to date by monitoring codebase changes.`,
  'SECURITY.md': `# Security Overview
Comprehensive overview of the application's security architecture. 
- Data Handling: LocalStorage only for user data.
- API Security: Gemini API keys are handled securely via environment variables.
- Compliance: SOC2 Type II compliance (in progress).`,
  'FRAMEWORK.md': `# Framework & Technologies
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Core**: Google Gemini 3 (SDK v1.34.0)
- **Backend**: Serverless / Base44`,
  'CHANGELOG_SEMANTIC.md': `# Semantic Changelog
v1.2.0 - Library & Session Upgrades
- **Advanced Filtering**: Added multi-select tag filtering and sorting for the prompt library.
- **Session Management**: Added granular delete and Markdown export for individual chat sessions.
- **Search**: Integrated unified search across library and history.

v1.1.0 - Editor Enhancements
- Added Description field to Prompt Editor.
- Added JSON Export for personas.

v1.0.0 - Initial Launch
- Persona Forge implementation.
- Real-time simulation via Gemini 3.
- Custom prompt builder.`,
  'API_REFERENCE.md': `# API Reference
## Gemini SDK
- \`ai.chats.create\`: Create a new session.
- \`chat.sendMessage\`: Send user intent to the model.`,
  'ARCHITECTURE.md': `# System Architecture
PromptForge Pro follows a modular monolithic architecture on the frontend, leveraging React state for local persistence and Gemini 3 for remote intelligence.`,
  'ENTITY_ACCESS_RULES.md': `# Entity Access Rules
RBAC:
- User: Read/Write local custom prompts.
- System: Read original PROMPTS_DATA.`,
  'GITHUB_SETUP_INSTRUCTIONS.md': `# GitHub Setup
1. Fork repository.
2. Configure \`API_KEY\` secret.
3. Enable GitHub Actions for deployment.`,
  'PRD_MASTER.md': `# Product Requirements Document
Objective: Create the world's most robust AI Persona library for professional workflows.`
};
