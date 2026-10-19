import { describe, expect, it } from 'bun:test'

import { render } from '../src'

describe('renderer', () => {
  it('renders markup into an HTML email document', () => {
    const html = render('<section><paragraph>Hello world</paragraph></section>')

    expect(html.startsWith('<!DOCTYPE html PUBLIC')).toBe(true)
    expect(html).toContain('Hello world')
    expect(html).not.toContain('<paragraph>')
  })
})
