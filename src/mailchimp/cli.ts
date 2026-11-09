import 'dotenv/config'
import { importCampaigns } from './import'

async function main() {
    const args = process.argv.slice(2)
    if (args.some(a => !['--write', '--dry-run'].includes(a)) || (args.includes('--write') && args.includes('--dry-run'))) throw new Error('Use --dry-run (default) or --write')
    const token = process.env.MAILCHIMP_API_KEY
    const audience = process.env.MAILCHIMP_AUDIENCE_ID
    const since = process.env.MAILCHIMP_IMPORT_START_DATE
    const dc = token?.split('-').pop()
    if (!token || !audience || !since || !/^us\d+$/.test(dc)) throw new Error('Set MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID and MAILCHIMP_IMPORT_START_DATE')
    const api = async (path: string) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 30000)
        try {
            const response = await fetch(`https://${dc}.api.mailchimp.com/3.0${path}`, { headers: { Authorization: `Basic ${Buffer.from(`import:${token}`).toString('base64')}` }, signal: controller.signal })
            if (!response.ok) throw new Error(`Mailchimp request failed (${response.status})`)
            return response.json()
        } finally { clearTimeout(timer) }
    }
    const write = args.includes('--write')
    let payload
    if (write) {
        payload = (await import('payload')).default
        await payload.init({ secret: process.env.PAYLOAD_SECRET, local: true })
    }
    const result = await importCampaigns({ api, audience, since, tag: process.env.MAILCHIMP_PRESS_RELEASE_TAG_ID, write, payload })
    process.exit(result.failures ? 1 : 0)
}
main().catch(error => { console.error(error.message); process.exit(1) })
