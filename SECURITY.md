# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x: |

## Reporting a Vulnerability

Email security@vibematch.app with steps to reproduce. We aim to acknowledge
within 48h and ship a fix for critical issues within 7 days. Do not open
public issues for auth, PII, or token vulnerabilities.

## Small-test hardening notes

- JWTs are HS256 with `VIBEMATCH_SECRET_KEY` (required in production).
- All `/user/{id}`, `/match/{id}`, `/swipe/*`, `/chat/*` require the owner token.
- Rate limits are per-IP via slowapi; put the API behind a single trusted
  proxy / CDN in production and set `VIBEMATCH_TRUSTED_HOSTS` + explicit CORS.
- Block/report endpoints: `/safety/block/{id}`, `/safety/report`.
- Self-delete: `DELETE /user/{id}`.
