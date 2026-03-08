# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in nx-oxfmt, please report it responsibly.

**Do not open a public issue.**

Instead, email **security@mx.cm** with:

- A description of the vulnerability
- Steps to reproduce
- Impact assessment (if known)

You can expect an initial response within 48 hours. We will work with you to understand and address the issue before any public disclosure.

## Security Practices

- All user-provided options are passed via `execFileSync` argument arrays (no shell interpolation)
- CI enforces `npm audit` with 0 vulnerabilities
- Dependencies are kept up to date and audited regularly
- GitHub Actions workflows use least-privilege `permissions: contents: read`
