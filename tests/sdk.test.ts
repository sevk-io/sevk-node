import { describe, it, expect, beforeAll } from 'bun:test';
import { Sevk, render } from '../src';

const API_KEY = process.env.SEVK_TEST_API_KEY;
const BASE_URL = process.env.SEVK_TEST_BASE_URL || 'https://api.sevk.io';
const SDK_OPTIONS = { baseUrl: BASE_URL };

const skipIntegration = !API_KEY;
const skipDomainTests = process.env.INCLUDE_DOMAIN_TESTS !== 'true';

// ============================================
// AUTHENTICATION TESTS
// ============================================
describe.if(!skipIntegration)('Authentication', () => {
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
describe.if(!skipIntegration)('Sevk SDK Integration Tests', () => {
  let sevk: Sevk;
  let createdContactId: string;
  let createdAudienceId: string;
  let createdTemplateId: string;
  let createdTopicId: string;
  let createdSegmentId: string;
  let createdBroadcastId: string;
  let createdDomainId: string;

  beforeAll(() => {
    sevk = new Sevk(API_KEY!, SDK_OPTIONS);
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
        // Use a valid UUID format so the API returns 404 (not 400 for bad format)
        await sevk.contacts.get('00000000-0000-0000-0000-000000000000');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });

    it('should bulk update contacts', async () => {
      expect(createdContactId).toBeDefined();
      // Get the contact's email first
      const contact = await sevk.contacts.get(createdContactId);
      const result = await sevk.contacts.bulkUpdate({
        contacts: [{ email: contact.email, subscribed: true }]
      });

      expect(result).toBeDefined();
    });

    it('should get contact events', async () => {
      expect(createdContactId).toBeDefined();
      const result = await sevk.contacts.getEvents(createdContactId);

      expect(result).toBeDefined();
    });

    it('should import contacts', async () => {
      const email = `import-test-${Date.now()}@example.com`;
      const result = await sevk.contacts.import({
        contacts: [{ email }]
      });

      expect(result).toBeDefined();
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

    it('should list contacts in an audience', async () => {
      expect(createdAudienceId).toBeDefined();
      const result = await sevk.audiences.listContacts(createdAudienceId);

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should remove a contact from an audience', async () => {
      expect(createdAudienceId).toBeDefined();

      // Create a contact and add to audience, then remove
      const email = `audience-remove-test-${Date.now()}@example.com`;
      const contact = await sevk.contacts.create({ email });
      await sevk.audiences.addContacts(createdAudienceId, [contact.id]);

      await sevk.audiences.removeContact(createdAudienceId, contact.id);

      // Verify removal by listing contacts
      const result = await sevk.audiences.listContacts(createdAudienceId);
      const contactIds = result.items.map((c: any) => c.id);
      expect(contactIds).not.toContain(contact.id);
    }, 15000);

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

    it('should create a broadcast', async () => {
      // Get a domain from the project to use for broadcast
      const domains = await sevk.domains.list();
      if (!domains.items.length) return;
      const domainId = domains.items[0].id;

      const name = `Test Broadcast ${Date.now()}`;
      const result = await sevk.broadcasts.create({
        domainId,
        name,
        subject: 'Test Subject',
        body: '<section><paragraph>Test broadcast body</paragraph></section>',
        senderName: 'Test Sender',
        senderEmail: 'test',
        targetType: 'ALL'
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.name).toBe(name);
      expect(result.subject).toBe('Test Subject');
      expect(result.status).toBe('DRAFT');

      createdBroadcastId = result.id;
    });

    it('should get a broadcast by id', async () => {
      if (!createdBroadcastId) return;
      const result = await sevk.broadcasts.get(createdBroadcastId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdBroadcastId);
      expect(result.subject).toBe('Test Subject');
    });

    it('should update a broadcast', async () => {
      if (!createdBroadcastId) return;
      const newName = `Updated Broadcast ${Date.now()}`;
      const result = await sevk.broadcasts.update(createdBroadcastId, { name: newName });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdBroadcastId);
      expect(result.name).toBe(newName);
    });

    it('should get broadcast analytics', async () => {
      if (!createdBroadcastId) return;
      const result = await sevk.broadcasts.getAnalytics(createdBroadcastId);

      expect(result).toBeDefined();
    });

    it('should send a test broadcast', async () => {
      if (!createdBroadcastId) return;

      try {
        const result = await sevk.broadcasts.sendTest(createdBroadcastId, ['test@example.com']);
        expect(result).toBeDefined();
      } catch (error: any) {
        // May fail if domain is unverified, which is expected
        expect(error.message).toBeDefined();
      }
    });

    it('should handle send error for draft broadcast', async () => {
      if (!createdBroadcastId) return;

      try {
        await sevk.broadcasts.send(createdBroadcastId);
        // If it succeeds, that's fine too
      } catch (error: any) {
        // Expected to fail if broadcast is not ready to send
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle cancel for a non-sending broadcast', async () => {
      if (!createdBroadcastId) return;

      try {
        await sevk.broadcasts.cancel(createdBroadcastId);
      } catch (error: any) {
        // Expected to fail if broadcast is not in a cancellable state
        expect(error.message).toBeDefined();
      }
    });

    it('should delete a broadcast', async () => {
      if (!createdBroadcastId) return;
      await sevk.broadcasts.delete(createdBroadcastId);

      // Verify deletion
      try {
        await sevk.broadcasts.get(createdBroadcastId);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  // ============================================
  // DOMAINS TESTS
  // ============================================
  describe.if(!skipDomainTests)('Domains', () => {
    it('should list domains with correct response structure', async () => {
      const result = await sevk.domains.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should list only verified domains', async () => {
      const result = await sevk.domains.list({ verified: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      // All returned domains should be verified
      result.items.forEach(domain => {
        expect(domain.verified).toBe(true);
      });
    });

    it('should create a domain', async () => {
      const subdomain = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.example.com`;
      const result = await sevk.domains.create({ domain: subdomain, email: `test@${subdomain}`, from: `noreply@${subdomain}`, senderName: 'Test' });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.domain).toBe(subdomain);

      createdDomainId = result.id;
    });

    it('should get a domain by id', async () => {
      if (!createdDomainId) return;
      const result = await sevk.domains.get(createdDomainId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdDomainId);
    });

    it('should get DNS records for a domain', async () => {
      if (!createdDomainId) return;
      const result = await sevk.domains.getDnsRecords(createdDomainId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get available regions', async () => {
      const result = await sevk.domains.getRegions();

      expect(result).toBeDefined();
    });

    it('should verify a domain', async () => {
      if (!createdDomainId) return;

      try {
        const result = await sevk.domains.verify(createdDomainId);
        expect(result).toBeDefined();
      } catch (error: any) {
        // Expected to fail for test domains without proper DNS records
        expect(error.message).toBeDefined();
      }
    });

    it('should delete a domain', async () => {
      if (!createdDomainId) return;
      await sevk.domains.delete(createdDomainId);

      // Verify deletion - API may return 404 or other error for deleted domain
      try {
        await sevk.domains.get(createdDomainId);
        expect(true).toBe(false);
      } catch (error: any) {
        // Accept any error (404, 400, etc.) as confirmation of deletion
        expect(error.message).toBeDefined();
      }
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

    it('should add contacts to a topic', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdTopicId).toBeDefined();
      expect(createdContactId).toBeDefined();

      const result = await sevk.topics.addContacts(createdAudienceId, createdTopicId, [createdContactId]);
      expect(result).toBeDefined();
    });

    it('should remove a contact from a topic', async () => {
      if (!createdAudienceId || !createdTopicId) return;

      // Create a contact, add to audience and topic, then remove from topic
      const email = `topic-remove-test-${Date.now()}@example.com`;
      const contact = await sevk.contacts.create({ email });
      await sevk.audiences.addContacts(createdAudienceId, [contact.id]);
      await sevk.topics.addContacts(createdAudienceId, createdTopicId, [contact.id]);

      await sevk.topics.removeContact(createdAudienceId, createdTopicId, contact.id);

      // Verify removal by listing contacts in the topic
      const result = await sevk.topics.listContacts(createdAudienceId, createdTopicId);
      const contactIds = result.items.map((c: any) => c.id);
      expect(contactIds).not.toContain(contact.id);
    }, 15000);

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

    it('should calculate a segment', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdSegmentId).toBeDefined();
      const result = await sevk.segments.calculate(createdAudienceId, createdSegmentId);

      expect(result).toBeDefined();
    });

    it('should preview a segment', async () => {
      expect(createdAudienceId).toBeDefined();
      const result = await sevk.segments.preview(createdAudienceId, {
        rules: [{ field: 'email', operator: 'contains', value: '@example.com' }],
        operator: 'AND'
      });

      expect(result).toBeDefined();
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

    it('should throw error for non-existent email id', async () => {
      try {
        // Use a valid UUID format so the API returns 404 (not 400 for bad format)
        await sevk.emails.get('00000000-0000-0000-0000-000000000000');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });

    it('should reject bulk email with unverified domain', async () => {
      try {
        await sevk.emails.sendBulk({
          emails: [
            {
              to: 'test1@example.com',
              subject: 'Bulk Test 1',
              html: '<p>Hello 1</p>',
              from: 'no-reply@unverified-domain.com'
            },
            {
              to: 'test2@example.com',
              subject: 'Bulk Test 2',
              html: '<p>Hello 2</p>',
              from: 'no-reply@unverified-domain.com'
            }
          ]
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
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
  // DOMAINS UPDATE TESTS
  // ============================================
  describe.if(!skipDomainTests)('Domains Update', () => {
    it('should update a domain with clickTracking', async () => {
      const domains = await sevk.domains.list();
      if (domains.items.length > 0) {
        const domainId = domains.items[0].id;
        const result = await sevk.domains.update(domainId, { clickTracking: true });

        expect(result).toBeDefined();
        expect(result.id).toBe(domainId);
        expect(result.clickTracking).toBe(true);
      }
    });

    it('should update a domain with clickTracking disabled', async () => {
      const domains = await sevk.domains.list();
      if (domains.items.length > 0) {
        const domainId = domains.items[0].id;
        const result = await sevk.domains.update(domainId, { clickTracking: false });

        expect(result).toBeDefined();
        expect(result.clickTracking).toBe(false);
      }
    });
  });

  // ============================================
  // BROADCASTS EXTENDED TESTS
  // ============================================
  describe('Broadcasts Extended', () => {
    it('should get broadcast status', async () => {
      const broadcasts = await sevk.broadcasts.list({ limit: 1 });
      if (broadcasts.items.length > 0) {
        const broadcastId = broadcasts.items[0].id;
        const result = await sevk.broadcasts.getStatus(broadcastId);

        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
      }
    });

    it('should get broadcast emails', async () => {
      const broadcasts = await sevk.broadcasts.list({ limit: 1 });
      if (broadcasts.items.length > 0) {
        const broadcastId = broadcasts.items[0].id;
        const result = await sevk.broadcasts.getEmails(broadcastId);

        expect(result).toBeDefined();
        expect(Array.isArray(result.items)).toBe(true);
      }
    });

    it('should estimate broadcast cost', async () => {
      const broadcasts = await sevk.broadcasts.list({ limit: 1 });
      if (broadcasts.items.length > 0) {
        const broadcastId = broadcasts.items[0].id;
        const result = await sevk.broadcasts.estimateCost(broadcastId);

        expect(result).toBeDefined();
        expect(typeof result.estimatedCost === 'number' || result.estimatedCost !== undefined).toBe(true);
      }
    });

    it('should list active broadcasts', async () => {
      const result = await sevk.broadcasts.listActive();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  // ============================================
  // TOPICS LIST CONTACTS TESTS
  // ============================================
  describe('Topics List Contacts', () => {
    it('should list contacts for a topic', async () => {
      expect(createdAudienceId).toBeDefined();
      expect(createdTopicId).toBeDefined();
      const result = await sevk.topics.listContacts(createdAudienceId, createdTopicId);

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  // ============================================
  // WEBHOOKS TESTS (FULL CRUD LIFECYCLE)
  // ============================================
  describe('Webhooks', () => {
    let createdWebhookId: string;

    it('should list webhooks', async () => {
      const result = await sevk.webhooks.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should create a webhook', async () => {
      const result = await sevk.webhooks.create({
        url: 'https://example.com/webhook-test',
        events: ['contact.subscribed']
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.url).toBe('https://example.com/webhook-test');

      createdWebhookId = result.id;
    });

    it('should get a webhook by id', async () => {
      expect(createdWebhookId).toBeDefined();
      const result = await sevk.webhooks.get(createdWebhookId);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdWebhookId);
      expect(result.url).toBe('https://example.com/webhook-test');
    });

    it('should update a webhook', async () => {
      expect(createdWebhookId).toBeDefined();
      const result = await sevk.webhooks.update(createdWebhookId, {
        url: 'https://example.com/webhook-updated',
        events: ['contact.subscribed', 'contact.unsubscribed']
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdWebhookId);
      expect(result.url).toBe('https://example.com/webhook-updated');
    });

    it('should test a webhook', async () => {
      expect(createdWebhookId).toBeDefined();
      const result = await sevk.webhooks.test(createdWebhookId);

      expect(result).toBeDefined();
    });

    it('should list webhook events', async () => {
      const result = await sevk.webhooks.listEvents();

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it('should delete a webhook', async () => {
      expect(createdWebhookId).toBeDefined();
      await sevk.webhooks.delete(createdWebhookId);

      // Verify deletion - should throw an error when trying to get deleted webhook
      try {
        await sevk.webhooks.get(createdWebhookId);
        expect(true).toBe(false);
      } catch (error: any) {
        // Accept 404 or any other error as confirmation of deletion
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================
  // EVENTS TESTS
  // ============================================
  describe('Events', () => {
    it('should list events', async () => {
      const result = await sevk.events.list();

      expect(result).toBeDefined();
      // API returns {items, total, page, totalPages}
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.totalPages).toBe('number');
    });

    it('should list events with filters', async () => {
      const result = await sevk.events.list({ category: 'EMAIL', limit: 5 });

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should get event stats', async () => {
      const result = await sevk.events.stats();

      expect(result).toBeDefined();
    });
  });

  // ============================================
  // USAGE TESTS
  // ============================================
  describe('Usage', () => {
    it('should get usage data', async () => {
      const result = await sevk.getUsage();

      expect(result).toBeDefined();
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      try {
        // Use a valid UUID format so the API returns 404 (not 400 for bad format)
        await sevk.contacts.get('00000000-0000-0000-0000-000000000000');
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
    const html = render('<email><body></body></email>');
    expect(html).toContain('<!DOCTYPE html');
    expect(html).toContain('<html');
    expect(html).toContain('<head>');
    expect(html).toContain('<body');
    expect(html).toContain('</html>');
  });

  it('should include meta tags', () => {
    const html = render('<email><body></body></email>');
    expect(html).toContain('charset=UTF-8');
    expect(html).toContain('viewport');
  });

  it('should include title when provided', () => {
    const markup = '<email><head><title>Test Email</title></head><body></body></email>';
    const html = render(markup);
    expect(html).toContain('<title>Test Email</title>');
  });

  it('should include preview text when provided', () => {
    const markup = '<email><head><preview>Preview text here</preview></head><body></body></email>';
    const html = render(markup);
    expect(html).toContain('Preview text here');
    expect(html).toContain('display:none');
  });

  it('should include custom styles when provided', () => {
    const markup = '<email><head><style>.custom { color: red; }</style></head><body></body></email>';
    const html = render(markup);
    expect(html).toContain('.custom { color: red; }');
  });

  it('should include font links when provided', () => {
    const markup = '<email><head><font name="Roboto" url="https://fonts.googleapis.com/css?family=Roboto" /></head><body></body></email>';
    const html = render(markup);
    expect(html).toContain('fonts.googleapis.com');
  });

  it('should render empty markup with document structure', () => {
    const html = render('');
    expect(html).toContain('<!DOCTYPE html');
    expect(html).toContain('<body');
  });

  it('should have default body styles', () => {
    const html = render('<email><body></body></email>');
    expect(html).toContain('margin:0');
    expect(html).toContain('padding:0');
    expect(html).toContain('font-family');
  });

  it('should include html lang attribute', () => {
    const html = render('<email><body></body></email>');
    expect(html).toContain('lang="en"');
  });

  it('should include html dir attribute', () => {
    const html = render('<email><body></body></email>');
    expect(html).toContain('dir="ltr"');
  });

  it('should include Content-Type meta tag', () => {
    const html = render('<email><body></body></email>');
    expect(html).toContain('Content-Type');
    expect(html).toContain('text/html');
  });

  it('should include XHTML doctype', () => {
    const html = render('<email><body></body></email>');
    expect(html).toContain('XHTML 1.0 Transitional');
  });

  it('should handle multiple fonts', () => {
    const markup = `<email><head>
      <font name="Roboto" url="https://fonts.googleapis.com/css?family=Roboto" />
      <font name="Open Sans" url="https://fonts.googleapis.com/css?family=Open+Sans" />
    </head><body></body></email>`;
    const html = render(markup);
    expect(html).toContain('Roboto');
    expect(html).toContain('Open+Sans');
  });


  it('should render mail tag same as email tag', () => {
    const html = render('<mail><body></body></mail>');
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
    const html = render(markup);
    expect(html).toContain('Complex Email');
    expect(html).toContain('This is a preview');
    expect(html).toContain('.test { color: blue; }');
  });
});
