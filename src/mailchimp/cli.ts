import 'dotenv/config'
import { importCampaigns } from './import'
import { listSegments } from './segments'

async function main() {
    const args = process.argv.slice(2)
    const listing = args.length === 1 && ['--list-segments', '--list-tags'].includes(args[0])
    const inspecting = args.length === 2 && args[0] === '--inspect-campaign' && Boolean(args[1].trim()) && !args[1].startsWith('--')
    if (!listing && !inspecting && (args.some(a => !['--write', '--dry-run'].includes(a)) || (args.includes('--write') && args.includes('--dry-run')))) throw new Error('Use --dry-run (default), --write, --list-segments, --list-tags, or --inspect-campaign CAMPAIGN_ID')
    const token = process.env.MAILCHIMP_API_KEY
    const audience = process.env.MAILCHIMP_AUDIENCE_ID
    const since = process.env.MAILCHIMP_IMPORT_START_DATE
    const dc = token?.split('-').pop()
    if (!token || !/^us\d+$/.test(dc)) throw new Error('Set MAILCHIMP_API_KEY (including its -usNN suffix)')
    if (!inspecting && !audience) throw new Error('Set MAILCHIMP_AUDIENCE_ID')
    if (!listing && !inspecting && !since) throw new Error('Set MAILCHIMP_IMPORT_START_DATE')
    const api = async (path: string) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 30000)
        try {
            const response = await fetch(`https://${dc}.api.mailchimp.com/3.0${path}`, { headers: { Authorization: `Basic ${Buffer.from(`import:${token}`).toString('base64')}` }, signal: controller.signal })
            if (!response.ok) throw new Error(`Mailchimp request failed (${response.status})`)
            return response.json()
        } finally { clearTimeout(timer) }
    }
    if (inspecting) {
        console.log(JSON.stringify(await api(`/campaigns/${encodeURIComponent(args[1].trim())}`), null, 2))
        return
    }
    if (listing) {
        const tags = args[0] === '--list-tags'
        const segments = await listSegments(api, audience, tags ? 'static' : undefined)
        if (!segments.length) console.log(`No ${tags ? 'tags' : 'segments'} found for this audience.`)
        else console.table(segments)
        return
    }
    const write = args.includes('--write')
    let payload
    if (write) {
        payload = (await import('payload')).default
        await payload.init({ secret: process.env.PAYLOAD_SECRET, local: true })
    }
    const result = await importCampaigns({ api, audience, since, tag: process.env.MAILCHIMP_PRESS_RELEASE_TAG_ID, segment: process.env.MAILCHIMP_PRESS_RELEASE_SEGMENT_ID, write, payload })
    process.exit(result.failures ? 1 : 0)
}
main().catch(error => { console.error(error.message); process.exit(1) })
