# mcp-omnisearch

## 0.0.11

### Patch Changes

- df090fc: add exa.ai features
- 8b18293: remove exa research feature

## 0.0.10

### Patch Changes

- 9bab891: doesn't break if no GitHub key added

## 0.0.9

### Patch Changes

- 8002c78: feat: add GitHub search provider integration
  - Updated package.json and pnpm-lock.yaml to include Octokit for
    GitHub API interactions.
  - Enhanced SearchResult interface to include optional metadata
    field.
  - Added GITHUB_API_KEY to environment configuration.
  - Implemented GitHubSearchProvider class for searching code,
    repositories, and users on GitHub.
  - Registered GitHub-specific search tools in the tool registry with
    custom handling for search requests.

## 0.0.8

### Patch Changes

- 50ac221: added firecrawl shelf host env variable

## 0.0.7

### Patch Changes

- 95e671f: update documentation

## 0.0.6

### Patch Changes

- feat: add Docker support with MCPO integration for cloud deployment

## 0.0.5

### Patch Changes

- 295f28b: Add search operator support and update provider
  descriptions

## 0.0.4

### Patch Changes

- add firecrawl feature

## 0.0.3

### Patch Changes

- 0d937fa: Add Tavily Extract Provider for web content extraction

## 0.0.2

### Patch Changes

- ability to use individual API keys

## 0.0.1

### Patch Changes

- initial release
