#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import OpenAI from 'openai';
import ora from 'ora';
import { stringify as csvStringify } from 'csv-stringify/sync';


// Define topics for first two chapters (Mechanics, Kinematics)
const topics = [
  'Units and Measurements',
  'Scalars and Vectors',
  'Motion in a Straight Line',
  'Motion in a Plane',
  'Projectile Motion',
  'Relative Velocity',
  'Laws of Motion',
  'Friction',
  'Circular Motion',
  'Work, Energy and Power',
  'Conservation of Energy',
  'Conservation of Momentum'
];

const program = new Command();
program
  .requiredOption('-k, --key <string>', 'OpenAI API key')
  .option('-n, --number <number>', 'Number of questions to generate', '1000')
  .option('-o, --output <path>', 'Output CSV file', 'generated-questions.csv')
  .option('--verbose', 'Show detailed logs');
program.parse();
const options = program.opts();

const openai = new OpenAI({ apiKey: options.key });

async function generateQuestion(topic, index) {
  const prompt = `Generate a unique, high-quality multiple-choice physics question (with 4 options, one correct answer, and a brief explanation) inspired by the style and rigor of Resnick and Halliday. Topic: ${topic}. Format the output as JSON with fields: title, content, options (array), correct_answer (index), explanation.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  let data;
  try {
    data = JSON.parse(response.choices[0].message.content);
  } catch (e) {
    // fallback: try to extract JSON
    const match = response.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (match) data = JSON.parse(match[0]);
    else throw new Error('Failed to parse AI response');
  }
  // Add topic for traceability
  data.topic_tags = [topic];
  data.question_type = 'mcq';
  data.difficulty = 'medium';
  data.subject = 'physics';
  data.board = 'general';
  data.grade = 'Class 11';
  data.marks = 1;
  data.time_limit = 2;
  return data;
}

async function main() {
  const spinner = ora('Generating questions...').start();
  const numQuestions = parseInt(options.number, 10);
  const questions = [];
  let failures = 0;
  for (let i = 0; i < numQuestions; i++) {
    const topic = topics[i % topics.length];
    spinner.text = `Generating question ${i + 1} / ${numQuestions} [${topic}]`;
    try {
      const q = await generateQuestion(topic, i);
      questions.push(q);
      if (options.verbose) console.log(q);
    } catch (e) {
      failures++;
      if (options.verbose) console.error('Failed to generate question:', e);
      i--; // retry
    }
  }
  spinner.succeed(`Generated ${questions.length} questions (${failures} failures/retries)`);

  // Write to CSV
  const records = questions.map(q => ({
    title: q.title,
    content: q.content,
    options: JSON.stringify(q.options),
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    subject: q.subject,
    board: q.board,
    difficulty: q.difficulty,
    grade: q.grade,
    topic_tags: JSON.stringify(q.topic_tags),
    question_type: q.question_type,
    marks: q.marks,
    time_limit: q.time_limit
  }));
  const csv = csvStringify.stringify(records, { header: true });
  await fs.writeFile(options.output, csv);
  spinner.succeed(`Saved to ${options.output}`);
}

main();
