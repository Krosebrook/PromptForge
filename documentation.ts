
export const DOCUMENTATION_CONTENT = {
  'DOC_POLICY.md': `# Documentation Policy
Outlines the governance, versioning, and approval process for all project documentation. All documentation must follow semantic versioning.`,
  'PWA_TESTING_GUIDE.md': `# PWA & Service Worker Testing
PromptForge Pro is designed to function as a high-performance offline application.

## 1. Simulating Offline Scenarios
To verify that the application operates without an active network connection:
1. Open **Chrome DevTools** (F12).
2. Go to the **Network** tab.
3. Check the **Offline** checkbox.
4. Refresh the page. Core assets (HTML, TSX, CSS, Fonts) should load from the Service Worker cache.

## 2. Verifying Cache Updates
The Service Worker version is controlled by the \`CACHE_NAME\` constant in \`service-worker.js\`.
- **Manual Verification**: Check **Application > Cache Storage** in DevTools.
- **Force Update**: Shift+F5 forces a browser bypass, but the SW lifecycle (\`install\` -> \`activate\`) will still trigger automatically on the next load if the file hash changes.

## 3. Storage Inspections
- **LocalStorage**: Navigate to **Application > Local Storage**. You should see \`custom_prompts\`, \`user_profile\`, and \`chat_history\`.
- **Manifest**: Check **Application > Manifest** to ensure the app is "Installable".

## 4. Debugging Scripts
Run this in the console to check the status of your worker:
\`\`\`js
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker Ready:', registration.active.state);
});
\`\`\`

## 5. Deployment
When deploying updates, ensure \`service-worker.js\` is served with \`Cache-Control: no-cache\` to allow the browser to detect updates to the worker script itself.

## 6. Advanced Lifecycle Monitoring
To track the service worker installation and activation process in real-time, execute this snippet in the console:
\`\`\`js
navigator.serviceWorker.register('/service-worker.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    console.log('SW: Update detected', newWorker);
    newWorker.addEventListener('statechange', () => {
      console.log('SW State Change:', newWorker.state);
    });
  });
});
\`\`\`

## 7. Emergency Cache Reset
Use this script to completely wipe the PWA state (Unregister SW + Delete Caches) for a clean slate test:
\`\`\`js
// Unregister all workers
navigator.serviceWorker.getRegistrations().then(regs => {
  for (let reg of regs) reg.unregister();
  console.log('SW: Unregistered all workers');
});

// Delete all caches
caches.keys().then(names => {
  for (let name of names) caches.delete(name);
  console.log('SW: Deleted all caches');
});
\`\`\``,
  'AGENTS_DOCUMENTATION_AUTHORITY.md': `# Agents Documentation Authority
Details the architecture and implementation of the AI-driven Documentation Authority system.`,
  'SECURITY.md': `# Security Overview
- **API Security**: Gemini API keys are injected via environment variables; no keys are stored in the client state.
- **Data Handling**: LocalStorage is used for all user data.`,
  'FRAMEWORK.md': `# Framework & Technologies
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Core**: Google Gemini 3 (SDK v1.34.0)
- **Live Multimodal**: Gemini 2.5 Flash Native Audio`,
  'USER_PROFILE.md': `# User Profile & Personalization
Detailed explanation of Operative Identity and Global Context.`,
  'CHANGELOG_SEMANTIC.md': `# Semantic Changelog
v1.8.0 - PWA Enhancements & Filter Refactor
- **Filter Panel**: Consolidated sidebar controls into a unified collapsible panel.
- **Knowledge Explorer**: New 'Documents' view for cross-persona knowledge management.
- **PWA Meta**: Optimized HTML head for mobile installation.`,
  'SETTINGS_GUIDE.md': `# Advanced Settings Guide
Details on Thinking Budget, Top-P, and Top-K.`,
  'API_REFERENCE.md': `# API Reference
Methods for Gemini SDK and Live Multimodal integrations.`,
  'ARCHITECTURE.md': `# System Architecture
Overview of the modular monolithic structure.`,
  'PIPELINE_GUIDE.md': `# Pipeline Architecture Guide
The Pipeline Editor allows for the chaining of multiple Personas into a sequential execution flow.

## Core Concepts
- **Nodes**: Individual execution units. Can be an Input (System Data) or a Persona (AI Processing).
- **Edges**: Directional connections that pipe the output of one node into the context of the next.
- **Context Injection**: When Node A connects to Node B, the output of A is injected into B's prompt with a delimiter.

## Execution Modes
1. **Chain Run**: Executes the entire graph automatically, resolving dependencies layer by layer.
2. **Step-Run**: Manually trigger specific nodes. This allows for "Human-in-the-loop" workflows where you can edit the output of Node A before running Node B.

## Data Flow
\`[System Input] -> [Persona A] -> (Edit Opportunity) -> [Persona B] -> Final Output\`

## Technical Implementation
- Uses \`reactflow\` for DAG visualization.
- Execution logic uses a breadth-first traversal of the dependency graph.
- State is managed via local React state and refs for async stability.`
};
