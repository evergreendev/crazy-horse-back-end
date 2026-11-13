import { strict as assert } from 'assert'
import { importCampaigns, qualifies } from './import'
import { convertContent } from './content'
import { listSegments } from './segments'

async function test() {
    const segmentPaths: string[] = []
    assert.deepEqual(await listSegments(async path => {
        segmentPaths.push(path)
        return { segments: path.endsWith('offset=0') ? [{ id: 42, name: 'Press Release', member_count: 10 }] : [{ id: 43, name: 'News' }], total_items: 2 }
    }, 'audience/id'), [{ id: 42, name: 'Press Release' }, { id: 43, name: 'News' }])
    assert.deepEqual(segmentPaths, ['/lists/audience%2Fid/segments?count=100&offset=0', '/lists/audience%2Fid/segments?count=100&offset=1'])
    const tagPaths: string[] = []
    assert.deepEqual(await listSegments(async path => {
        tagPaths.push(path)
        return { segments: [{ id: tagPaths.length, name: `Tag ${tagPaths.length}` }], total_items: 2 }
    }, 'audience/id', 'static'), [{ id: 1, name: 'Tag 1' }, { id: 2, name: 'Tag 2' }])
    assert.deepEqual(tagPaths, ['/lists/audience%2Fid/segments?count=100&offset=0&type=static', '/lists/audience%2Fid/segments?count=100&offset=1&type=static'])
    assert.deepEqual(await listSegments(async () => ({ segments: [], total_items: 0 }), 'audience'), [])
    await assert.rejects(() => listSegments(async () => ({}), 'audience'), /Invalid Mailchimp segments response/)
    const campaign = { id: 'campaign', status: 'sent', send_time: '2026-01-02T12:00:00Z', settings: { subject_line: 'Release title' }, recipients: { list_id: 'audience', segment_opts: { match: 'all', conditions: [
        { field: 'static_segment', op: 'static_is', value: 17 },
        { field: 'static_segment', op: 'static_is', value: '99' },
    ] } } }
    assert(qualifies(campaign, '17'))
    assert(!qualifies({ recipients: { segment_opts: { conditions: [{ field: 'static_segment', op: 'static_not', value: '17' }] } } }, '17'))
    const html = '<div class="preheader">Preview</div><h2>Announcement</h2><p>CRAZY HORSE, S.D. — An important announcement from the Memorial today.</p><ul><li>First item</li></ul><p><a href="https://example.com/story?utm_source=email">Read more</a></p><footer>Unsubscribe</footer><img src="pixel.gif">'
    const lexical = convertContent(html)
    assert.equal(lexical.root.children[0].type, 'heading')
    assert.equal(lexical.root.children[2].type, 'list')
    assert(!JSON.stringify(lexical).includes('utm_source'))
    assert(!JSON.stringify(lexical).includes('Unsubscribe'))
    assert.throws(() => convertContent('<p>Unsubscribe</p>'))
    const records: any[] = []
    const payload = {
        find: async ({ overrideAccess }: any) => ({ docs: records }),
        create: async ({ data }: any) => { const record = { ...data, id: 1 }; records.push(record); return record },
    }
    let details = 0
    const api = async (path: string) => {
        if (path.includes('tag-search')) return { tags: [{ name: 'Press Releases', id: 99 }, { name: 'Press Release', id: 17 }] }
        if (path.includes('/content')) return { html }
        if (path.startsWith('/campaigns?')) return { campaigns: [{ ...campaign, recipients: { list_id: 'audience' } }], total_items: 1 }
        details++; return campaign
    }
    const options = { api, audience: 'audience', since: '2026-01-01', payload, log: () => {} }
    await importCampaigns(options)
    assert.equal(records.length, 0)
    await importCampaigns({ ...options, write: true })
    records[0].title = 'Editorial change'
    await importCampaigns({ ...options, write: true })
    assert.equal(records.length, 1)
    assert.equal(records[0]._status, 'published')
    assert.equal(records[0].title, 'Editorial change')
    assert.equal(records[0].publishedAt, campaign.send_time)
    assert.equal(details, 3)
    // Production response shapes: opaque advanced segments and an unsegmented send.
    // A misleading display label must never substitute for a positive tag condition.
    const fixtures = [
        { ...campaign, id: 'advanced', recipients: { list_id: 'audience', segment_opts: { match: 'all' }, segment_text: 'Matches a custom advanced segment' } },
        { ...campaign, id: 'whole-audience', recipients: { list_id: 'audience', segment_text: '' } },
        { ...campaign, id: 'unknown', recipients: { list_id: 'audience', segment_opts: { saved_segment_id: 17 }, segment_text: 'Press Release' } },
        { ...campaign, id: 'exclusion', recipients: { list_id: 'audience', segment_opts: { match: 'any', conditions: [{ field: 'static_segment', op: 'static_not', value: '17' }] } } },
        { ...campaign, id: 'empty', recipients: { list_id: 'audience', segment_opts: { conditions: [] } } },
        campaign,
    ]
    const logs: string[] = []
    let contentFetches = 0
    const paginatedAPI = async (path: string) => {
        if (path.startsWith('/campaigns?')) {
            const offset = Number(new URL(path, 'https://example.com').searchParams.get('offset'))
            return { campaigns: fixtures.slice(offset, offset + 2), total_items: fixtures.length }
        }
        if (path.includes('/content')) { contentFetches++; throw new Error('Dry-run must not fetch content') }
        return fixtures.find(c => path === `/campaigns/${c.id}`)
    }
    const summary = await importCampaigns({ ...options, api: paginatedAPI, tag: '17', log: (line: string) => logs.push(line) })
    assert.deepEqual(summary, { scanned: 6, qualified: 1, skipped: 5, unresolved: 2, failures: 0 })
    assert(logs.some(line => line.includes('Skipped unresolved: advanced')))
    assert(logs.some(line => line.includes('whole-audience (no recipient segment conditions)')))
    assert.equal(contentFetches, 0)
    const segmentCampaign = { ...campaign, id: 'saved-segment', recipients: { list_id: 'audience', segment_opts: { saved_segment_id: 42 } } }
    assert(qualifies(segmentCampaign, undefined, '42'))
    assert(!qualifies(segmentCampaign, '42'))
    assert(!qualifies(segmentCampaign, undefined, '17'))
    assert(!qualifies(campaign, undefined, '17'))
    assert(qualifies(campaign, '17', '42'))
    assert(qualifies(segmentCampaign, '17', '42'))
    for (const detailOnly of [false, true]) {
        let segmentDetails = 0
        const segmentSummary = await importCampaigns({ ...options, segment: '42', api: async (path: string) => {
            if (path.startsWith('/campaigns?')) return { campaigns: [detailOnly ? { ...segmentCampaign, recipients: { list_id: 'audience' } } : segmentCampaign], total_items: 1 }
            assert.equal(path, '/campaigns/saved-segment') // No default tag lookup or content fetch.
            segmentDetails++
            return segmentCampaign
        } })
        assert.equal(segmentSummary.qualified, 1)
        assert.equal(segmentSummary.unresolved, 0)
        assert.equal(segmentSummary.failures, 0)
        assert.equal(segmentDetails, detailOnly ? 1 : 0)
    }
    const failedSummary = await importCampaigns({ ...options, tag: '17', api: async (path: string) => {
        if (path.startsWith('/campaigns?')) return { campaigns: [fixtures[0]], total_items: 1 }
        throw new Error('Mailchimp request failed (429)')
    } })
    assert.equal(failedSummary.failures, 1)
    assert.equal(failedSummary.unresolved, 0)
    console.log('Mailchimp importer checks passed (mock Local API; live verification still required).')
}
test().catch(error => { console.error(error); process.exitCode = 1 })
