import { parseDocument } from 'htmlparser2'

const element = (type: string, children: any[], extra = {}) => ({
    type, version: 1, direction: null, format: '', indent: 0, children, ...extra,
})
const text = (value: string, format = 0) => ({ type: 'text', version: 1, text: value, format, detail: 0, mode: 'normal', style: '' })
const chrome = /unsubscribe|update (?:your )?preferences|view (?:this email )?in (?:your )?browser|copyright|mailing address|why did i get this/i
const recipient = /\*\||list-manage\.com|\/unsubscribe|\/profile|\/track\/|mailchi\.mp|mc_eid/i

// Images are deliberately omitted: remote email images must never become hotlinked CMS content.
export function convertContent(html: string, plain = ''): any {
    const doc: any = parseDocument(html || '')
    const inline = (nodes: any[], format = 0): any[] => nodes.flatMap(n => {
        if (n.type === 'text') return [text(n.data.replace(/\s+/g, ' '), format)]
        if (['script', 'style', 'img', 'head'].includes(n.name)) return []
        if (n.name === 'br') return [{ type: 'linebreak', version: 1 }]
        const children = inline(n.children || [], format | ({ strong: 1, b: 1, em: 2, i: 2, u: 8 }[n.name] || 0))
        if (n.name === 'a') {
            const href = n.attribs?.href || ''
            if (recipient.test(href)) return []
            try {
                const url = new URL(href)
                if (['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) {
                    Array.from(url.searchParams.keys()).forEach(k => { if (/^(utm_|mc_)/i.test(k)) url.searchParams.delete(k) })
                    return [element('link', children, { fields: { linkType: 'custom', url: url.toString(), newTab: false, doc: null } })]
                }
            } catch (_) { /* Keep label of non-editorial links. */ }
        }
        return children
    })
    const visible = (nodes: any[]): string => nodes.map(n => n.text || visible(n.children || [])).join('')
    const walk = (nodes: any[]): any[] => nodes.flatMap(n => {
        if (['script', 'style', 'head', 'img', 'footer', 'nav'].includes(n.name)) return []
        if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(n.attribs?.style || '') || /footer|preheader|previewText/i.test((n.attribs?.id || '') + ' ' + (n.attribs?.class || ''))) return []
        if (['ul', 'ol'].includes(n.name)) {
            const children = (n.children || []).filter(c => c.name === 'li').map((c, i) => element('listitem', inline(c.children), { value: i + 1 })).filter(c => visible(c.children).trim() && !chrome.test(visible(c.children)))
            return children.length ? [element('list', children, { listType: n.name === 'ol' ? 'number' : 'bullet', start: 1, tag: n.name })] : []
        }
        if (/^h[1-6]$/.test(n.name) || n.name === 'p' || (['td', 'div'].includes(n.name) && !(n.children || []).some(c => /^(div|p|table|h[1-6]|ul|ol)$/.test(c.name)))) {
            const children = inline(n.children || [])
            const value = visible(children).trim()
            return value && !chrome.test(value) ? [element(n.name === 'p' || !/^h/.test(n.name) ? 'paragraph' : 'heading', children, /^h/.test(n.name) ? { tag: n.name } : {})] : []
        }
        return walk(n.children || [])
    })
    let children = walk(doc.children)
    if (!html && plain) children = plain.split(/\n\s*\n/).filter(p => p.trim() && !chrome.test(p) && !recipient.test(p)).map(p => element('paragraph', [text(p.trim())]))
    if (visible(children).replace(/\s/g, '').length < 40) throw new Error('No usable release body; campaign remains eligible for retry')
    return { root: element('root', children) }
}
