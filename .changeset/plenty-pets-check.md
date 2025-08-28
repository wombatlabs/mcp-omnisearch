---
'mcp-omnisearch': patch
---

feat: add GitHub search provider integration

- Updated package.json and pnpm-lock.yaml to include Octokit for GitHub API interactions.
- Enhanced SearchResult interface to include optional metadata field.
- Added GITHUB_API_KEY to environment configuration.
- Implemented GitHubSearchProvider class for searching code, repositories, and users on GitHub.
- Registered GitHub-specific search tools in the tool registry with custom handling for search requests.
