import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { sanitizeGoogleReviewUrl } from '../src/lib/security.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function readMigration(name) {
  return readFile(resolve(projectRoot, 'supabase', 'migrations', name), 'utf8');
}

test('Google review links allow only approved HTTPS hosts', () => {
  assert.equal(
    sanitizeGoogleReviewUrl('https://g.page/r/example/review'),
    'https://g.page/r/example/review'
  );
  assert.equal(
    sanitizeGoogleReviewUrl('https://reviews.example.test', 'fallback'),
    'fallback'
  );
  assert.equal(
    sanitizeGoogleReviewUrl('javascript:alert(1)', 'fallback'),
    'fallback'
  );
});

test('private feedback migration preserves public write-only access', async () => {
  const sql = await readMigration('20261028_secure_private_feedback.sql');

  assert.match(sql, /ALTER TABLE public\.private_feedback ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /GRANT INSERT ON public\.private_feedback TO anon, authenticated/i);
  assert.match(sql, /GRANT SELECT, UPDATE ON public\.private_feedback TO authenticated/i);
  assert.match(sql, /REVOKE SELECT, UPDATE, DELETE ON public\.private_feedback FROM anon, authenticated/i);
  assert.match(sql, /CREATE POLICY "Public can submit private feedback"[\s\S]*TO anon, authenticated/i);
  assert.match(sql, /CREATE POLICY "Authenticated users can view private feedback"[\s\S]*TO authenticated/i);
  assert.match(sql, /CREATE POLICY "Authenticated users can update private feedback"[\s\S]*TO authenticated/i);
});

test('tenant migration keeps leads admin-only and reviews tenant-scoped for authenticated users', async () => {
  const sql = await readMigration('20261027_strict_tenant_rls.sql');

  assert.match(sql, /REVOKE SELECT, UPDATE, DELETE ON public\.leads FROM anon/i);
  assert.match(sql, /CREATE POLICY "Super admins can view leads"[\s\S]*TO authenticated/i);
  assert.match(sql, /CREATE POLICY "Public can submit reviews"[\s\S]*TO anon/i);
  assert.match(sql, /CREATE POLICY "Tenant members can manage reviews"[\s\S]*TO authenticated/i);
  assert.match(sql, /b\.id = reviews\.business_id[\s\S]*auth\.uid\(\)/i);
  assert.match(sql, /p\.role = 'super_admin'/i);
});

test('manual UPI migration keeps payment requests tenant-scoped', async () => {
  const sql = await readMigration('20261028_manual_upi_payments.sql');

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.manual_payment_requests/i);
  assert.match(sql, /CHECK \(status IN \('pending', 'approved', 'rejected'\)\)/i);
  assert.match(sql, /GRANT INSERT, SELECT ON public\.manual_payment_requests TO authenticated/i);
  assert.match(sql, /REVOKE UPDATE, DELETE ON public\.manual_payment_requests FROM authenticated/i);
  assert.match(sql, /public\.can_access_business\(business_id\)/i);
});
