# Mailchimp press release imports

Requires Node 18+ (native fetch). No scheduler exists in this backend; use host cron.
The CLI uses Payload 2's local initialization and Local API, without starting Express.

Set server-only environment variables in the host environment or `.env`:

- `MAILCHIMP_API_KEY`: Mailchimp key including its `-usNN` data center suffix.
- `MAILCHIMP_AUDIENCE_ID`: audience/list ID.
- `MAILCHIMP_IMPORT_START_DATE`: mandatory ISO timestamp, e.g. `2026-01-01T00:00:00Z`.
- `MAILCHIMP_PRESS_RELEASE_TAG_ID`: optional tag ID. If neither target is set, the exact `Press Release` tag is resolved with tag-search.
- `MAILCHIMP_PRESS_RELEASE_SEGMENT_ID`: optional saved segment ID. Set this alone to target only that segment, or set both IDs to qualify campaigns matching either target.
- Existing `DATABASE_URI`, `PAYLOAD_SECRET`, frontend URL and revalidation settings are required for writes and publishing hooks.

Do not put the API key in a `PAYLOAD_PUBLIC_*` variable. Dry-run contacts only Mailchimp and does not initialize Payload.

```sh
npm run mailchimp:import -- --dry-run
npm run mailchimp:import -- --write
npm run test:mailchimp
```

To list segment names and IDs for the configured audience, run:

```sh
npm run mailchimp:segments
```

To list tag names and IDs using the same settings, run:

```sh
npm run mailchimp:tags
```

This paginates the audience's static segments (Mailchimp's API representation of tags). Copy the desired ID into `MAILCHIMP_PRESS_RELEASE_TAG_ID`.

This reads `MAILCHIMP_API_KEY` and `MAILCHIMP_AUDIENCE_ID` from `.env`, paginates the audience's segments, and prints their IDs and names. It does not require an import start date or initialize Payload. Copy the desired ID into `MAILCHIMP_PRESS_RELEASE_SEGMENT_ID`.

Default execution is dry-run. Unknown arguments are rejected.

To inspect the complete campaign API response, including any exposed recipient targeting, run:

```sh
npm run mailchimp:inspect -- CAMPAIGN_ID
```

This reads `MAILCHIMP_API_KEY` from `.env` and prints the unfiltered response as formatted JSON. It does not require an audience ID, import start date, or database connection. Use the API campaign ID shown in importer logs. To save the JSON without npm's script banner, use `npm run --silent mailchimp:inspect -- CAMPAIGN_ID > campaign.json`.

On Plesk, after deploying the updated build, you can also run:

```sh
/opt/plesk/node/24/bin/node dist/mailchimp/cli.js --inspect-campaign CAMPAIGN_ID
```

Run from the backend directory so `.env` is loaded. To import using a production build:

```sh
PAYLOAD_CONFIG_PATH=dist/payload.config.js node dist/mailchimp/cli.js --write
```

Example cron (use absolute paths for the deployed project and Node executable):

```cron
*/15 * * * * cd /srv/ch-back-end && PAYLOAD_CONFIG_PATH=dist/payload.config.js /usr/bin/node dist/mailchimp/cli.js --write >> /var/log/ch-mailchimp.log 2>&1
```

Every run paginates all sent campaigns from the explicit start date. Campaigns whose internal `settings.title` contains `resend` are always skipped, even when a tag or segment matches. Otherwise, a title containing `press release` qualifies independently of targeting data. Both title checks are case-insensitive. The published release title still comes from `settings.subject_line`. If the default Press Release tag is absent, title matching still runs. Eligibility requires a matching `recipients.segment_opts.saved_segment_id` when a segment ID is configured, or any positive `static_segment/static_is` condition matching the tag ID as a string, regardless of other conditions or match mode. A matching saved segment qualifies even without conditions. Otherwise, missing conditions trigger an individual detail fetch. If details still omit conditions, unsegmented campaigns are skipped and opaque segment campaigns are logged as `Skipped unresolved`. Sent advanced-segment campaigns can expose only `segment_opts: {match: "all"}` and a generic segment description, with no rules or segment ID to resolve. These are unverified, not confirmed nonmatches. They are never imported based on display text, subject, recipient counts, or current tag membership. Review unresolved campaigns in Mailchimp if they should be imported; these campaigns can qualify by internal campaign title, or by an exposed qualifying tag condition or saved segment ID. Segment IDs are matched using Mailchimp's [campaign recipient options](https://mailchimp.com/developer/marketing/api/campaigns/get/). Skips do not fail a run. Request errors and content/create failures still exit nonzero. The summary reports scanned, qualifying, skipped, unresolved and failed counts. All campaigns are rechecked on the next run; there is no advancing cursor or persisted skip marker.

Only creates are performed. The hidden field `mailchimpCampaignId` denies ordinary API reads and writes. Its nullable PostgreSQL unique index allows existing releases with no ID and arbitrates concurrent creates. Ensure the schema's column and unique index are deployed through your normal Payload/Postgres schema deployment process before scheduling writes. Never backfill empty strings. Existing matching releases, including edited or unpublished ones, are skipped.

The only required editorial field is title. Slugs use the collection's existing beforeValidate hook. Published records use the send timestamp, native column/HeaderBlock Lexical content, no PDF, and existing publishing/search hooks. The publishedAt hook respects an explicitly supplied timestamp. Rich text preserves headings, paragraphs, lists, emphasis and direct editorial links, removes known email chrome and recipient links, and strips tracking parameters. Email images are omitted, including pixels; no remote image is hotlinked or downloaded. An optional hero is not populated. For custom email templates, review dry-run candidates and tune extraction against representative bodies before enabling cron; ambiguous or unusually structured emails may need manual review. Bodies with fewer than 40 non-whitespace characters are rejected.

## Verification

Automated checks use a mock Local API: multiple positive tags qualify, an exclusion alone does not, absent conditions use details, exact tag resolution works, dry-run writes nothing, and two imports preserve one published record and subsequent editorial changes. They also exercise saved segment matching (including detail-only responses), segment-only runs without a default tag lookup, either-target matching, and the Lexical conversion. These are not a live database/concurrency test.

On local/staging, first inspect `/api/pressRelease/17` (the live reference was unreachable from the implementation environment). Run dry-run against known positive-plus-other-tag and exclusion-only campaigns. Run `--write` twice. The log must show one creation and then `Already imported`. Inspect the anonymous `/api/pressRelease?where[_status][equals]=published` query and the new record's layout, timestamp, slug and rendering. Each create also checks the public Local API query with `overrideAccess: false`. Confirm the database unique index exists before testing overlapping runs. No live Mailchimp or staging write verification was possible without configured credentials and a reachable backend.
