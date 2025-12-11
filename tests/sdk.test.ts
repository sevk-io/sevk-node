import { describe, it, expect, beforeAll } from 'bun:test';
import { Sevk, renderSync } from '../src';

const BASE_URL = 'http://localhost:4000';
const SDK_OPTIONS = { baseUrl: BASE_URL };

async function setupTestEnvironment() {
  // Register a new test user
  const testEmail = `sdk-test-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.example.com`;
  const testPassword = 'TestPassword123!';

  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });

  if (!registerRes.ok) {
    throw new Error(`Failed to register: ${registerRes.status} ${await registerRes.text()}`);
  }

  const data = await registerRes.json();
  const token = data.token;

  // 2. Create Project
  const projectRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Test Project',
      slug: `test-project-${Date.now()}`,
      supportEmail: 'support@test.com'
    })
  });

  if (!projectRes.ok) {
    throw new Error(`Failed to create project: ${projectRes.status} ${await projectRes.text()}`);
  }

  const { project } = await projectRes.json();

  // 3. Create API Key
  const apiKeyRes = await fetch(`${BASE_URL}/projects/${project.id}/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: 'Test Key', fullAccess: true })
  });

  if (!apiKeyRes.ok) {
    throw new Error(`Failed to create API key: ${apiKeyRes.status} ${await apiKeyRes.text()}`);
  }

  const { apiKey } = await apiKeyRes.json();

  return apiKey.key;
}

// ============================================
// AUTHENTICATION TESTS
// ============================================
describe('Authentication', () => {
  it('should reject invalid API key', async () => {
    const invalidSevk = new Sevk('sevk_invalid_api_key_12345', SDK_OPTIONS);

    try {
      await invalidSevk.contacts.list();
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('401');
      expect(error.message.toLowerCase()).toContain('invalid');
    }
  });

  it('should reject empty API key', async () => {
    const emptySevk = new Sevk('', SDK_OPTIONS);

    try {
      await emptySevk.contacts.list();
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('401');
    }
  });

  it('should reject malformed API key (not starting with sevk_)', async () => {
    const malformedSevk = new Sevk('invalid_key_format', SDK_OPTIONS);

    try {
      await malformedSevk.contacts.list();
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('401');
    }
  });
});

// ============================================
// MAIN SDK TESTS
// ============================================
describe('Sevk SDK Integration Tests', () => {
  let sevk: Sevk;
  let createdContactId: string;
  let createdAudienceId: string;
  let createdTemplateId: string;
  let createdTopicId: string;
  let createdSegmentId: string;

  beforeAll(async () => {
    const apiKey = await setupTestEnvironment();
    sevk = new Sevk(apiKey, SDK_OPTIONS);
  });

  // ============================================
  // CONTACTS TESTS
  // ============================================
  describe('Contacts', () => {
    it('should list contacts with correct response structure', async () => {
      const result = await sevk.contacts.list();

      // Check response structure
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.totalPages).toBe('number');
    });

    it('should list contacts with pagination', async () => {
      const result = await sevk.contacts.list({ page: 1, limit: 5 });

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
    });

    it('should create a contact with required fields', async () => {
      const email = `test-${Date.now()}@example.com`;
      const result = await sevk.contacts.create({ email });

      // Check response structure
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.email).toBe(email);
      expect(typeof result.subscribed).toBe('boolean');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      createdContactId = result.id;
    });

    it('should get a contact by id', async () => {
      expect(createdContactId).toBeDefined();
      const result = await sevk.contacts.get(createdContactId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdContactId);
      expect(result.email).toBeDefined();
    });

    it('should update a contact', async () => {
      expect(createdContactId).toBeDefined();
      const result = await sevk.contacts.update(createdContactId, { subscribed: false });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdContactId);
      expect(result.subscribed).toBe(false);
    });

    it('should throw error for non-existent contact', async () => {
      try {
        await sevk.contacts.get('non-existent-id');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });

    it('should delete a contact', async () => {
      expect(createdContactId).toBeDefined();

      // Create a new contact to delete
      const email = `delete-test-${Date.now()}@example.com`;
      const contact = await sevk.contacts.create({ email });

      await sevk.contacts.delete(contact.id);

      // Verify deletion
      try {
        await sevk.contacts.get(contact.id);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  // ============================================
  // AUDIENCES TESTS
  // ============================================
  describe('Audiences', () => {
    it('should list audiences with correct response structure', async () => {
      const result = await sevk.audiences.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.totalPages).toBe('number');
    });

    it('should create an audience with required fields', async () => {
      const name = `Test Audience ${Date.now()}`;
      const result = await sevk.audiences.create({ name });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.name).toBe(name);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      createdAudienceId = result.id;
    });

    it('should create an audience with all fields', async () => {
      const name = `Full Audience ${Date.now()}`;
      const result = await sevk.audiences.create({
        name,
        description: 'Test description',
        usersCanSee: 'PUBLIC'
      });

      expect(result).toBeDefined();
      expect(result.name).toBe(name);
      expect(result.description).toBe('Test description');
      expect(result.usersCanSee).toBe('PUBLIC');
    });

    it('should get an audience by id', async () => {
      expect(createdAudienceId).toBeDefined();
      const result = await sevk.audiences.get(createdAudienceId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdAudienceId);
    });

    it('should update an audience', async () => {
      expect(createdAudienceId).toBeDefined();
      const newName = `Updated Audience ${Date.now()}`;
      const result = await sevk.audiences.update(createdAudienceId, { name: newName });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdAudienceId);
      expect(result.name).toBe(newName);
    });

    it('should add contacts to audience', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdContactId).toBeDefined();

      const result = await sevk.audiences.addContacts(createdAudienceId, [createdContactId]);
      expect(result).toBeDefined();
    });

    it('should delete an audience', async () => {
      // Create a new audience to delete
      const audience = await sevk.audiences.create({ name: `Delete Test ${Date.now()}` });

      await sevk.audiences.delete(audience.id);

      // Verify deletion
      try {
        await sevk.audiences.get(audience.id);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  // ============================================
  // TEMPLATES TESTS
  // ============================================
  describe('Templates', () => {
    it('should list templates with correct response structure', async () => {
      const result = await sevk.templates.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.totalPages).toBe('number');
    });

    it('should create a template with required fields', async () => {
      const title = `Test Template ${Date.now()}`;
      const result = await sevk.templates.create({
        title,
        content: '<p>Hello {{name}}</p>'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.title).toBe(title);
      expect(result.content).toBe('<p>Hello {{name}}</p>');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      createdTemplateId = result.id;
    });

    it('should get a template by id', async () => {
      expect(createdTemplateId).toBeDefined();
      const result = await sevk.templates.get(createdTemplateId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdTemplateId);
    });

    it('should update a template', async () => {
      expect(createdTemplateId).toBeDefined();
      const newTitle = `Updated Template ${Date.now()}`;
      const result = await sevk.templates.update(createdTemplateId, { title: newTitle });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdTemplateId);
      expect(result.title).toBe(newTitle);
    });

    it('should duplicate a template', async () => {
      expect(createdTemplateId).toBeDefined();
      const result = await sevk.templates.duplicate(createdTemplateId);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.id).not.toBe(createdTemplateId);
    });

    it('should delete a template', async () => {
      // Create a new template to delete
      const template = await sevk.templates.create({
        title: `Delete Test ${Date.now()}`,
        content: '<p>Test</p>'
      });

      await sevk.templates.delete(template.id);

      // Verify deletion
      try {
        await sevk.templates.get(template.id);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  // ============================================
  // BROADCASTS TESTS
  // ============================================
  describe('Broadcasts', () => {
    it('should list broadcasts with correct response structure', async () => {
      const result = await sevk.broadcasts.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.totalPages).toBe('number');
    });

    it('should list broadcasts with pagination', async () => {
      const result = await sevk.broadcasts.list({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
    });

    it('should list broadcasts with search', async () => {
      const result = await sevk.broadcasts.list({ search: 'test' });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  // ============================================
  // DOMAINS TESTS
  // ============================================
  describe('Domains', () => {
    it('should list domains with correct response structure', async () => {
      const result = await sevk.domains.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.domains)).toBe(true);
    });

    it('should list only verified domains', async () => {
      const result = await sevk.domains.list({ verified: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result.domains)).toBe(true);
      // All returned domains should be verified
      result.domains.forEach(domain => {
        expect(domain.verified).toBe(true);
      });
    });
  });

  // ============================================
  // TOPICS TESTS
  // ============================================
  describe('Topics', () => {
    it('should list topics for an audience', async () => {
      expect(createdAudienceId).toBeDefined();
      const result = await sevk.topics.list(createdAudienceId);

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should create a topic', async () => {
      expect(createdAudienceId).toBeDefined();
      const name = `Test Topic ${Date.now()}`;
      const result = await sevk.topics.create(createdAudienceId, { name });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(name);
      expect(result.audienceId).toBe(createdAudienceId);

      createdTopicId = result.id;
    });

    it('should get a topic by id', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdTopicId).toBeDefined();
      const result = await sevk.topics.get(createdAudienceId, createdTopicId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdTopicId);
    });

    it('should update a topic', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdTopicId).toBeDefined();
      const newName = `Updated Topic ${Date.now()}`;
      const result = await sevk.topics.update(createdAudienceId, createdTopicId, { name: newName });

      expect(result).toBeDefined();
      expect(result.name).toBe(newName);
    });

    it('should delete a topic', async () => {
      expect(createdAudienceId).toBeDefined();

      // Create a new topic to delete
      const topic = await sevk.topics.create(createdAudienceId, { name: `Delete Test ${Date.now()}` });

      await sevk.topics.delete(createdAudienceId, topic.id);

      // Verify deletion
      try {
        await sevk.topics.get(createdAudienceId, topic.id);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  // ============================================
  // SEGMENTS TESTS
  // ============================================
  describe('Segments', () => {
    it('should list segments for an audience', async () => {
      expect(createdAudienceId).toBeDefined();
      const result = await sevk.segments.list(createdAudienceId);

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should create a segment', async () => {
      expect(createdAudienceId).toBeDefined();
      const name = `Test Segment ${Date.now()}`;
      const result = await sevk.segments.create(createdAudienceId, {
        name,
        rules: [{ field: 'email', operator: 'contains', value: '@example.com' }],
        operator: 'AND'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(name);
      expect(result.audienceId).toBe(createdAudienceId);
      expect(result.operator).toBe('AND');

      createdSegmentId = result.id;
    });

    it('should get a segment by id', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdSegmentId).toBeDefined();
      const result = await sevk.segments.get(createdAudienceId, createdSegmentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdSegmentId);
    });

    it('should update a segment', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdSegmentId).toBeDefined();
      const newName = `Updated Segment ${Date.now()}`;
      const result = await sevk.segments.update(createdAudienceId, createdSegmentId, { name: newName });

      expect(result).toBeDefined();
      expect(result.name).toBe(newName);
    });

    it('should delete a segment', async () => {
      expect(createdAudienceId).toBeDefined();

      // Create a new segment to delete
      const segment = await sevk.segments.create(createdAudienceId, {
        name: `Delete Test ${Date.now()}`,
        rules: [],
        operator: 'AND'
      });

      await sevk.segments.delete(createdAudienceId, segment.id);

      // Verify deletion
      try {
        await sevk.segments.get(createdAudienceId, segment.id);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  // ============================================
  // SUBSCRIPTIONS TESTS
  // ============================================
  describe('Subscriptions', () => {
    it('should subscribe a contact', async () => {
      expect(createdAudienceId).toBeDefined();
      const email = `subscribe-test-${Date.now()}@example.com`;

      // This should not throw
      await sevk.subscriptions.subscribe({
        email,
        audienceId: createdAudienceId
      });

      expect(true).toBe(true);
    });

    it('should unsubscribe a contact by email', async () => {
      // Create and subscribe a contact first
      const email = `unsubscribe-test-${Date.now()}@example.com`;
      const contact = await sevk.contacts.create({ email, subscribed: true });

      // Unsubscribe
      await sevk.subscriptions.unsubscribe({ email });

      // Verify unsubscription
      const updatedContact = await sevk.contacts.get(contact.id);
      expect(updatedContact.subscribed).toBe(false);
    });
  });

  // ============================================
  // EMAILS TESTS
  // ============================================
  describe('Emails', () => {
    it('should reject email with unverified domain', async () => {
      try {
        await sevk.emails.send({
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>Hello</p>',
          from: 'no-reply@unverified-domain.com'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Should get 403 Forbidden with domain verification error
        expect(error.message).toContain('403');
        expect(error.message.toLowerCase()).toContain('domain');
        expect(error.message.toLowerCase()).toContain('verified');
      }
    });

    it('should reject email with domain not owned by project', async () => {
      try {
        await sevk.emails.send({
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>Hello</p>',
          from: 'no-reply@not-my-domain.io'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Should get 403 Forbidden
        expect(error.message).toContain('403');
        expect(error.message.toLowerCase()).toContain('domain');
      }
    });

    it('should reject email with invalid from address', async () => {
      try {
        await sevk.emails.send({
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>Hello</p>',
          from: 'invalid-email-without-domain'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Should get 400 Bad Request for invalid email
        expect(error.message).toContain('400');
      }
    });

    it('should return proper error message for domain verification', async () => {
      try {
        await sevk.emails.send({
          to: 'recipient@example.com',
          subject: 'Test Email',
          html: '<p>Hello World</p>',
          from: 'sender@random-unverified-domain.xyz'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Error message should contain helpful information
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);

        // Should mention domain verification
        const lowerMessage = error.message.toLowerCase();
        expect(
          lowerMessage.includes('domain') ||
          lowerMessage.includes('verified') ||
          lowerMessage.includes('forbidden')
        ).toBe(true);
      }
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      try {
        await sevk.contacts.get('non-existent-id-12345');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });

    it('should handle validation errors', async () => {
      try {
        // Try to create contact with invalid email
        await sevk.contacts.create({ email: 'invalid-email' });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });
});

// ============================================
// MARKUP RENDERER TESTS
// ============================================
describe('Markup Renderer', () => {
  it('should return HTML document structure', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('<!DOCTYPE html');
    expect(html).toContain('<html');
    expect(html).toContain('<head>');
    expect(html).toContain('<body');
    expect(html).toContain('</html>');
  });

  it('should include meta tags', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('charset=UTF-8');
    expect(html).toContain('viewport');
  });

  it('should include title when provided', () => {
    const markup = '<email><head><title>Test Email</title></head><body></body></email>';
    const html = renderSync(markup);
    expect(html).toContain('<title>Test Email</title>');
  });

  it('should include preview text when provided', () => {
    const markup = '<email><head><preview>Preview text here</preview></head><body></body></email>';
    const html = renderSync(markup);
    expect(html).toContain('Preview text here');
    expect(html).toContain('display:none');
  });

  it('should include custom styles when provided', () => {
    const markup = '<email><head><style>.custom { color: red; }</style></head><body></body></email>';
    const html = renderSync(markup);
    expect(html).toContain('.custom { color: red; }');
  });

  it('should include font links when provided', () => {
    const markup = '<email><head><font name="Roboto" url="https://fonts.googleapis.com/css?family=Roboto" /></head><body></body></email>';
    const html = renderSync(markup);
    expect(html).toContain('fonts.googleapis.com');
  });

  it('should render empty markup with document structure', () => {
    const html = renderSync('');
    expect(html).toContain('<!DOCTYPE html');
    expect(html).toContain('<body');
  });

  it('should have default body styles', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('margin:0');
    expect(html).toContain('padding:0');
    expect(html).toContain('font-family');
  });

  it('should include html lang attribute', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('lang="en"');
  });

  it('should include html dir attribute', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('dir="ltr"');
  });

  it('should include Content-Type meta tag', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('Content-Type');
    expect(html).toContain('text/html');
  });

  it('should include XHTML doctype', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('XHTML 1.0 Transitional');
  });

  it('should handle multiple fonts', () => {
    const markup = `<email><head>
      <font name="Roboto" url="https://fonts.googleapis.com/css?family=Roboto" />
      <font name="Open Sans" url="https://fonts.googleapis.com/css?family=Open+Sans" />
    </head><body></body></email>`;
    const html = renderSync(markup);
    expect(html).toContain('Roboto');
    expect(html).toContain('Open+Sans');
  });

  it('should include background-color in body styles', () => {
    const html = renderSync('<email><body></body></email>');
    expect(html).toContain('background-color');
  });

  it('should render mail tag same as email tag', () => {
    const html = renderSync('<mail><body></body></mail>');
    expect(html).toContain('<!DOCTYPE html');
    expect(html).toContain('<body');
  });

  it('should handle complex markup structure', () => {
    const markup = `<email>
      <head>
        <title>Complex Email</title>
        <preview>This is a preview</preview>
        <style>.test { color: blue; }</style>
      </head>
      <body></body>
    </email>`;
    const html = renderSync(markup);
    expect(html).toContain('Complex Email');
    expect(html).toContain('This is a preview');
    expect(html).toContain('.test { color: blue; }');
  });
});
