export async function listSegments(api: (path: string) => Promise<any>, audience: string, type?: 'static') {
    const segments: { id: number; name: string }[] = []
    let offset = 0
    while (true) {
        const page = await api(`/lists/${encodeURIComponent(audience)}/segments?count=100&offset=${offset}${type ? `&type=${type}` : ''}`)
        if (!Array.isArray(page.segments)) throw new Error('Invalid Mailchimp segments response')
        segments.push(...page.segments.map(({ id, name }: any) => ({ id, name })))
        offset += page.segments.length
        if (!page.segments.length || offset >= page.total_items) return segments
    }
}
