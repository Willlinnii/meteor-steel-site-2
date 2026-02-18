#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildCampaign } = require('./lib/MythicYearBuilder');

const OUTPUT_PATH = path.resolve(__dirname, '../src/data/campaigns/mythicYear.json');

console.log('Generating The Mythic Year campaign...');

const posts = buildCampaign();

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(posts, null, 2));

// Stats
const byMonth = {};
posts.forEach(p => {
  byMonth[p.campaignMonth] = (byMonth[p.campaignMonth] || 0) + 1;
});

console.log(`\nGenerated ${posts.length} posts across 12 months.`);
console.log('\nPosts per month:');
Object.entries(byMonth).forEach(([month, count]) => {
  const cm = posts.find(p => p.campaignMonth === Number(month));
  console.log(`  Month ${month} (${cm.zodiacSign}): ${count} posts`);
});

const types = {};
posts.forEach(p => { types[p.postType] = (types[p.postType] || 0) + 1; });
console.log('\nPosts by type:');
Object.entries(types).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

const maxCaption = Math.max(...posts.map(p => p.caption.length));
console.log(`\nLongest caption: ${maxCaption} chars (limit: 2200)`);
console.log(`Output: ${OUTPUT_PATH}`);
