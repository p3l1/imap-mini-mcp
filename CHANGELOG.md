# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repository does not currently use release tags, so entries are grouped by date and major update scope.

## [0.2.0](https://github.com/p3l1/imap-mini-mcp/compare/imap-mini-mcp-v0.1.0...imap-mini-mcp-v0.2.0) (2026-10-05)


### Features

* add find_emails tool to registry ([d7079ab](https://github.com/p3l1/imap-mini-mcp/commit/d7079ab22e2eaef61be61104779e9069c88d5672))
* add findEmails unified search function ([b5d7f2b](https://github.com/p3l1/imap-mini-mcp/commit/b5d7f2b1981b2d6a77c58858efaac555be0c4253))
* add hasAttachmentPart helper for bodyStructure inspection ([70d891e](https://github.com/p3l1/imap-mini-mcp/commit/70d891edc31d2680401a07e242d14f0c74e5e9ab))
* add parseTimeParam helper for relative and ISO date parsing ([5c5f8ab](https://github.com/p3l1/imap-mini-mcp/commit/5c5f8ab91d3bc587694ac705e0301cdec66bc642))
* read the password from a file and label the mailbox ([#3](https://github.com/p3l1/imap-mini-mcp/issues/3)) ([f2b2a47](https://github.com/p3l1/imap-mini-mcp/commit/f2b2a473a456485cfa90acc62849be2a6840e44b))
* replace 12 list tools with unified find_emails ([2741077](https://github.com/p3l1/imap-mini-mcp/commit/2741077204d144aa9174d9cd163991a3c34fea9d))
* serve the tools over stateless HTTP and ship an image ([#2](https://github.com/p3l1/imap-mini-mcp/issues/2)) ([be31b0f](https://github.com/p3l1/imap-mini-mcp/commit/be31b0f35608f658cbcc5e759739bbd852e512aa))

## 2026-02-23

### Changed
- Replaced 12 email listing tools with a single `find_emails` tool
  - Supports date range (`after`, `before`) with relative time ("2h", "7d") and ISO dates
  - Supports sender (`from`) and subject (`subject`) substring filtering
  - Supports `unread_only` and `has_attachment` boolean filters
  - Supports `folder` (default "INBOX") and `limit` for result count

### Removed
- `list_emails_24h`, `list_emails_7days`, `list_emails_month`, `list_emails_quarter`, `list_emails_year`, `list_emails_all`
- `list_emails_n_hours`, `list_emails_n_minutes`
- `list_inbox_messages`, `list_n_recent_emails`
- `list_emails_from_domain`, `list_emails_from_sender`

## 2026-02-14

### Added
- `list_emails_n_hours` tool — list emails from the last N hours
- `list_emails_n_minutes` tool — list emails from the last N minutes
- `list_n_recent_emails` tool — list the N most recent emails from the inbox
- `hoursAgo()` and `minutesAgo()` helper functions for flexible time-based queries

## 2026-02-13

### Added
- `list_inbox_messages` tool — list the most recent N messages in the inbox
- `mark_read` and `mark_unread` tools — toggle the read/unread flag on emails
- `bulk_move_by_sender_email` tool — move all emails from a sender address
- `bulk_move_by_sender_domain` tool — move all emails from a sender domain
- Connection error handling with structured stderr logging
- Mailbox lock retry logic for transient IMAP failures
- Integration test that exercises tools against a real IMAP server

### Fixed
- Server no longer crashes on unexpected IMAP errors (graceful error propagation)

## 2026-02-12

### Added
- Initial IMAP MCP server with stdio transport
- Email listing tools: `list_emails_24h`, `list_emails_7days`, `list_emails_month`, `list_emails_quarter`, `list_emails_year`, `list_emails_all`
- `list_emails_from_domain` and `list_emails_from_sender` tools
- `list_starred_emails` tool — starred emails across all folders, grouped by folder
- `fetch_email_content` and `fetch_email_attachment` tools
- `list_folders` and `create_folder` tools
- `move_email` tool
- `star_email` and `unstar_email` tools
- `create_draft`, `draft_reply`, and `update_draft` tools
- Globally unique composite email identifiers (`YYYY-MM-DDTHH:mm:ss.<Message-ID>`)
- Configurable TLS, STARTTLS, and certificate validation via environment variables
- ProtonMail Bridge support (non-TLS localhost connections)
- README with setup instructions, tool reference, and troubleshooting guide
