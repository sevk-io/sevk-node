import { describe, expect, it } from 'bun:test'

import { Sevk } from '../src'

const apiKey = process.env.SEVK_API_KEY
const from = process.env.SEVK_TEST_FROM
const to = process.env.SEVK_TEST_TO

describe('send', () => {
  it.skipIf(!apiKey || !from || !to)('sends a markup email through the Sevk API', async () => {
    const client = new Sevk(apiKey!, { baseUrl: process.env.SEVK_BASE_URL })
    const response = await client.emails.send({ from: from!, to: to!, subject: 'Sevk SDK send test', markup: '<section><paragraph>Hello from the Sevk Node.js SDK</paragraph></section>' })

    expect(typeof response.id === 'string' && response.id.length > 0).toBe(true)
  })
})
