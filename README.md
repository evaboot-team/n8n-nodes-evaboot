# @evaboot-team/n8n-nodes-evaboot

n8n community node for [Evaboot](https://evaboot.com). Extract LinkedIn Sales Navigator data, find and verify professional emails, and start workflows when an Evaboot export or email job finishes.

This package replaces `n8n-nodes-evaboot` (0.1.x), which is no longer maintained.

## Installation

- **n8n Cloud:** open the Nodes panel, search for "Evaboot", and install it (available once the node is verified by n8n).
- **Self-hosted:** go to **Settings → Community Nodes → Install**, enter `@evaboot-team/n8n-nodes-evaboot`, and click **Install**.

For more details, see the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

1. In n8n, go to **Settings → Credentials → Add Credential → Evaboot API**.
2. Enter your API key from the Evaboot dashboard ([app.evaboot.com/settings](https://app.evaboot.com/settings)).
3. Leave **Base URL** at its default, `https://api.evaboot.com`.
4. Click **Test** to verify, then **Save**.

## Actions (Evaboot node)

| Resource | Operation | Endpoint |
|---|---|---|
| Extraction | Create URL Extraction | `POST /v1/extractions/url/` |
| Extraction | Create Profile Extraction | `POST /v1/extractions/profiles/` |
| Extraction | Create Single Profile Extraction | `POST /v1/extractions/single/` |
| Extraction | Get | `GET /v1/extractions/{id}/` |
| Extraction | List | `GET /v1/extractions/` |
| Email Finder | Create Bulk Job | `POST /v1/email-finder/` |
| Email Finder | Find Single Email | `POST /v1/email-finder/single/` |
| Email Finder | Get | `GET /v1/email-finder/{id}/` |
| Email Finder | List | `GET /v1/email-finder/` |
| Email Validation | Create Bulk Job | `POST /v1/email-validation/` |
| Email Validation | Validate Single Email | `POST /v1/email-validation/single/` |
| Email Validation | Get | `GET /v1/email-validation/{id}/` |
| Email Validation | List | `GET /v1/email-validation/` |
| Account | Get Quota | `GET /v1/quota/` |

## Trigger (Evaboot Trigger node)

The trigger starts a workflow when one of these events happens:

- **Export Finished:** a Sales Navigator export completes.
- **Email Finder Job Finished:** a bulk email finder job completes.
- **Email Verification Job Finished:** a bulk email verification job completes.

Each delivery produces one item containing the Evaboot payload as sent by Evaboot.

Activating the workflow creates an integration named "n8n: <workflow name>" in your Evaboot dashboard. Deactivating the workflow removes it. Every delivery carries a secret header that the trigger checks, so requests that do not come from Evaboot are rejected.

## Troubleshooting

- **The trigger stopped firing.** After 5 failed deliveries in a row, Evaboot turns the integration off, and it shows as down in the Evaboot dashboard. Switch the workflow off and on again to restore it.
- **No deliveries at all.** Deliveries only reach accounts claimed since the 2026 migration: the Evaboot account needs its own password or a linked social sign-in.

## Resources

- [Evaboot API documentation](https://docs.evaboot.com/api)
- [Evaboot website](https://evaboot.com)

## License

[MIT](LICENSE)
