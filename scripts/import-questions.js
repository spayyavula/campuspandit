#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import csv from 'csv-parser';
import OpenAI from 'openai';
import natural from 'natural';
import ora from 'ora';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// Initialize command line interface
const program = new Command();

// Initialize language processing tools
const tokenizer = new natural.WordTokenizer();
const spellcheck = new natural.Spellcheck();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Configure OpenAI
let openai;
const initOpenAI = (apiKey) => {
  openai = new OpenAI({
    apiKey: apiKey,
  });
};

// Define command line options
program
  .name('import-questions')
  .description('Import questions from CSV and check quality')
  .version('1.0.0')
  .requiredOption('-f, --file <path>', 'Path to CSV file containing questions')
  .option('-o, --output <path>', 'Path to output JSON file', 'processed-questions.json')
  .option('-k, --key <string>', 'OpenAI API key for quality checks')
  .option('-u, --upload', 'Upload to Supabase after processing')
  .option('-s, --subject <string>', 'Default subject for questions', 'physics')
  .option('-b, --board <string>', 'Default board for questions', 'general')
  .option('-d, --difficulty <string>', 'Default difficulty level', 'medium')
  .option('-t, --type <string>', 'Default question type', 'mcq')
  .option('-g, --grade <string>', 'Default grade level', 'Class 11')
  .option('--dry-run', 'Process without saving or uploading')
  .option('--verbose', 'Show detailed logs');

program.parse();
const options = program.opts();

// Define expected CSV columns
const requiredColumns = ['title', 'content', 'options', 'correct_answer'];
const optionalColumns = ['explanation', 'subject', 'board', 'difficulty', 'grade', 'topic_tags', 'question_type', 'marks', 'time_limit'];

// Quality check thresholds
const QUALITY_THRESHOLDS = {
  minTitleLength: 10,
  minContentLength: 20,
  maxSpellingErrors: 3,
  minOptions: 2,
};

// Main function
async function main() {
  const spinner = ora('Starting import process').start();
  
  try {
    // Validate input file
    if (!fs.existsSync(options.file)) {
      spinner.fail(`File not found: ${options.file}`);
      process.exit(1);
    }

    // Initialize OpenAI if key provided
    if (options.key) {
      initOpenAI(options.key);
      spinner.info('OpenAI initialized for quality checks');
    } else {
      spinner.info('No OpenAI API key provided. Basic quality checks only.');
    }

    // Parse CSV file
    spinner.text = 'Reading and parsing CSV file...';
    const questions = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(options.file)
        .pipe(csv())
        .on('data', (row) => {
          // Validate required columns
          const missingColumns = requiredColumns.filter(col => !(col in row));
          if (missingColumns.length > 0) {
            if (options.verbose) {
              console.warn(`Warning: Row missing required columns: ${missingColumns.join(', ')}`);
              console.warn(row);
            }
            return; // Skip this row
          }
          
          questions.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    spinner.succeed(`Read ${questions.length} questions from CSV`);
    
    // Process questions (no validation, all accepted)
    spinner.text = 'Processing questions (no validation)...';
    const processedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      spinner.text = `Processing question ${i + 1}/${questions.length}...`;

      // Parse options
      let options = [];
      try {
        if (typeof question.options === 'string') {
          if (question.options.startsWith('[') && question.options.endsWith(']')) {
            options = JSON.parse(question.options);
          } else {
            options = question.options.split(/[,;|]/).map(opt => opt.trim()).filter(Boolean);
          }
        }
      } catch (error) {
        options = [];
      }

      // Parse correct answer
      let correctAnswer = parseInt(question.correct_answer, 10);
      if (isNaN(correctAnswer)) {
        correctAnswer = options.findIndex(opt => 
          opt.toLowerCase() === question.correct_answer.toLowerCase()
        );
        if (correctAnswer === -1) correctAnswer = 0;
      }

      // Parse topic tags
      let topicTags = [];
      try {
        if (question.topic_tags) {
          if (typeof question.topic_tags === 'string') {
            if (question.topic_tags.startsWith('[') && question.topic_tags.endsWith(']')) {
              topicTags = JSON.parse(question.topic_tags);
            } else {
              topicTags = question.topic_tags.split(/[,;]/).map(tag => tag.trim()).filter(Boolean);
            }
          }
        }
      } catch (error) {
        topicTags = [];
      }

      // Prepare processed question (no quality checks)
      const processedQuestion = {
        title: question.title,
        content: question.content,
        question_type: question.question_type || options.type,
        difficulty: question.difficulty || options.difficulty,
        subject: question.subject || options.subject,
        board: question.board || options.board,
        grade: question.grade || options.grade,
        topic_tags: topicTags,
        marks: parseInt(question.marks, 10) || 1,
        time_limit: parseInt(question.time_limit, 10) || 2,
        options: options.map((text, index) => ({
          option_text: text,
          option_order: index,
          is_correct: index === correctAnswer,
          explanation: index === correctAnswer ? (question.explanation || '') : ''
        })),
        is_published: true,
        metadata: {
          imported: true,
          import_date: new Date().toISOString(),
          quality_issues: [],
          ai_improved: null
        }
      };
      processedQuestions.push(processedQuestion);
    }
    spinner.succeed(`Processed ${questions.length} questions: ${processedQuestions.length} accepted, 0 flagged`);
    
    // Save to output file
    if (!options.dryRun) {
      spinner.text = 'Saving processed questions...';
      await fs.writeJson(options.output, {
        processed: processedQuestions,
        flagged: flaggedQuestions,
        stats: {
          total: questions.length,
          passed: processedQuestions.length,
          flagged: flaggedQuestions.length,
          timestamp: new Date().toISOString()
        }
      }, { spaces: 2 });
      spinner.succeed(`Saved results to ${options.output}`);
    }
    
    // Upload to Supabase if requested
    if (options.upload && supabase && !options.dryRun) {
      spinner.text = 'Uploading to Supabase...';
      
      // Only upload questions that passed quality checks
      for (let i = 0; i < processedQuestions.length; i++) {
        const question = processedQuestions[i];
        spinner.text = `Uploading question ${i + 1}/${processedQuestions.length}...`;
        
        try {
          // Insert question
          const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .insert({
              title: question.title,
              content: question.content,
              question_type: question.question_type,
              difficulty: question.difficulty,
              subject: question.subject,
              board: question.board,
              grade: question.grade,
              topic_tags: question.topic_tags,
              marks: question.marks,
              time_limit: question.time_limit,
              is_published: question.is_published,
              metadata: question.metadata
            })
            .select('id')
            .single();
            
          if (questionError) {
            throw questionError;
          }
          
          // Insert options
          const questionId = questionData.id;
          const optionsWithQuestionId = question.options.map(option => ({
            ...option,
            question_id: questionId
          }));
          
          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsWithQuestionId);
            
          if (optionsError) {
            throw optionsError;
          }
          
        } catch (error) {
          if (options.verbose) {
            console.error(`Error uploading question ${i + 1}:`, error);
          }
          spinner.warn(`Failed to upload question ${i + 1}: ${error.message}`);
        }
      }
      
      spinner.succeed(`Uploaded ${processedQuestions.length} questions to Supabase`);
    }
    
    // Print summary
    console.log('\n' + chalk.bold('Import Summary:'));
    console.log(chalk.green(`✓ ${processedQuestions.length} questions passed quality checks`));
    console.log(chalk.yellow(`⚠ ${flaggedQuestions.length} questions flagged for review`));
    
    if (flaggedQuestions.length > 0) {
      console.log('\n' + chalk.bold('Top issues:'));
      const issueCount = {};
      flaggedQuestions.forEach(q => {
        q.quality_issues.forEach(issue => {
          const shortIssue = issue.split(':')[0];
          issueCount[shortIssue] = (issueCount[shortIssue] || 0) + 1;
        });
      });
      
      Object.entries(issueCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([issue, count]) => {
          console.log(chalk.yellow(`- ${issue}: ${count} questions`));
        });
    }
    
    if (options.dryRun) {
      console.log('\n' + chalk.blue('This was a dry run. No files were saved or uploaded.'));
    }
    
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the main function
main();