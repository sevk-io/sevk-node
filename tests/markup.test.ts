import { describe, it, expect } from 'bun:test'
import { render } from '../src'
import { parseEmailHTML } from '../src/markup'

// Helper: extract body content from full HTML
function renderBody(markup: string): string {
  const html = render(markup)
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/)
  return match ? match[1].trim() : html
}

// ============================================
// DOCUMENT STRUCTURE
// ============================================
describe('Document structure', () => {
  it('produces valid HTML document', () => {
    const html = render('<paragraph>Hello</paragraph>')
    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('<html')
    expect(html).toContain('<head>')
    expect(html).toContain('<body')
    expect(html).toContain('</html>')
  })

  it('includes charset meta', () => {
    const html = render('<paragraph>test</paragraph>')
    expect(html).toContain('charset=UTF-8')
  })

  it('includes viewport meta', () => {
    const html = render('<paragraph>test</paragraph>')
    expect(html).toContain('viewport')
  })

  it('includes email-safe base styles', () => {
    const html = render('<paragraph>test</paragraph>')
    expect(html).toContain('border-collapse')
  })

  it('includes MSO conditional comments', () => {
    const html = render('<paragraph>test</paragraph>')
    expect(html).toContain('<!--[if mso]>')
  })

  it('wraps content in role=article div', () => {
    const body = renderBody('<paragraph>test</paragraph>')
    expect(body).toContain('role="article"')
  })

  it('empty input produces valid HTML', () => {
    const html = render('')
    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('</html>')
  })
})

// ============================================
// PARAGRAPH
// ============================================
describe('Paragraph', () => {
  it('renders basic paragraph', () => {
    const body = renderBody('<paragraph>Hello world</paragraph>')
    expect(body).toContain('Hello world')
    expect(body).toContain('<p')
  })

  it('with color', () => {
    const body = renderBody('<paragraph color="#ff0000">Red</paragraph>')
    expect(body).toContain('#ff0000')
    expect(body).toContain('Red')
  })

  it('with font-size', () => {
    const body = renderBody('<paragraph font-size="18px">Big</paragraph>')
    expect(body).toContain('18px')
  })

  it('with text-align', () => {
    const body = renderBody('<paragraph text-align="center">Centered</paragraph>')
    expect(body).toContain('text-align:center')
  })

  it('with padding', () => {
    const body = renderBody('<paragraph padding="10px 20px">Padded</paragraph>')
    expect(body).toContain('10px 20px')
  })

  it('with background-color', () => {
    const body = renderBody('<paragraph background-color="#eee">BG</paragraph>')
    expect(body).toContain('#eee')
  })

  it('with multiple attributes', () => {
    const body = renderBody('<paragraph color="#333" font-size="14px" text-align="left">Multi</paragraph>')
    expect(body).toContain('#333')
    expect(body).toContain('14px')
    expect(body).toContain('Multi')
  })
})

// ============================================
// HEADING
// ============================================
describe('Heading', () => {
  it('renders h1', () => {
    const body = renderBody('<heading level="1">Title</heading>')
    expect(body).toContain('<h1')
    expect(body).toContain('Title')
  })

  it('renders h2', () => {
    const body = renderBody('<heading level="2">Sub</heading>')
    expect(body).toContain('<h2')
  })

  it('renders h3', () => {
    const body = renderBody('<heading level="3">Small</heading>')
    expect(body).toContain('<h3')
  })

  it('with color', () => {
    const body = renderBody('<heading level="1" color="#5227FF">Purple</heading>')
    expect(body).toContain('#5227FF')
  })

  it('with font-size', () => {
    const body = renderBody('<heading level="2" font-size="28px">Sized</heading>')
    expect(body).toContain('28px')
  })

  it('with text-align', () => {
    const body = renderBody('<heading level="1" text-align="center">Centered</heading>')
    expect(body).toContain('text-align:center')
  })
})

// ============================================
// BUTTON
// ============================================
describe('Button', () => {
  it('renders with href', () => {
    const body = renderBody('<button href="https://sevk.io">Click</button>')
    expect(body).toContain('https://sevk.io')
    expect(body).toContain('Click')
    expect(body).toContain('<a')
  })

  it('with background-color', () => {
    const body = renderBody('<button href="#" background-color="#5227FF">Go</button>')
    expect(body).toContain('#5227FF')
  })

  it('with text color', () => {
    const body = renderBody('<button href="#" color="#ffffff">Go</button>')
    expect(body).toContain('#ffffff')
  })

  it('with border-radius', () => {
    const body = renderBody('<button href="#" border-radius="8px">Go</button>')
    expect(body).toContain('8px')
  })

  it('with padding', () => {
    const body = renderBody('<button href="#" padding="12px 24px">Go</button>')
    expect(body).toContain('12px 24px')
  })

  it('with all styles', () => {
    const body = renderBody('<button href="https://sevk.io" background-color="#5227FF" color="#fff" padding="15px 30px" border-radius="8px">CTA</button>')
    expect(body).toContain('https://sevk.io')
    expect(body).toContain('#5227FF')
    expect(body).toContain('#fff')
    expect(body).toContain('CTA')
  })
})

// ============================================
// IMAGE
// ============================================
describe('Image', () => {
  it('renders basic image', () => {
    const body = renderBody('<image src="https://example.com/img.png" />')
    expect(body).toContain('<img')
    expect(body).toContain('https://example.com/img.png')
  })

  it('with alt text', () => {
    const body = renderBody('<image src="img.png" alt="Logo" />')
    expect(body).toContain('alt="Logo"')
  })

  it('with width', () => {
    const body = renderBody('<image src="img.png" width="200px" />')
    expect(body).toContain('200')
  })

  it('with border-radius', () => {
    const body = renderBody('<image src="img.png" border-radius="8px" />')
    expect(body).toContain('8px')
  })

  it('self-closing tag', () => {
    const body = renderBody('<image src="test.png" />')
    expect(body).toContain('<img')
    expect(body).toContain('test.png')
  })
})

// ============================================
// LINK
// ============================================
describe('Link', () => {
  it('renders basic link', () => {
    const body = renderBody('<paragraph><link href="https://sevk.io">Visit</link></paragraph>')
    expect(body).toContain('href="https://sevk.io"')
    expect(body).toContain('Visit')
    expect(body).toContain('<a')
  })

  it('with color', () => {
    const body = renderBody('<paragraph><link href="#" color="#5227FF">Link</link></paragraph>')
    expect(body).toContain('#5227FF')
  })

  it('opens in new tab', () => {
    const body = renderBody('<paragraph><link href="https://sevk.io">Go</link></paragraph>')
    expect(body).toContain('target="_blank"')
  })
})

// ============================================
// SECTION
// ============================================
describe('Section', () => {
  it('renders section with table', () => {
    const body = renderBody('<section><paragraph>Content</paragraph></section>')
    expect(body).toContain('Content')
    expect(body).toContain('<table')
  })

  it('with background-color', () => {
    const body = renderBody('<section background-color="#f0f0f0"><paragraph>BG</paragraph></section>')
    expect(body).toContain('#f0f0f0')
  })

  it('with padding', () => {
    const body = renderBody('<section padding="40px 0"><paragraph>Padded</paragraph></section>')
    expect(body).toContain('40px')
  })

  it('with text-align', () => {
    const body = renderBody('<section text-align="center"><paragraph>C</paragraph></section>')
    expect(body).toContain('text-align:center')
  })

  it('with border-radius', () => {
    const body = renderBody('<section border-radius="12px"><paragraph>R</paragraph></section>')
    expect(body).toContain('12px')
  })
})

// ============================================
// CONTAINER
// ============================================
describe('Container', () => {
  it('renders with max-width', () => {
    const body = renderBody('<container max-width="600px"><paragraph>Content</paragraph></container>')
    expect(body).toContain('600px')
    expect(body).toContain('Content')
  })

  it('with padding', () => {
    const body = renderBody('<container max-width="600px" padding="20px"><paragraph>P</paragraph></container>')
    expect(body).toContain('20px')
  })

  it('with background-color', () => {
    const body = renderBody('<container max-width="600px" background-color="#fff"><paragraph>C</paragraph></container>')
    expect(body).toContain('#fff')
  })
})

// ============================================
// ROW & COLUMN
// ============================================
describe('Row & Column', () => {
  it('renders row with columns', () => {
    const body = renderBody('<row><column width="50%"><paragraph>Left</paragraph></column><column width="50%"><paragraph>Right</paragraph></column></row>')
    expect(body).toContain('Left')
    expect(body).toContain('Right')
    expect(body).toContain('table')
  })

  it('column respects width', () => {
    const body = renderBody('<row><column width="33%"><paragraph>A</paragraph></column><column width="67%"><paragraph>B</paragraph></column></row>')
    expect(body).toContain('33%')
    expect(body).toContain('67%')
  })

  it('column with background-color', () => {
    const body = renderBody('<row><column background-color="#e3f2fd"><paragraph>Col</paragraph></column></row>')
    expect(body).toContain('#e3f2fd')
  })

  it('column with border-radius', () => {
    const body = renderBody('<row><column border-radius="8px"><paragraph>Col</paragraph></column></row>')
    expect(body).toContain('8px')
  })

  it('three columns', () => {
    const body = renderBody('<row><column width="33%"><paragraph>A</paragraph></column><column width="33%"><paragraph>B</paragraph></column><column width="33%"><paragraph>C</paragraph></column></row>')
    expect(body).toContain('A')
    expect(body).toContain('B')
    expect(body).toContain('C')
  })
})

// ============================================
// DIVIDER
// ============================================
describe('Divider', () => {
  it('renders hr', () => {
    const body = renderBody('<hr />')
    expect(body).toContain('<hr')
  })

  it('with width', () => {
    const body = renderBody('<hr width="80%" />')
    expect(body).toContain('80%')
  })

  it('with background-color', () => {
    const body = renderBody('<hr background-color="#ccc" />')
    expect(body).toContain('#ccc')
  })

  it('with height', () => {
    const body = renderBody('<hr height="2px" />')
    expect(body).toContain('2px')
  })
})

// ============================================
// LIST
// ============================================
describe('List', () => {
  it('renders unordered list', () => {
    const body = renderBody('<list type="unordered"><li><paragraph>Item 1</paragraph></li><li><paragraph>Item 2</paragraph></li></list>')
    expect(body).toContain('<ul')
    expect(body).toContain('Item 1')
    expect(body).toContain('Item 2')
  })

  it('renders ordered list', () => {
    const body = renderBody('<list type="ordered"><li><paragraph>First</paragraph></li></list>')
    expect(body).toContain('<ol')
    expect(body).toContain('First')
  })

  it('renders list items with li tags', () => {
    const body = renderBody('<list type="unordered"><li><paragraph>A</paragraph></li></list>')
    expect(body).toContain('<li')
  })

  it('multiple items', () => {
    const body = renderBody('<list type="unordered"><li><paragraph>One</paragraph></li><li><paragraph>Two</paragraph></li><li><paragraph>Three</paragraph></li></list>')
    expect(body).toContain('One')
    expect(body).toContain('Two')
    expect(body).toContain('Three')
  })
})

// ============================================
// CODE BLOCK
// ============================================
describe('Code Block', () => {
  it('renders with pre and code tags', () => {
    const body = renderBody('<codeblock language="javascript">const x = 1;</codeblock>')
    expect(body).toContain('<pre')
    expect(body).toContain('<code')
  })

  it('applies syntax highlighting', () => {
    const body = renderBody('<codeblock language="javascript">function hello() {}</codeblock>')
    expect(body).toContain('<span')
  })

  it('renders with theme background', () => {
    const body = renderBody('<codeblock language="javascript" theme="oneDark">const x = 1;</codeblock>')
    expect(body).toContain('background')
  })

  it('renders typescript', () => {
    const body = renderBody('<codeblock language="typescript">const x: number = 1;</codeblock>')
    expect(body).toContain('<pre')
  })

  it('renders python', () => {
    const body = renderBody('<codeblock language="python">def hello(): pass</codeblock>')
    expect(body).toContain('<pre')
  })
})

// ============================================
// INLINE FORMATTING
// ============================================
describe('Inline formatting', () => {
  it('preserves bold', () => {
    const body = renderBody('<paragraph><strong>Bold</strong> text</paragraph>')
    expect(body).toContain('<strong>Bold</strong>')
  })

  it('preserves italic', () => {
    const body = renderBody('<paragraph><em>Italic</em> text</paragraph>')
    expect(body).toContain('<em>Italic</em>')
  })

  it('preserves inline styles', () => {
    const body = renderBody('<paragraph>Normal <span style="color:red">red</span> text</paragraph>')
    expect(body).toContain('color:red')
  })
})

// ============================================
// NESTED STRUCTURES
// ============================================
describe('Nested structures', () => {
  it('section > container > paragraph', () => {
    const body = renderBody('<section><container max-width="600px"><paragraph>Nested</paragraph></container></section>')
    expect(body).toContain('Nested')
    expect(body).toContain('600px')
  })

  it('section > container > row > columns', () => {
    const body = renderBody(`
      <section padding="20px 0">
        <container max-width="600px">
          <row>
            <column width="50%"><paragraph>Left</paragraph></column>
            <column width="50%"><paragraph>Right</paragraph></column>
          </row>
        </container>
      </section>
    `)
    expect(body).toContain('Left')
    expect(body).toContain('Right')
    expect(body).toContain('600px')
  })

  it('heading + paragraph + button in section', () => {
    const body = renderBody(`
      <section padding="20px">
        <heading level="1" color="#333">Welcome</heading>
        <paragraph color="#666">Description</paragraph>
        <button href="https://sevk.io" background-color="#5227FF" color="#fff">Get Started</button>
      </section>
    `)
    expect(body).toContain('Welcome')
    expect(body).toContain('Description')
    expect(body).toContain('Get Started')
    expect(body).toContain('#5227FF')
  })

  it('multiple sections with different backgrounds', () => {
    const body = renderBody(`
      <section background-color="#fff"><paragraph>Section 1</paragraph></section>
      <section background-color="#f0f0f0"><paragraph>Section 2</paragraph></section>
      <section background-color="#333"><paragraph color="#fff">Section 3</paragraph></section>
    `)
    expect(body).toContain('Section 1')
    expect(body).toContain('Section 2')
    expect(body).toContain('Section 3')
    expect(body).toContain('#f0f0f0')
  })

  it('deeply nested: section > container > section > row > column > paragraph', () => {
    const body = renderBody(`
      <section>
        <container max-width="600px">
          <section padding="20px">
            <row>
              <column width="100%">
                <paragraph>Deep</paragraph>
              </column>
            </row>
          </section>
        </container>
      </section>
    `)
    expect(body).toContain('Deep')
    expect(body).toContain('600px')
  })
})

// ============================================
// EMAIL HEAD SETTINGS
// ============================================
describe('Email head settings', () => {
  it('parses title', () => {
    const parsed = parseEmailHTML('<email><head><title>My Email</title></head><body></body></email>')
    expect(parsed.headSettings?.title).toBe('My Email')
  })

  it('parses preview text', () => {
    const parsed = parseEmailHTML('<email><head><preview>Preview here</preview></head><body></body></email>')
    expect(parsed.headSettings?.previewText).toBe('Preview here')
  })

  it('parses custom styles', () => {
    const parsed = parseEmailHTML('<email><head><style>.custom { color: red; }</style></head><body></body></email>')
    expect(parsed.headSettings?.styles).toContain('.custom')
  })

  it('parses body content', () => {
    const parsed = parseEmailHTML('<email><head></head><body><paragraph>Content</paragraph></body></email>')
    expect(parsed.body).toContain('<paragraph>Content</paragraph>')
  })

  it('renders title in output', () => {
    const html = render('<email><head><title>My Email</title></head><body><paragraph>Hi</paragraph></body></email>')
    expect(html).toContain('My Email')
  })

  it('renders preview text in output', () => {
    const html = render('<email><head><preview>Preview text</preview></head><body><paragraph>Hi</paragraph></body></email>')
    expect(html).toContain('Preview text')
  })

  it('renders custom styles in output', () => {
    const html = render('<email><head><style>.test { color: blue; }</style></head><body><paragraph>Hi</paragraph></body></email>')
    expect(html).toContain('.test { color: blue; }')
  })

  it('handles <mail> tag same as <email>', () => {
    const parsed = parseEmailHTML('<mail><head><title>Test</title></head><body></body></mail>')
    expect(parsed.headSettings?.title).toBe('Test')
  })

  it('parses font tags', () => {
    const parsed = parseEmailHTML('<email><head><font name="Roboto" url="https://fonts.googleapis.com/css?family=Roboto" /></head><body></body></email>')
    expect(parsed.headSettings?.fonts?.length).toBeGreaterThan(0)
    expect(parsed.headSettings?.fonts?.[0]?.name).toBe('Roboto')
  })

  it('complex head with all settings', () => {
    const html = render(`<email>
      <head>
        <title>Complex Email</title>
        <preview>This is a preview</preview>
        <style>.test { color: blue; }</style>
      </head>
      <body><paragraph>Content</paragraph></body>
    </email>`)
    expect(html).toContain('Complex Email')
    expect(html).toContain('This is a preview')
    expect(html).toContain('.test { color: blue; }')
    expect(html).toContain('Content')
  })
})

// ============================================
// BLOCK TAG (full pipeline)
// ============================================
describe('Block tag', () => {
  it('expands block with variable', () => {
    const body = renderBody(`<block config="{'text':'Hello'}"><paragraph>{%text%}</paragraph></block>`)
    expect(body).toContain('Hello')
  })

  it('expands block with each loop', () => {
    const body = renderBody(`<block config="{'items':[{'name':'A'},{'name':'B'}]}">{%#each items as item%}<paragraph>{%item.name%}</paragraph>{%/each%}</block>`)
    expect(body).toContain('A')
    expect(body).toContain('B')
  })

  it('expands block with if/else', () => {
    const body = renderBody(`<block config="{'show':true}">{%#if show%}<paragraph>Visible</paragraph>{%else%}<paragraph>Hidden</paragraph>{%/if%}</block>`)
    expect(body).toContain('Visible')
    expect(body).not.toContain('Hidden')
  })

  it('block output processed as markup', () => {
    const body = renderBody(`<block config="{'bg':'#f0f0f0'}"><section background-color="{%bg%}"><paragraph>test</paragraph></section></block>`)
    expect(body).toContain('#f0f0f0')
    expect(body).toContain('<table')
  })

  it('preserves {{variables}}', () => {
    const body = renderBody(`<block config="{'text':'Unsub'}"><paragraph><link href="{{unsubscribeUrl}}">{%text%}</link></paragraph></block>`)
    expect(body).toContain('{{unsubscribeUrl}}')
    expect(body).toContain('Unsub')
  })

  it('multiple blocks', () => {
    const body = renderBody(`
      <block config="{'t':'Header'}"><heading level="1">{%t%}</heading></block>
      <paragraph>Middle</paragraph>
      <block config="{'t':'Footer'}"><paragraph>{%t%}</paragraph></block>
    `)
    expect(body).toContain('Header')
    expect(body).toContain('Middle')
    expect(body).toContain('Footer')
  })

  it('nested if in block', () => {
    const body = renderBody(`<block config="{'centered':true,'title':'Brand'}">{%#if centered%}<section text-align="center">{%#if title%}<heading level="3">{%title%}</heading>{%/if%}</section>{%else%}<section><paragraph>side</paragraph></section>{%/if%}</block>`)
    expect(body).toContain('Brand')
    expect(body).toContain('center')
    expect(body).not.toContain('side')
  })

  it('block with fallback values', () => {
    const body = renderBody(`<block config="{}"><section padding="{%padding ?? 20px%}" background-color="{%bg ?? #fff%}"><paragraph color="{%color ?? #333%}">text</paragraph></section></block>`)
    expect(body).toContain('20px')
    expect(body).toContain('#fff')
    expect(body).toContain('#333')
  })
})

// ============================================
// EDGE CASES
// ============================================
describe('Edge cases', () => {
  it('plain text without tags', () => {
    const body = renderBody('Just plain text')
    expect(body).toContain('Just plain text')
  })

  it('special characters in content', () => {
    const body = renderBody('<paragraph>Price: $99 &amp; more</paragraph>')
    expect(body).toContain('$99')
  })

  it('empty paragraph', () => {
    const body = renderBody('<paragraph></paragraph>')
    expect(body).toContain('<p')
  })

  it('image inside paragraph (inline)', () => {
    const body = renderBody('<paragraph>Text <image src="icon.png" width="20px" /> more text</paragraph>')
    expect(body).toContain('icon.png')
    expect(body).toContain('Text')
  })

  it('link wrapping image', () => {
    const body = renderBody('<paragraph><link href="https://sevk.io"><image src="logo.png" width="100px" /></link></paragraph>')
    expect(body).toContain('https://sevk.io')
    expect(body).toContain('logo.png')
  })

  it('multiple headings of different levels', () => {
    const body = renderBody(`
      <heading level="1">H1</heading>
      <heading level="2">H2</heading>
      <heading level="3">H3</heading>
    `)
    expect(body).toContain('<h1')
    expect(body).toContain('<h2')
    expect(body).toContain('<h3')
    expect(body).toContain('H1')
    expect(body).toContain('H2')
    expect(body).toContain('H3')
  })
})
