# Security Policy

## Supported Versions

Security fixes are handled on the default branch.

## Reporting a Vulnerability

Please do not open a public issue for a suspected security vulnerability.

Instead, report it privately using GitHub's private vulnerability reporting if it is enabled for this repository. If that is not available, contact the repository owner directly.

Include:

- A clear description of the vulnerability.
- Steps to reproduce it.
- Affected files, routes, or dependencies.
- Any logs, screenshots, or proof-of-concept details that help verify the issue.

## Secrets

Never commit `.env` files, API keys, database URLs, JWT secrets, service credentials, or private certificates.

Use:

- `frontend/.env.example`
- `backend/.env.example`

as templates for local configuration.
