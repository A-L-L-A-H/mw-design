import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CanonGovernanceError,
  compileOgSocialCard,
  compilePdfInvoiceHeader,
  handleDesignCompilerRequest,
  validateCanon0011To0014,
} from '../src/social-card-compiler.ts';

const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('V64 Parametric OG Social Card & PDF Invoice Header Compiler', () => {
  it('compiles deterministic OG social card SVG and PNG preserving brand palette & typography', () => {
    const first = compileOgSocialCard({
      title: 'Sovereign Empire v3',
      subtitle: 'Zero-card self-hosted infrastructure & Sharia Mizan ledger.',
      badge: 'RELEASE GA',
      episode: 'EP.64',
      lang: 'ID',
      theme: 'dark',
    });
    const second = compileOgSocialCard({
      title: 'Sovereign Empire v3',
      subtitle: 'Zero-card self-hosted infrastructure & Sharia Mizan ledger.',
      badge: 'RELEASE GA',
      episode: 'EP.64',
      lang: 'ID',
      theme: 'dark',
    });

    assert.equal(first.kind, 'og-social-card');
    assert.equal(first.width, 1200);
    assert.equal(first.height, 630);
    assert.equal(first.svgSha256, second.svgSha256);
    assert.equal(first.pngSha256, second.pngSha256);
    assert.equal(first.canonReport.passed, true);
    assert.ok(first.svg.includes('SOVEREIGN EMPIRE V3'));
    assert.ok(first.svg.includes('#ffe031'));
    assert.ok(first.svg.includes('#00b8f0'));
    assert.ok(first.svg.includes('CAN-0011..0014 VERIFIED'));
    assert.deepEqual(first.png.subarray(0, 8), PNG_MAGIC);
    assert.ok(first.png.byteLength > 100);
  });

  it('compiles deterministic PDF invoice header SVG and PNG for Indonesian Kwitansi', () => {
    const compiled = compilePdfInvoiceHeader({
      invoiceNumber: 'INV-MW-2026-1127-001',
      issuedDate: '2026-11-27',
      customerName: 'PT Cahaya Nusantara Digital',
      totalAmountFormatted: 'Rp 1.500.000',
      currency: 'IDR',
      statusBadge: 'LUNAS',
      theme: 'light',
    });

    assert.equal(compiled.kind, 'pdf-invoice-header');
    assert.equal(compiled.width, 1200);
    assert.equal(compiled.height, 280);
    assert.equal(compiled.canonReport.passed, true);
    assert.ok(compiled.svg.includes('INV-MW-2026-1127-001'));
    assert.ok(compiled.svg.includes('PT Cahaya Nusantara Digital'));
    assert.ok(compiled.svg.includes('Rp 1.500.000'));
    assert.ok(compiled.svg.includes('LUNAS'));
    assert.deepEqual(compiled.png.subarray(0, 8), PNG_MAGIC);
  });

  it('enforces CAN-0011, CAN-0012, CAN-0013, and CAN-0014 strictly', () => {
    // CAN-0011
    assert.throws(
      () =>
        compileOgSocialCard({
          title: 'Visual Card',
          subtitle: 'Subtitle',
          provenance: { visualPrompt: 'portrait of Prophet Muhammad' },
        }),
      (err: unknown) =>
        err instanceof CanonGovernanceError && err.report.checks['CAN-0011'] === 'fail'
    );

    // CAN-0012
    const can12 = validateCanon0011To0014(
      { title: 'Revision' },
      { silentOverwrite: true, previousVersionSha256: 'not-a-sha256' }
    );
    assert.equal(can12.passed, false);
    assert.equal(can12.checks['CAN-0012'], 'fail');

    // CAN-0013
    const can13 = validateCanon0011To0014(
      { title: 'Draft' },
      { originActor: 'user_original', aiGenerated: true }
    );
    assert.equal(can13.passed, false);
    assert.equal(can13.checks['CAN-0013'], 'fail');

    // CAN-0014
    const can14 = validateCanon0011To0014(
      { title: 'Card' },
      { claimsScriptureStatus: true }
    );
    assert.equal(can14.passed, false);
    assert.equal(can14.checks['CAN-0014'], 'fail');
  });

  it('serves HTTP endpoints for health, OG JSON/PNG, invoice SVG, and 422 canon rejections', async () => {
    const healthRes = await handleDesignCompilerRequest(new Request('http://127.0.0.1/health'));
    assert.equal(healthRes.status, 200);
    const healthJson = (await healthRes.json()) as { status: string; canon: string[] };
    assert.equal(healthJson.status, 'ok');
    assert.deepEqual(healthJson.canon, ['CAN-0011', 'CAN-0012', 'CAN-0013', 'CAN-0014']);

    const pngRes = await handleDesignCompilerRequest(
      new Request('http://127.0.0.1/api/compile/og?format=png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'RockSoul Cloud',
          subtitle: 'Deterministic OG card endpoint',
        }),
      })
    );
    assert.equal(pngRes.status, 200);
    assert.equal(pngRes.headers.get('Content-Type'), 'image/png');
    const pngBuf = new Uint8Array(await pngRes.arrayBuffer());
    assert.deepEqual(pngBuf.subarray(0, 8), PNG_MAGIC);

    const svgRes = await handleDesignCompilerRequest(
      new Request('http://127.0.0.1/api/compile/invoice-header?format=svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: 'INV-2026-099',
          issuedDate: '2026-11-27',
          customerName: 'CV Amanah Tech',
          totalAmountFormatted: 'Rp 750.000',
        }),
      })
    );
    assert.equal(svgRes.status, 200);
    assert.ok((svgRes.headers.get('Content-Type') ?? '').includes('image/svg+xml'));
    const svgText = await svgRes.text();
    assert.ok(svgText.includes('INV-2026-099'));

    const blockedRes = await handleDesignCompilerRequest(
      new Request('http://127.0.0.1/api/compile/og', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Blocked',
          subtitle: 'Draw a face of Allah in gold',
        }),
      })
    );
    assert.equal(blockedRes.status, 422);
  });
});
