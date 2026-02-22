# Mythouse Refresh Key — Paste this into Claude Code

Run the full Mythouse diagnostic routine. Here's what to do:

1. **Run the health check script**: `cd /Users/willlinn/meteor-steel-site-2 && bash scripts/health-check.sh`
2. **Interpret every FAIL and WARN** — explain what each means and whether it needs fixing.
3. **For each FAIL, fix it** if you can (missing files, syntax errors, bad JSON, build errors). If it requires user action (like adding an API key), tell me what to do.
4. **Check API integrations deeper**:
   - Read `api/chat.js` and verify Anthropic/OpenAI SDK usage matches current SDK versions
   - Read `api/_lib/llm.js` and verify client factory functions are correct
   - Check that all API endpoints in `api/` have proper error handling
5. **Check for stale patterns**:
   - Scan for any unused imports in recently modified files
   - Check that all context providers in App.js are properly nested
   - Verify that all route paths in App.js point to files that exist
   - Check for any broken `import` paths
6. **Check subscription/purchase gates**:
   - Verify all gated features (YBR, Fallen Starlight, Story of Stories, Medicine Wheel) properly check purchases/subscriptions
   - Check that gate popups navigate to the correct profile section
7. **Check Firebase rules**: Read `firestore.rules` and flag any security concerns
8. **Summary**: Give me a clear report with what's healthy, what you fixed, and what needs my attention.

After the routine, if there are build warnings or deprecation notices, suggest specific fixes.
