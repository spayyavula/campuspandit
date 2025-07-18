// This script converts generated-questions.csv into two CSVs for Supabase import:
// - questions-for-supabase.csv (for the questions table)
// - question-options-for-supabase.csv (for the question_options table)
//
// Usage: node scripts/convert-questions-for-supabase.js

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { v4: uuidv4 } = require('uuid');

const inputPath = path.join(__dirname, 'generated-questions.csv');
const questionsOutPath = path.join(__dirname, 'questions-for-supabase.csv');
const optionsOutPath = path.join(__dirname, 'question-options-for-supabase.csv');

// Read and parse the input CSV
const inputCsv = fs.readFileSync(inputPath, 'utf8');
const records = parse(inputCsv, {
  columns: true,
  skip_empty_lines: true
});

const questions = [];
const options = [];

records.forEach((row, idx) => {
  // Generate a UUID for the question
  const questionId = uuidv4();

  // Convert topic_tags from JSON array to Postgres text[] array format
  let topicTags = row.topic_tags || '';
  if (topicTags.startsWith('[')) {
    try {
      const arr = JSON.parse(topicTags);
      if (Array.isArray(arr)) {
        // Remove quotes and join with comma, wrap in curly braces
        topicTags = '{' + arr.map(tag => tag.replace(/^["']|["']$/g, '')).join(',') + '}';
      }
    } catch (e) {
      // fallback: just remove brackets and quotes
      topicTags = '{' + topicTags.replace(/\[|\]|"/g, '') + '}';
    }
  }

  // Prepare question row for Supabase
  questions.push({
    id: questionId,
    title: row.title,
    content: row.content,
    question_type: row.question_type || 'mcq',
    difficulty: row.difficulty || 'medium',
    subject: row.subject || 'physics',
    board: row.board || 'general',
    grade: row.grade || '',
    topic_tags: topicTags,
    marks: row.marks || 1,
    time_limit: row.time_limit || 2,
    created_by: '', // Fill in if needed
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_published: true,
    metadata: '{}'
  });

  // Parse options (JSON array in CSV)
  let opts = [];
  try {
    opts = JSON.parse(row.options.replace(/''/g, '"').replace(/""/g, '"'));
  } catch (e) {
    try {
      opts = JSON.parse(row.options);
    } catch (err) {
      opts = [];
    }
  }
  const correctIdx = parseInt(row.correct_answer, 10);

  opts.forEach((opt, i) => {
    options.push({
      id: uuidv4(),
      question_id: questionId,
      option_text: opt,
      option_order: i,
      is_correct: i === correctIdx,
      explanation: row.explanation || '',
      created_at: new Date().toISOString()
    });
  });
});

// Write questions CSV
fs.writeFileSync(
  questionsOutPath,
  stringify(questions, {
    header: true,
    columns: [
      'id','title','content','question_type','difficulty','subject','board','grade','topic_tags','marks','time_limit','created_by','created_at','updated_at','is_published','metadata'
    ]
  })
);

// Write options CSV
fs.writeFileSync(
  optionsOutPath,
  stringify(options, {
    header: true,
    columns: [
      'id','question_id','option_text','option_order','is_correct','explanation','created_at'
    ]
  })
);

console.log('Conversion complete!');
console.log('Import questions-for-supabase.csv into the questions table.');
console.log('Import question-options-for-supabase.csv into the question_options table.');
