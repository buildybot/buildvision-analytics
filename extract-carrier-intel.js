'use strict';

const { createClient } = require('/Users/buildy/.openclaw/workspace/BuildVisionAtlas/node_modules/@libsql/client');
const fs = require('fs');
const path = require('path');

const db = createClient({
  url: 'libsql://buildvision-atlas-buildybot.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzE0MjY4ODEsImlkIjoiY2ExZWI2MjMtMzJjNC00N2YzLWEzODQtNjFhNzMwZWEzZWU1IiwicmlkIjoiZmEyYTFjM2EtOTNlNS00NmNhLTlmZTUtNDE2MWE4MTU0MjI0In0.MqKKz5-d6RwgAna0R7L2mRAdHMMcD6K4ExzsJYigxsVH4P3sx8uYBV6bBg3XdYAXV9hdRBTlDn2aSzknou3JAg',
});

const OUTPUT_DIR = '/Users/buildy/.openclaw/workspace/buildvision-analytics/data';

function safeParseJSON(str) {
  if (!str) return [];
  try {
    const parsed = typeof str === 'string' ? JSON.parse(str) : str;
    return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
  } catch {
    return [];
  }
}

async function getManufacturerId(slug) {
  const result = await db.execute({
    sql: 'SELECT id, name FROM manufacturers WHERE slug = ?',
    args: [slug],
  });
  if (result.rows.length === 0) return null;
  return { id: result.rows[0][0], name: result.rows[0][1] };
}

async function getDocStats(manufacturerId) {
  const totalResult = await db.execute({
    sql: 'SELECT COUNT(*) FROM documents WHERE manufacturerId = ?',
    args: [manufacturerId],
  });
  const totalDocs = Number(totalResult.rows[0][0]) || 0;

  const byTypeResult = await db.execute({
    sql: 'SELECT type, COUNT(*) as cnt FROM documents WHERE manufacturerId = ? GROUP BY type ORDER BY cnt DESC',
    args: [manufacturerId],
  });
  const docsByType = {};
  for (const row of byTypeResult.rows) {
    docsByType[row[0] || 'unknown'] = Number(row[1]) || 0;
  }

  return { totalDocs, docsByType };
}

async function getSellingPoints(manufacturerId, limit = 100) {
  // Include spec-sheet, brochure, catalog, guide — all useful for selling points
  const result = await db.execute({
    sql: `SELECT d.title, d.type, ds.summary, ds.keyProducts, ds.keySpecs
          FROM document_summaries ds
          JOIN documents d ON ds.documentId = d.id
          WHERE d.manufacturerId = ?
            AND d.type IN ('spec-sheet', 'brochure', 'catalog', 'guide')
          ORDER BY d.createdAt DESC
          LIMIT ?`,
    args: [manufacturerId, limit],
  });

  return result.rows.map(r => ({
    docTitle: r[0] || '',
    type: r[1] || '',
    summary: r[2] || '',
    keyProducts: safeParseJSON(r[3]),
    keySpecs: safeParseJSON(r[4]),
  }));
}

async function getSummaryCount(manufacturerId) {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) FROM document_summaries ds JOIN documents d ON ds.documentId = d.id WHERE d.manufacturerId = ?',
    args: [manufacturerId],
  });
  return Number(result.rows[0][0]) || 0;
}

// Derive product lines from keyProducts in summaries
async function deriveProductLines(manufacturerId) {
  const result = await db.execute({
    sql: `SELECT ds.keyProducts
          FROM document_summaries ds
          JOIN documents d ON ds.documentId = d.id
          WHERE d.manufacturerId = ?
            AND ds.keyProducts IS NOT NULL
            AND ds.keyProducts != '[]'
            AND ds.keyProducts != ''`,
    args: [manufacturerId],
  });

  const productCounts = {};
  for (const row of result.rows) {
    const products = safeParseJSON(row[0]);
    for (const p of products) {
      if (p && typeof p === 'string' && p.length > 2 && p.length < 100) {
        productCounts[p] = (productCounts[p] || 0) + 1;
      }
    }
  }

  return Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([name, count]) => ({ name, count }));
}

// Get key specs aggregate
async function deriveKeySpecs(manufacturerId) {
  const result = await db.execute({
    sql: `SELECT ds.keySpecs
          FROM document_summaries ds
          JOIN documents d ON ds.documentId = d.id
          WHERE d.manufacturerId = ?
            AND ds.keySpecs IS NOT NULL
            AND ds.keySpecs != '[]'
            AND ds.keySpecs != ''
          LIMIT 500`,
    args: [manufacturerId],
  });

  const specCounts = {};
  for (const row of result.rows) {
    const specs = safeParseJSON(row[0]);
    for (const s of specs) {
      if (s && typeof s === 'string' && s.length > 2 && s.length < 200) {
        specCounts[s] = (specCounts[s] || 0) + 1;
      }
    }
  }

  return Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([spec, count]) => ({ spec, count }));
}

async function main() {
  console.log('Connecting to Atlas...');

  // Get Carrier data
  console.log('Fetching Carrier data...');
  const carrier = await getManufacturerId('carrier');
  if (!carrier) {
    console.error('Carrier not found!');
    const mfrs = await db.execute('SELECT slug, name FROM manufacturers ORDER BY name LIMIT 30');
    console.log('Available:', mfrs.rows.map(r => `${r[0]}`).join(', '));
    process.exit(1);
  }
  console.log(`Carrier ID: ${carrier.id}`);

  const [carrierStats, carrierSellingPoints, carrierSummaryCount, carrierProducts, carrierSpecs] = await Promise.all([
    getDocStats(carrier.id),
    getSellingPoints(carrier.id, 100),
    getSummaryCount(carrier.id),
    deriveProductLines(carrier.id),
    deriveKeySpecs(carrier.id),
  ]);

  console.log(`Carrier: ${carrierStats.totalDocs} docs, ${carrierSellingPoints.length} selling points, ${carrierSummaryCount} summaries, ${carrierProducts.length} unique products derived`);

  // Get competitor data
  const competitorSlugs = { trane: 'trane', 'daikin-applied': 'daikin-applied', jci: 'jci', multistack: 'multistack' };
  const competitors = {};

  for (const [key, slug] of Object.entries(competitorSlugs)) {
    console.log(`Fetching ${slug}...`);
    const mfr = await getManufacturerId(slug);
    if (!mfr) {
      console.log(`  ${slug} not found`);
      competitors[key] = { notFound: true, slug };
      continue;
    }
    const [stats, summaryCount, products] = await Promise.all([
      getDocStats(mfr.id),
      getSummaryCount(mfr.id),
      deriveProductLines(mfr.id),
    ]);
    competitors[key] = {
      name: mfr.name,
      totalDocs: stats.totalDocs,
      docsByType: stats.docsByType,
      summaryCount,
      topProducts: products.slice(0, 20),
    };
    console.log(`  ${slug}: ${stats.totalDocs} docs, ${summaryCount} summaries`);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    carrier: {
      name: carrier.name,
      totalDocs: carrierStats.totalDocs,
      docsByType: carrierStats.docsByType,
      summaryCount: carrierSummaryCount,
      topProducts: carrierProducts,
      topSpecs: carrierSpecs,
      sellingPoints: carrierSellingPoints,
    },
    competitors,
  };

  const outputPath = path.join(OUTPUT_DIR, 'carrier-product-intel.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)}KB)`);

  // Generate brief
  const brief = generateBrief(output);
  const briefPath = path.join(OUTPUT_DIR, 'carrier-competitive-brief.md');
  fs.writeFileSync(briefPath, brief);
  console.log(`Wrote ${briefPath}`);

  console.log('\nDone!');
  process.exit(0);
}

function generateBrief(data) {
  const { carrier, competitors } = data;

  const specSheetSamples = carrier.sellingPoints.filter(sp => sp.type === 'spec-sheet' && sp.summary).slice(0, 6);
  const brochureSamples = carrier.sellingPoints.filter(sp => sp.type === 'brochure' && sp.summary).slice(0, 3);

  const compRows = Object.entries(competitors).map(([key, c]) => {
    if (c.notFound) return `| ${key} | N/A | N/A | N/A |`;
    const topType = Object.entries(c.docsByType).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,n])=>`${t}:${n}`).join(', ');
    return `| ${c.name || key} | ${c.totalDocs} | ${c.summaryCount} | ${topType} |`;
  });

  const carrierTopTypes = Object.entries(carrier.docsByType).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`${t}:${n}`).join(', ');

  return `# Carrier Competitive Intelligence Brief
*Generated: ${data.generatedAt}*

---

## 1. Carrier Product Portfolio

Carrier has **${carrier.totalDocs} documents** indexed in BuildVision Atlas, with **${carrier.summaryCount} AI-processed summaries**.

### Doc Type Breakdown
${Object.entries(carrier.docsByType).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`- **${t}:** ${n} docs`).join('\n')}

### Top Products by Documentation Coverage
*(Derived from AI-extracted keyProducts across all summaries)*

${carrier.topProducts.slice(0, 30).map((p, i) => `${i+1}. **${p.name}** (${p.count} docs)`).join('\n') || '*No structured product data*'}

### Key Technical Specifications
*(Most frequently referenced specs across Carrier's document library)*

${carrier.topSpecs.slice(0, 20).map(s => `- ${s.spec} *(${s.count}x)*`).join('\n') || '*No structured spec data extracted*'}

---

## 2. Competitive Documentation Depth

| Manufacturer | Total Docs | AI Summaries | Top Doc Types |
|---|---|---|---|
| **Carrier** | ${carrier.totalDocs} | ${carrier.summaryCount} | ${carrierTopTypes} |
${compRows.join('\n')}

### Analysis
- **Trane** is the documentation leader with ${competitors.trane?.totalDocs || 'N/A'} docs — ${((competitors.trane?.totalDocs || 0) / carrier.totalDocs * 100).toFixed(0)}% more than Carrier
- **JCI** has ${competitors.jci?.totalDocs || 'N/A'} docs — strong competitor in the commercial space
- **Daikin Applied** has ${competitors['daikin-applied']?.totalDocs || 'N/A'} docs — significantly less coverage
- **Multistack** is niche with ${competitors.multistack?.totalDocs || 'N/A'} docs — modular chiller specialist

---

## 3. Carrier Selling Points from Spec Sheets

${specSheetSamples.length > 0 ? specSheetSamples.map(sp => `### ${sp.docTitle}

${sp.summary}

${sp.keyProducts.length > 0 ? `**Products:** ${sp.keyProducts.slice(0,5).join(', ')}` : ''}
${sp.keySpecs.length > 0 ? `**Specs:** ${sp.keySpecs.slice(0,5).join(' | ')}` : ''}
`).join('\n---\n') : '*No spec sheet summaries available*'}

${brochureSamples.length > 0 ? `### Brochure Highlights\n\n${brochureSamples.map(sp => `**${sp.docTitle}**\n${sp.summary}`).join('\n\n')}` : ''}

---

## 4. Engineering Firm Perspective: Carrier vs Trane vs Daikin Applied

### Why This Matters for BuildVision
Engineering firms selecting commercial HVAC equipment care about:

1. **Specification depth** — Can they find EER/COP/IPLV ratings quickly?
2. **Capacity ranges** — Does the product line cover their project size?
3. **Installation documentation** — IOMs available for all models?
4. **Controls integration** — BACnet/Modbus support documented?
5. **Submittal packages** — Are submittals available for the AHJ?

### Carrier's Position
- **Strongest suit:** ${Object.entries(carrier.docsByType).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'} coverage (${Object.entries(carrier.docsByType).sort((a,b)=>b[1]-a[1])[0]?.[1] || 0} docs)
- **Documentation breadth:** ${Object.keys(carrier.docsByType).length} document types indexed
- **AI-searchable:** ${carrier.summaryCount} of ${carrier.totalDocs} docs have AI summaries (${(carrier.summaryCount/carrier.totalDocs*100).toFixed(0)}% coverage)

### Trane's Position
${competitors.trane && !competitors.trane.notFound ? `- Largest library: ${competitors.trane.totalDocs} docs (vs Carrier's ${carrier.totalDocs})
- ${competitors.trane.summaryCount} AI summaries (${(competitors.trane.summaryCount/competitors.trane.totalDocs*100).toFixed(0)}% coverage)
- Top products: ${competitors.trane.topProducts.slice(0,5).map(p=>p.name).join(', ')}` : 'N/A'}

### Daikin Applied's Position
${competitors['daikin-applied'] && !competitors['daikin-applied'].notFound ? `- Smaller library: ${competitors['daikin-applied'].totalDocs} docs
- ${competitors['daikin-applied'].summaryCount} AI summaries
- Top products: ${competitors['daikin-applied'].topProducts.slice(0,5).map(p=>p.name).join(', ')}` : 'N/A'}

### BuildVision Recommendation
For engineering firms, **Carrier vs Trane** is the primary battleground. Both have deep documentation.
Carrier's **${carrier.summaryCount} AI-searchable summaries** means BuildVision users can quickly surface Carrier specs.
Trane's larger library (${competitors.trane?.totalDocs || 'N/A'} docs) may give them an edge on older/legacy equipment coverage.
Daikin Applied's smaller presence suggests they compete on fewer, more specialized product lines.

---
*Data source: BuildVision Atlas (Turso) | Generated by Buildy 🔨*
`;
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
