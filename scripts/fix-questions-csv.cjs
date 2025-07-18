// This script fixes questions-for-supabase.csv for Supabase import with text[] and boolean fields.
// Usage: node scripts/fix-questions-csv.js

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const inputPath = path.join(__dirname, 'questions-for-supabase.csv');
const outputPath = path.join(__dirname, 'questions-for-supabase-fixed.csv');

const inputCsv = fs.readFileSync(inputPath, 'utf8');
const records = parse(inputCsv, { columns: true, skip_empty_lines: true });

const fixed = records.map(row => {
  // Fix topic_tags: JSON array to Postgres text[]
  let tags = row.topic_tags;
  if (tags && tags.startsWith('[')) {
    try {
      const arr = JSON.parse(tags);
      tags = '{' + arr.map(tag => tag.replace(/^["']|["']$/g, '')).join(',') + '}';
    } catch (e) {
      tags = '{' + tags.replace(/\[|\]|"/g, '') + '}';
    }
  }

  // Fix is_published: 1/0 or "1"/"0" to true/false
  let isPublished = row.is_published;
  if (isPublished === '1' || isPublished === 1) isPublished = 'true';
  else if (isPublished === '0' || isPublished === 0) isPublished = 'false';
  else if (typeof isPublished === 'string' && isPublished.toLowerCase() === 'true') isPublished = 'true';
  else if (typeof isPublished === 'string' && isPublished.toLowerCase() === 'false') isPublished = 'false';
  else isPublished = 'true'; // default

  // Fix created_by: if empty, set to test-user-123
  let createdBy = row.created_by;
  if (!createdBy || createdBy.trim() === '') createdBy = 'test-user-123';

  return {
    ...row,
    topic_tags: tags,
    is_published: isPublished,
    created_by: createdBy
  };
});

fs.writeFileSync(outputPath, stringify(fixed, { header: true, columns: Object.keys(fixed[0]) }));
console.log('Fixed CSV written to', outputPath);
