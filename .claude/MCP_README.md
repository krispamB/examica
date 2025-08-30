# MCP (Model Context Protocol) Configuration for Examica

This project has been configured with MCP servers to enhance Claude Code's capabilities when working with the Examica codebase.

## Configured MCP Servers

### 1. Filesystem Server

- **Purpose**: Enhanced file system operations within the project directory
- **Package**: `@modelcontextprotocol/server-filesystem`
- **Capabilities**:
  - Advanced file searching and filtering
  - Batch file operations
  - Directory structure analysis
  - File content analysis

### 2. Git Server (Optional)

- **Purpose**: Git repository management and history analysis
- **Package**: `mcp-server-git` (requires `uvx` installation)
- **Capabilities**:
  - Commit history analysis
  - Branch management
  - Diff analysis
  - Repository statistics

### 3. Web Server (Optional)

- **Purpose**: External API calls and web scraping for integrations
- **Package**: `mcp-server-fetch` (requires `uvx` installation)
- **Capabilities**:
  - Supabase API interactions
  - AWS service documentation fetching
  - Package documentation retrieval

## Installation Requirements

### Core (Already Installed)

- `@modelcontextprotocol/server-filesystem` - Installed via yarn

### Optional (Requires uvx)

To use the git and web servers, install `uvx`:

```bash
# Install uvx if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Usage

The MCP servers are automatically available when using Claude Code in this project. They provide:

1. **Enhanced code search** across the entire project
2. **Smart file operations** with context awareness
3. **Git integration** for version control operations
4. **External API access** for documentation and integrations

## Project Context

This MCP configuration is specifically tailored for the Examica project:

- **Technology Stack**: Next.js, TypeScript, Tailwind CSS, Supabase, AWS Rekognition
- **Project Scope**: Computer-based testing platform with facial recognition
- **Development Phase**: Foundation & Setup (Phase 1)

## Configuration Details

The MCP configuration is stored in `.claude/mcp.json` and includes:

- Server definitions for filesystem, git, and web operations
- Project metadata for context-aware assistance
- Environment configurations for secure operations

This setup enables Claude Code to provide more intelligent assistance throughout the development of the Examica platform.
