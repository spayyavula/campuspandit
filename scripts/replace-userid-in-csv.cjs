// This script replaces 'test-user-123' in created_by with a real user ID in your CSV.
// Usage: node scripts/replace-userid-in-csv.cjs <real_user_id>

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

if (process.argv.length < 3) {
  console.error('Usage: node scripts/replace-userid-in-csv.cjs <real_user_id>');
  process.exit(1);
}

const realUserId = process.argv[2];
const inputPath = path.join(__dirname, 'questions-for-supabase-fixed.csv');
const outputPath = path.join(__dirname, 'questions-for-supabase-final.csv');

const inputCsv = fs.readFileSync(inputPath, 'utf8');
const records = parse(inputCsv, { columns: true, skip_empty_lines: true });

const replaced = records.map(row => ({
  ...row,
  created_by: row.created_by === 'test-user-123' ? realUserId : row.created_by
}));

fs.writeFileSync(outputPath, stringify(replaced, { header: true, columns: Object.keys(replaced[0]) }));
console.log('User ID replaced. Output written to', outputPath);
