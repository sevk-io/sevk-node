import { describe, it, expect } from 'bun:test'
import { render } from '../src'
import { renderTemplate, processBlockTag } from '../src/markup/blocks'

// ============================================
// TEMPLATE ENGINE - renderTemplate
// ============================================
describe('renderTemplate', () => {
  // --- Variable injection ---
  it('injects simple variable', () => {
    expect(renderTemplate('{%name%}', { name: 'Sevk' })).toBe('Sevk')
  })

  it('injects number variable', () => {
    expect(renderTemplate('{%size%}px', { size: 24 })).toBe('24px')
  })

  it('returns empty for missing variable', () => {
    expect(renderTemplate('{%missing%}', {})).toBe('')
  })

  it('injects multiple variables', () => {
    expect(renderTemplate('{%a%}-{%b%}', { a: 'X', b: 'Y' })).toBe('X-Y')
  })

  // --- Fallback ---
  it('uses value over fallback', () => {
    expect(renderTemplate('{%color ?? #000%}', { color: '#fff' })).toBe('#fff')
  })

  it('uses fallback when missing', () => {
    expect(renderTemplate('{%color ?? #000%}', {})).toBe('#000')
  })

  it('uses fallback when empty string', () => {
    expect(renderTemplate('{%x ?? default%}', { x: '' })).toBe('default')
  })

  it('uses fallback when null', () => {
    expect(renderTemplate('{%x ?? fallback%}', { x: null })).toBe('fallback')
  })

  it('trims fallback whitespace', () => {
    expect(renderTemplate('{%p ?? 20px 0 %}', {})).toBe('20px 0')
  })

  // --- Each loops ---
  it('iterates array with alias', () => {
    expect(renderTemplate(
      '{%#each items as item%}[{%item.name%}]{%/each%}',
      { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }
    )).toBe('[a][b][c]')
  })

  it('iterates with default this alias', () => {
    expect(renderTemplate(
      '{%#each items%}{%this.x%},{%/each%}',
      { items: [{ x: '1' }, { x: '2' }] }
    )).toBe('1,2,')
  })

  it('returns empty for empty array', () => {
    expect(renderTemplate('{%#each items as i%}{%i.x%}{%/each%}', { items: [] })).toBe('')
  })

  it('returns empty for missing array', () => {
    expect(renderTemplate('{%#each items as i%}{%i.x%}{%/each%}', {})).toBe('')
  })

  it('accesses parent scope in loop', () => {
    expect(renderTemplate(
      '{%#each items as item%}{%item.name%}:{%size%} {%/each%}',
      { items: [{ name: 'a' }, { name: 'b' }], size: '10' }
    )).toBe('a:10 b:10 ')
  })

  it('handles multiple properties on item', () => {
    expect(renderTemplate(
      '{%#each links as link%}<a href="{%link.href%}">{%link.label%}</a>{%/each%}',
      { links: [{ href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' }] }
    )).toBe('<a href="/about">About</a><a href="/contact">Contact</a>')
  })

  // --- If/else ---
  it('renders true branch when truthy', () => {
    expect(renderTemplate('{%#if show%}YES{%/if%}', { show: true })).toBe('YES')
  })

  it('renders empty when falsy and no else', () => {
    expect(renderTemplate('{%#if show%}YES{%/if%}', { show: false })).toBe('')
  })

  it('renders else branch when falsy', () => {
    expect(renderTemplate('{%#if show%}YES{%else%}NO{%/if%}', { show: false })).toBe('NO')
  })

  it('renders true branch over else', () => {
    expect(renderTemplate('{%#if show%}YES{%else%}NO{%/if%}', { show: true })).toBe('YES')
  })

  // --- Truthiness ---
  it('null is falsy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: null })).toBe('F')
  })

  it('undefined/missing is falsy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', {})).toBe('F')
  })

  it('empty string is falsy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: '' })).toBe('F')
  })

  it('zero is falsy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: 0 })).toBe('F')
  })

  it('false is falsy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: false })).toBe('F')
  })

  it('empty array is falsy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: [] })).toBe('F')
  })

  it('non-empty string is truthy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: 'hello' })).toBe('T')
  })

  it('non-empty array is truthy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: [1] })).toBe('T')
  })

  it('positive number is truthy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: 42 })).toBe('T')
  })

  it('object is truthy', () => {
    expect(renderTemplate('{%#if v%}T{%else%}F{%/if%}', { v: {} })).toBe('T')
  })

  // --- Nested ifs ---
  it('nested if - both true', () => {
    expect(renderTemplate(
      '{%#if a%}{%#if b%}AB{%else%}A{%/if%}{%else%}NONE{%/if%}',
      { a: true, b: true }
    )).toBe('AB')
  })

  it('nested if - outer true inner false', () => {
    expect(renderTemplate(
      '{%#if a%}{%#if b%}AB{%else%}A{%/if%}{%else%}NONE{%/if%}',
      { a: true, b: false }
    )).toBe('A')
  })

  it('nested if - outer false', () => {
    expect(renderTemplate(
      '{%#if a%}{%#if b%}AB{%else%}A{%/if%}{%else%}NONE{%/if%}',
      { a: false, b: true }
    )).toBe('NONE')
  })

  // --- {{variable}} preservation ---
  it('preserves double-brace variables', () => {
    expect(renderTemplate('{{email}} {%name%}', { name: 'Test' })).toBe('{{email}} Test')
  })

  it('preserves {{unsubscribeUrl}}', () => {
    expect(renderTemplate('<a href="{{unsubscribeUrl}}">{%text%}</a>', { text: 'Unsub' }))
      .toBe('<a href="{{unsubscribeUrl}}">Unsub</a>')
  })

  // --- Combined ---
  it('if + each + variables', () => {
    expect(renderTemplate(
      '{%#if title%}<h1>{%title%}</h1>{%/if%}{%#each links as l%}<a href="{%l.href%}">{%l.label%}</a>{%/each%}',
      { title: 'Nav', links: [{ href: '/a', label: 'A' }, { href: '/b', label: 'B' }] }
    )).toBe('<h1>Nav</h1><a href="/a">A</a><a href="/b">B</a>')
  })

  it('if false hides entire section including each', () => {
    expect(renderTemplate(
      '{%#if show%}{%#each items as i%}{%i.x%}{%/each%}{%/if%}',
      { show: false, items: [{ x: 'A' }] }
    )).toBe('')
  })
})

// ============================================
// BLOCK TAG PROCESSING - processBlockTag
// ============================================
describe('processBlockTag', () => {
  it('renders inner template with config', () => {
    expect(processBlockTag({ config: "{'name':'Sevk'}" }, 'Hello {%name%}')).toBe('Hello Sevk')
  })

  it('handles single-quoted JSON', () => {
    expect(processBlockTag({ config: "{'a':'1','b':'2'}" }, '{%a%}+{%b%}')).toBe('1+2')
  })

  it('handles empty config', () => {
    expect(processBlockTag({}, '{%x ?? fallback%}')).toBe('fallback')
  })

  it('returns empty for missing template', () => {
    expect(processBlockTag({})).toBe('')
  })

  it('handles &quot; entities in config', () => {
    expect(processBlockTag({ config: '{&quot;name&quot;:&quot;test&quot;}' }, '{%name%}')).toBe('test')
  })

  it('handles &amp; entities in config', () => {
    expect(processBlockTag({ config: '{&quot;x&quot;:&quot;a&amp;b&quot;}' }, '{%x%}')).toBe('a&b')
  })

  it('handles invalid JSON gracefully', () => {
    expect(processBlockTag({ config: 'not json' }, '{%x ?? ok%}')).toBe('ok')
  })
})

// ============================================
// FULL RENDER PIPELINE - block → markup → HTML
// ============================================
describe('Block render pipeline', () => {
  it('block with paragraph produces HTML', () => {
    const html = render(`<block config="{'text':'Hello'}"><paragraph>{%text%}</paragraph></block>`)
    expect(html).toContain('Hello')
    expect(html).toContain('<p')
  })

  it('block with heading renders correctly', () => {
    const html = render(`<block config="{'title':'Welcome'}"><heading level="1">{%title%}</heading></block>`)
    expect(html).toContain('Welcome')
    expect(html).toContain('<h1')
  })

  it('block with button renders link', () => {
    const html = render(`<block config="{'url':'https://sevk.io','label':'Click'}"><button href="{%url%}">{%label%}</button></block>`)
    expect(html).toContain('https://sevk.io')
    expect(html).toContain('Click')
  })

  it('block with image renders img tag', () => {
    const html = render(`<block config="{'src':'logo.png','w':'100'}"><image src="{%src%}" width="{%w%}px" /></block>`)
    expect(html).toContain('logo.png')
    expect(html).toContain('100')
  })

  it('block with section and background-color', () => {
    const html = render(`<block config="{'bg':'#f0f0f0'}"><section background-color="{%bg%}"><paragraph>test</paragraph></section></block>`)
    expect(html).toContain('#f0f0f0')
    expect(html).toContain('test')
  })

  it('block with link renders anchor', () => {
    const html = render(`<block config="{'href':'https://sevk.io','text':'Visit'}"><paragraph><link href="{%href%}">{%text%}</link></paragraph></block>`)
    expect(html).toContain('href="https://sevk.io"')
    expect(html).toContain('Visit')
  })

  it('block with row/column layout', () => {
    const html = render(`<block config="{'left':'L','right':'R'}"><row><column><paragraph>{%left%}</paragraph></column><column><paragraph>{%right%}</paragraph></column></row></block>`)
    expect(html).toContain('L')
    expect(html).toContain('R')
  })

  it('block with each loop produces multiple elements', () => {
    const config = `{'items':[{'name':'One'},{'name':'Two'},{'name':'Three'}]}`
    const html = render(`<block config="${config}">{%#each items as item%}<paragraph>{%item.name%}</paragraph>{%/each%}</block>`)
    expect(html).toContain('One')
    expect(html).toContain('Two')
    expect(html).toContain('Three')
  })

  it('block with if conditional hides content', () => {
    const html = render(`<block config="{'show':false}">{%#if show%}<paragraph>hidden</paragraph>{%/if%}<paragraph>visible</paragraph></block>`)
    expect(html).not.toContain('hidden')
    expect(html).toContain('visible')
  })

  it('block with if/else shows correct branch', () => {
    const html = render(`<block config="{'mode':'dark'}">{%#if mode%}<section background-color="#000"><paragraph color="#fff">Dark</paragraph></section>{%else%}<section><paragraph>Light</paragraph></section>{%/if%}</block>`)
    expect(html).toContain('#000')
    expect(html).toContain('Dark')
    expect(html).not.toContain('Light')
  })

  it('preserves {{variables}} through full pipeline', () => {
    const html = render(`<block config="{'text':'Unsub'}"><paragraph><link href="{{unsubscribeUrl}}">{%text%}</link></paragraph></block>`)
    expect(html).toContain('{{unsubscribeUrl}}')
    expect(html).toContain('Unsub')
  })

  it('social links block template end-to-end', () => {
    const config = `{'title':'Follow us','titleColor':'#666','links':[{'href':'https://twitter.com','iconSrc':'https://cdn.sevk.io/icons/x-twitter.png','platform':'x-twitter'}],'iconSize':32,'alignment':'center'}`
    const template = `<section text-align="{%alignment ?? center%}">{%#if title%}<paragraph color="{%titleColor ?? #666%}">{%title%}</paragraph>{%/if%}{%#each links as link%}<link href="{%link.href%}"><image src="{%link.iconSrc%}" width="{%iconSize%}px" alt="{%link.platform%}" /></link>{%/each%}</section>`
    const html = render(`<block config="${config}">${template}</block>`)
    expect(html).toContain('Follow us')
    expect(html).toContain('https://twitter.com')
    expect(html).toContain('x-twitter.png')
    expect(html).toContain('32')
  })

  it('header block template end-to-end centered', () => {
    const config = `{'centered':true,'title':'Brand','titleColor':'#1a1a1a','links':[{'href':'/about','label':'About'}],'linkColor':'#666'}`
    const template = `{%#if centered%}<section text-align="center">{%#if title%}<heading level="3" color="{%titleColor%}">{%title%}</heading>{%/if%}{%#if links%}<section>{%#each links as link%}<link href="{%link.href%}" color="{%linkColor%}">{%link.label%}</link>{%/each%}</section>{%/if%}</section>{%else%}<section><paragraph>side</paragraph></section>{%/if%}`
    const html = render(`<block config="${config}">${template}</block>`)
    expect(html).toContain('Brand')
    expect(html).toContain('About')
    expect(html).toContain('center')
    expect(html).not.toContain('side')
  })

  it('unsubscribe footer block template end-to-end', () => {
    const config = `{'text':'You subscribed.','linkText':'Unsub','textColor':'#999','linkColor':'#999','backgroundColor':'#f8f9fa'}`
    const template = `<section background-color="{%backgroundColor ?? #f8f9fa%}"><paragraph color="{%textColor%}">{%text%}</paragraph><paragraph><link href="{{unsubscribeUrl}}" color="{%linkColor%}">{%linkText%}</link></paragraph></section>`
    const html = render(`<block config="${config}">${template}</block>`)
    expect(html).toContain('You subscribed.')
    expect(html).toContain('Unsub')
    expect(html).toContain('{{unsubscribeUrl}}')
    expect(html).toContain('#f8f9fa')
  })

  it('multiple blocks in same document', () => {
    const html = render(`
      <block config="{'title':'Header'}"><heading level="1">{%title%}</heading></block>
      <paragraph>Content between blocks</paragraph>
      <block config="{'footer':'Footer text'}"><paragraph>{%footer%}</paragraph></block>
    `)
    expect(html).toContain('Header')
    expect(html).toContain('Content between blocks')
    expect(html).toContain('Footer text')
  })

  it('block with fallback values when config is empty', () => {
    const html = render(`<block config="{}"><section padding="{%padding ?? 20px%}" background-color="{%bg ?? #fff%}"><paragraph color="{%color ?? #333%}">text</paragraph></section></block>`)
    expect(html).toContain('20px')
    expect(html).toContain('#fff')
    expect(html).toContain('#333')
  })
})
