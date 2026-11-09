import { convertContent } from './content'

export const qualifies = (campaign: any, tag: string) =>
    Array.isArray(campaign.recipients?.segment_opts?.conditions) &&
    campaign.recipients.segment_opts.conditions.some((c: any) =>
        c?.field === 'static_segment' && c.op === 'static_is' && String(c.value) === String(tag))

export async function importCampaigns({ api, audience, tag, since, payload, write = false, log = console.log }: any) {
    if (!since || !Number.isFinite(Date.parse(since))) throw new Error('An explicit ISO import start date is required')
    if (!tag) {
        const result = await api(`/lists/${encodeURIComponent(audience)}/tag-search?name=Press%20Release`)
        tag = result.tags?.find((t: any) => t.name === 'Press Release')?.id
        if (tag === undefined) throw new Error('Exact Press Release tag not found')
    }
    let offset = 0
    const summary = { scanned: 0, qualified: 0, skipped: 0, unresolved: 0, failures: 0 }
    while (true) {
        const page = await api(`/campaigns?status=sent&list_id=${encodeURIComponent(audience)}&since_send_time=${encodeURIComponent(new Date(since).toISOString())}&count=100&offset=${offset}&sort_field=send_time&sort_dir=ASC`)
        if (!Array.isArray(page.campaigns)) throw new Error('Invalid Mailchimp campaign response')
        for (let campaign of page.campaigns) {
            summary.scanned++
            try {
                if (!Array.isArray(campaign.recipients?.segment_opts?.conditions)) campaign = await api(`/campaigns/${encodeURIComponent(campaign.id)}`)
                if (campaign.status !== 'sent' || campaign.recipients?.list_id !== audience) { summary.skipped++; continue }
                if (!Array.isArray(campaign.recipients?.segment_opts?.conditions)) {
                    const recipients = campaign.recipients
                    summary.skipped++
                    if (recipients.segment_opts == null && !recipients.segment_text) {
                        log(`Skipped: ${campaign.id} (no recipient segment conditions)`)
                    } else {
                        // Some sent advanced-segment campaigns expose only {match: 'all'},
                        // without rules or a segment ID, even in the individual response.
                        // Neither display text nor current audience membership proves eligibility.
                        summary.unresolved++
                        log(`Skipped unresolved: ${campaign.id} (Mailchimp did not expose recipient conditions; eligibility unverified, will recheck next run)`)
                    }
                    continue
                }
                if (!qualifies(campaign, tag)) { summary.skipped++; continue }
                summary.qualified++
                log(`Qualifies: ${campaign.id} ${campaign.settings?.subject_line || ''}`)
                if (!write) continue
                const existing = () => payload.find({ collection: 'pressRelease', where: { mailchimpCampaignId: { equals: campaign.id } }, limit: 1, depth: 0, overrideAccess: true })
                if ((await existing()).docs.length) { log(`Already imported: ${campaign.id}`); continue }
                const title = campaign.settings?.subject_line?.trim()
                if (!title || !Number.isFinite(Date.parse(campaign.send_time))) throw new Error('Missing subject or send time')
                const content = await api(`/campaigns/${encodeURIComponent(campaign.id)}/content`)
                const data = {
                    title, publishedAt: campaign.send_time, mailchimpCampaignId: campaign.id, _status: 'published',
                    layout: [{ blockType: 'column', columns: [{ width: '1/1', content: [{ blockType: 'HeaderBlock', text: convertContent(content.html, content.plain_text) }] }] }],
                }
                let created
                try {
                    created = await payload.create({ collection: 'pressRelease', data, overrideAccess: true })
                } catch (error) {
                    // A concurrent run may have won the unique constraint, or a hook may have failed after persistence.
                    if ((await existing()).docs.length) { log(`Already persisted: ${campaign.id}`); continue }
                    throw error
                }
                const publicResult = await payload.find({ collection: 'pressRelease', where: { id: { equals: created.id } }, overrideAccess: false, depth: 0 })
                if (!publicResult.docs.some((d: any) => d.id === created.id && d._status === 'published')) throw new Error('Created release is absent from public query')
                log(`Published and publicly queryable: ${campaign.id} -> ${created.id}`)
            } catch (error) { summary.failures++; log(`Failed ${campaign.id}: ${error.message}`) }
        }
        offset += page.campaigns.length
        if (!page.campaigns.length || offset >= page.total_items) break
    }
    log(`${write ? 'Import' : 'Dry run'} summary: ${summary.scanned} scanned, ${summary.qualified} qualify, ${summary.skipped} skipped (${summary.unresolved} unresolved), ${summary.failures} failed`)
    return summary
}
