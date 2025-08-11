#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import cheerio from 'cheerio';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { createObjectCsvWriter } from 'csv-writer';
import puppeteer from 'puppeteer';
import path from 'path';

// Initialize command line interface
const program = new Command();

program
  .name('scrape-questions')
  .description('Scrape educational questions from allowed sources')
  .version('1.0.0')
  .option('-o, --output <path>', 'Output CSV file path', 'scraped-questions.csv')
  .option('-s, --sources <sources>', 'Comma-separated list of sources to scrape', 'openstax,quizlet-cc,khan')
  .option('-l, --limit <number>', 'Maximum number of questions to scrape per source', '50')
  .option('-t, --topics <topics>', 'Comma-separated list of topics to focus on', 'physics,math,chemistry')
  .option('-v, --verbose', 'Show detailed logs')
  .option('--headless', 'Run browser in headless mode', true)
  .parse(process.argv);

const options = program.opts();

// Define allowed sources with license information
const ALLOWED_SOURCES = {
  'openstax': {
    name: 'OpenStax',
    baseUrl: 'https://openstax.org',
    license: 'CC BY 4.0',
    description: 'Free, peer-reviewed, openly licensed textbooks',
    scraper: scrapeOpenStax
  },
  'quizlet-cc': {
    name: 'Quizlet (CC Licensed)',
    baseUrl: 'https://quizlet.com',
    license: 'Various CC licenses',
    description: 'Creative Commons licensed flashcards and quizzes',
    scraper: scrapeQuizletCC
  },
  'khan': {
    name: 'Khan Academy',
    baseUrl: 'https://www.khanacademy.org',
    license: 'CC BY-NC-SA 3.0',
    description: 'Free educational exercises and videos',
    scraper: scrapeKhanAcademy
  },
  'oer-commons': {
    name: 'OER Commons',
    baseUrl: 'https://www.oercommons.org',
    license: 'Various open licenses',
    description: 'Open educational resources',
    scraper: scrapeOerCommons
  },
  'ck12': {
    name: 'CK-12',
    baseUrl: 'https://www.ck12.org',
    license: 'CC BY-NC 3.0',
    description: 'Free online textbooks, flashcards, and quizzes',
    scraper: scrapeCK12
  }
};

// Main function
async function main() {
  const spinner = ora('Starting question scraper').start();
  
  try {
    // Validate sources
    const sourcesToScrape = options.sources.split(',');
    const invalidSources = sourcesToScrape.filter(source => !ALLOWED_SOURCES[source]);
    
    if (invalidSources.length > 0) {
      spinner.warn(`Invalid sources: ${invalidSources.join(', ')}`);
      spinner.info(`Available sources: ${Object.keys(ALLOWED_SOURCES).join(', ')}`);
      sourcesToScrape = sourcesToScrape.filter(source => ALLOWED_SOURCES[source]);
      
      if (sourcesToScrape.length === 0) {
        spinner.fail('No valid sources specified');
        process.exit(1);
      }
    }
    
    // Set up CSV writer
    const csvWriter = createObjectCsvWriter({
      path: options.output,
      header: [
        { id: 'title', title: 'title' },
        { id: 'content', title: 'content' },
        { id: 'options', title: 'options' },
        { id: 'correct_answer', title: 'correct_answer' },
        { id: 'explanation', title: 'explanation' },
        { id: 'subject', title: 'subject' },
        { id: 'board', title: 'board' },
        { id: 'difficulty', title: 'difficulty' },
        { id: 'grade', title: 'grade' },
        { id: 'topic_tags', title: 'topic_tags' },
        { id: 'question_type', title: 'question_type' },
        { id: 'marks', title: 'marks' },
        { id: 'time_limit', title: 'time_limit' },
        { id: 'source', title: 'source' },
        { id: 'license', title: 'license' },
        { id: 'source_url', title: 'source_url' }
      ]
    });
    
    // Initialize browser for sources that need it
    let browser;
    const needsBrowser = sourcesToScrape.some(source => 
      ['quizlet-cc', 'khan', 'ck12'].includes(source)
    );
    
    if (needsBrowser) {
      spinner.text = 'Launching browser...';
      browser = await puppeteer.launch({ 
        headless: options.headless === 'true' || options.headless === true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    
    // Scrape each source
    const allQuestions = [];
    const limit = parseInt(options.limit, 10);
    const topics = options.topics.split(',');
    
    for (const source of sourcesToScrape) {
      spinner.text = `Scraping from ${ALLOWED_SOURCES[source].name}...`;
      
      try {
        const questions = await ALLOWED_SOURCES[source].scraper({
          limit,
          topics,
          browser,
          verbose: options.verbose
        });
        
        if (questions.length > 0) {
          allQuestions.push(...questions);
          spinner.succeed(`Scraped ${questions.length} questions from ${ALLOWED_SOURCES[source].name}`);
        } else {
          spinner.warn(`No questions found from ${ALLOWED_SOURCES[source].name}`);
        }
      } catch (error) {
        spinner.warn(`Error scraping from ${ALLOWED_SOURCES[source].name}: ${error.message}`);
        if (options.verbose) {
          console.error(error);
        }
      }
    }
    
    // Close browser if opened
    if (browser) {
      await browser.close();
    }
    
    // Write results to CSV
    if (allQuestions.length > 0) {
      spinner.text = `Writing ${allQuestions.length} questions to ${options.output}...`;
      await csvWriter.writeRecords(allQuestions);
      spinner.succeed(`Successfully scraped ${allQuestions.length} questions to ${options.output}`);
      
      // Print summary
      console.log('\n' + chalk.bold('Scraping Summary:'));
      const sourceStats = {};
      allQuestions.forEach(q => {
        sourceStats[q.source] = (sourceStats[q.source] || 0) + 1;
      });
      
      Object.entries(sourceStats).forEach(([source, count]) => {
        console.log(`${chalk.green('✓')} ${source}: ${count} questions`);
      });
      
      const subjectStats = {};
      allQuestions.forEach(q => {
        subjectStats[q.subject] = (subjectStats[q.subject] || 0) + 1;
      });
      
      console.log('\n' + chalk.bold('Subject Distribution:'));
      Object.entries(subjectStats).forEach(([subject, count]) => {
        console.log(`${chalk.blue('•')} ${subject}: ${count} questions`);
      });
      
    } else {
      spinner.fail('No questions were scraped');
    }
    
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// OpenStax scraper
async function scrapeOpenStax({ limit, topics, verbose }) {
  const questions = [];
  
  // Map of OpenStax books by subject
  const books = {
    'physics': [
      { id: 'college-physics-ap-courses', name: 'College Physics for AP Courses' },
      { id: 'university-physics-volume-1', name: 'University Physics Volume 1' }
    ],
    'chemistry': [
      { id: 'chemistry-2e', name: 'Chemistry 2e' },
      { id: 'chemistry-atoms-first-2e', name: 'Chemistry: Atoms First 2e' }
    ],
    'math': [
      { id: 'college-algebra-2e', name: 'College Algebra 2e' },
      { id: 'calculus-volume-1', name: 'Calculus Volume 1' }
    ]
  };
  
  // Process each relevant book
  for (const topic of topics) {
    if (!books[topic]) continue;
    
    for (const book of books[topic]) {
      if (questions.length >= limit) break;
      
      try {
        // Get book content
        const bookUrl = `https://openstax.org/details/books/${book.id}`;
        const response = await axios.get(bookUrl);
        const $ = cheerio.load(response.data);
        
        // Find chapter links
        const chapterLinks = [];
        $('.table-of-contents a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/books/')) {
            chapterLinks.push(href);
          }
        });
        
        // Process up to 3 random chapters
        const randomChapters = chapterLinks
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        for (const chapterLink of randomChapters) {
          if (questions.length >= limit) break;
          
          const chapterUrl = `https://openstax.org${chapterLink}`;
          const chapterResponse = await axios.get(chapterUrl);
          const chapter$ = cheerio.load(chapterResponse.data);
          
          // Extract chapter title
          const chapterTitle = chapter$('.title').first().text().trim();
          
          // Find review questions
          const reviewSections = chapter$('.review-questions, .exercise, .problems-exercises');
          
          reviewSections.each((i, section) => {
            if (questions.length >= limit) return false;
            
            const questionElements = chapter$(section).find('.exercise-problem, .problem');
            
            questionElements.each((j, qEl) => {
              if (questions.length >= limit) return false;
              
              try {
                const questionText = chapter$(qEl).text().trim();
                const solutionEl = chapter$(qEl).next('.solution');
                let solution = '';
                
                if (solutionEl.length) {
                  solution = chapter$(solutionEl).text().trim();
                }
                
                // Skip questions that are too short or don't have solutions
                if (questionText.length < 20 || !solution) return;
                
                // Parse multiple choice options if present
                const options = [];
                let correctAnswer = 0;
                
                // Look for options in the format (a), (b), (c), etc.
                const optionMatches = questionText.match(/\([a-z]\)[^\(]*/g);
                if (optionMatches && optionMatches.length >= 2) {
                  optionMatches.forEach((opt, index) => {
                    const cleanOption = opt.replace(/^\([a-z]\)/, '').trim();
                    options.push(cleanOption);
                    
                    // Check if this option is mentioned in the solution
                    if (solution.toLowerCase().includes(`option ${String.fromCharCode(97 + index)}`) ||
                        solution.toLowerCase().includes(`answer is ${String.fromCharCode(97 + index)}`)) {
                      correctAnswer = index;
                    }
                  });
                }
                
                // Create question object
                const question = {
                  title: `${book.name}: ${chapterTitle}`,
                  content: questionText.replace(/\([a-z]\)[^\(]*/g, '').trim(),
                  options: options.length >= 2 ? options : ['True', 'False'],
                  correct_answer: correctAnswer,
                  explanation: solution,
                  subject: topic,
                  board: 'general',
                  difficulty: 'medium',
                  grade: 'College',
                  topic_tags: [chapterTitle, book.name],
                  question_type: options.length >= 2 ? 'mcq' : 'essay',
                  marks: 2,
                  time_limit: 3,
                  source: 'OpenStax',
                  license: 'CC BY 4.0',
                  source_url: chapterUrl
                };
                
                questions.push(question);
                
                if (verbose) {
                  console.log(`Added question: ${question.content.substring(0, 50)}...`);
                }
              } catch (error) {
                if (verbose) {
                  console.error(`Error processing question: ${error.message}`);
                }
              }
            });
          });
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error processing book ${book.name}: ${error.message}`);
        }
      }
    }
  }
  
  return questions;
}

// Quizlet CC-licensed scraper
async function scrapeQuizletCC({ limit, topics, browser, verbose }) {
  const questions = [];
  
  // Map topics to Quizlet search terms
  const searchTerms = {
    'physics': ['physics problems', 'mechanics problems', 'electromagnetism problems'],
    'chemistry': ['chemistry problems', 'organic chemistry', 'chemical reactions'],
    'math': ['calculus problems', 'algebra problems', 'trigonometry problems']
  };
  
  // Create a new page
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  // Process each topic
  for (const topic of topics) {
    if (!searchTerms[topic]) continue;
    
    for (const term of searchTerms[topic]) {
      if (questions.length >= limit) break;
      
      try {
        // Search for CC-licensed content
        const searchUrl = `https://quizlet.com/search?query=${encodeURIComponent(term)}%20license%3Acreative-commons`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        
        // Wait for results to load
        await page.waitForSelector('.SearchResult', { timeout: 5000 }).catch(() => {});
        
        // Get set links
        const setLinks = await page.evaluate(() => {
          const links = [];
          document.querySelectorAll('.SearchResult a').forEach(el => {
            if (el.href && el.href.includes('/quizlet.com/')) {
              links.push(el.href);
            }
          });
          return [...new Set(links)]; // Remove duplicates
        });
        
        // Visit each set
        for (const setLink of setLinks.slice(0, 5)) { // Limit to 5 sets per term
          if (questions.length >= limit) break;
          
          try {
            await page.goto(setLink, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.SetPageTerms-term', { timeout: 5000 }).catch(() => {});
            
            // Check if it's CC licensed
            const isCC = await page.evaluate(() => {
              return document.body.textContent.includes('Creative Commons');
            });
            
            if (!isCC) continue;
            
            // Get license details
            const license = await page.evaluate(() => {
              const licenseText = document.body.textContent.match(/Creative Commons [A-Z-]+ \d\.\d/);
              return licenseText ? licenseText[0] : 'Creative Commons';
            });
            
            // Get set title
            const setTitle = await page.evaluate(() => {
              const titleEl = document.querySelector('h1');
              return titleEl ? titleEl.textContent.trim() : 'Quizlet Set';
            });
            
            // Extract flashcards
            const cards = await page.evaluate(() => {
              const result = [];
              document.querySelectorAll('.SetPageTerms-term').forEach(card => {
                const questionEl = card.querySelector('.SetPageTerms-wordText');
                const answerEl = card.querySelector('.SetPageTerms-definitionText');
                
                if (questionEl && answerEl) {
                  result.push({
                    question: questionEl.textContent.trim(),
                    answer: answerEl.textContent.trim()
                  });
                }
              });
              return result;
            });
            
            // Convert flashcards to questions
            for (const card of cards) {
              if (questions.length >= limit) break;
              
              // Skip cards with very short content
              if (card.question.length < 10 || card.answer.length < 5) continue;
              
              // Create options (for multiple choice)
              // Use the correct answer and generate 3 other options from other cards
              const options = [card.answer];
              
              // Add other options from other cards
              const otherAnswers = cards
                .filter(c => c.answer !== card.answer)
                .map(c => c.answer)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
              
              options.push(...otherAnswers);
              
              // Shuffle options
              const shuffledOptions = options.sort(() => 0.5 - Math.random());
              const correctIndex = shuffledOptions.indexOf(card.answer);
              
              const question = {
                title: setTitle,
                content: card.question,
                options: shuffledOptions,
                correct_answer: correctIndex,
                explanation: card.answer,
                subject: topic,
                board: 'general',
                difficulty: 'medium',
                grade: 'High School',
                topic_tags: [term],
                question_type: 'mcq',
                marks: 1,
                time_limit: 1,
                source: 'Quizlet (CC Licensed)',
                license: license,
                source_url: setLink
              };
              
              questions.push(question);
              
              if (verbose) {
                console.log(`Added question from Quizlet: ${question.content.substring(0, 50)}...`);
              }
            }
          } catch (error) {
            if (verbose) {
              console.error(`Error processing Quizlet set ${setLink}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error searching Quizlet for ${term}: ${error.message}`);
        }
      }
    }
  }
  
  return questions;
}

// Khan Academy scraper
async function scrapeKhanAcademy({ limit, topics, browser, verbose }) {
  const questions = [];
  
  // Map topics to Khan Academy subjects
  const khanTopics = {
    'physics': ['physics/ap-physics-1', 'physics/ap-physics-2'],
    'chemistry': ['chemistry/ap-chemistry'],
    'math': ['math/ap-calculus-ab', 'math/ap-calculus-bc', 'math/algebra']
  };
  
  // Create a new page
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  // Process each topic
  for (const topic of topics) {
    if (!khanTopics[topic]) continue;
    
    for (const khanTopic of khanTopics[topic]) {
      if (questions.length >= limit) break;
      
      try {
        // Go to topic page
        const topicUrl = `https://www.khanacademy.org/${khanTopic}`;
        await page.goto(topicUrl, { waitUntil: 'domcontentloaded' });
        
        // Wait for content to load
        await page.waitForSelector('a[href*="/quiz/"]', { timeout: 5000 }).catch(() => {});
        
        // Find quiz links
        const quizLinks = await page.evaluate(() => {
          const links = [];
          document.querySelectorAll('a[href*="/quiz/"]').forEach(el => {
            if (el.href) {
              links.push(el.href);
            }
          });
          return [...new Set(links)]; // Remove duplicates
        });
        
        // Visit each quiz
        for (const quizLink of quizLinks.slice(0, 3)) { // Limit to 3 quizzes per topic
          if (questions.length >= limit) break;
          
          try {
            await page.goto(quizLink, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.perseus-renderer', { timeout: 5000 }).catch(() => {});
            
            // Get quiz title
            const quizTitle = await page.evaluate(() => {
              const titleEl = document.querySelector('h1');
              return titleEl ? titleEl.textContent.trim() : 'Khan Academy Quiz';
            });
            
            // Try to find questions
            const questionData = await page.evaluate(() => {
              const questions = [];
              
              // Look for multiple choice questions
              document.querySelectorAll('.perseus-renderer').forEach((questionEl, index) => {
                const questionText = questionEl.textContent.trim();
                if (questionText.length < 20) return; // Skip very short text
                
                const options = [];
                const optionEls = questionEl.querySelectorAll('.perseus-radio-option');
                
                optionEls.forEach(optEl => {
                  options.push(optEl.textContent.trim());
                });
                
                if (options.length >= 2) {
                  questions.push({
                    content: questionText,
                    options: options,
                    // We don't know the correct answer, so we'll guess the first option
                    correctIndex: 0
                  });
                }
              });
              
              return questions;
            });
            
            // Add questions to our list
            for (const qData of questionData) {
              if (questions.length >= limit) break;
              
              const question = {
                title: quizTitle,
                content: qData.content,
                options: qData.options,
                correct_answer: qData.correctIndex,
                explanation: "This answer was derived from Khan Academy content. Please verify the correct answer.",
                subject: topic,
                board: 'general',
                difficulty: 'medium',
                grade: 'High School',
                topic_tags: [khanTopic.split('/').pop()],
                question_type: 'mcq',
                marks: 1,
                time_limit: 2,
                source: 'Khan Academy',
                license: 'CC BY-NC-SA 3.0',
                source_url: quizLink
              };
              
              questions.push(question);
              
              if (verbose) {
                console.log(`Added question from Khan Academy: ${question.content.substring(0, 50)}...`);
              }
            }
          } catch (error) {
            if (verbose) {
              console.error(`Error processing Khan Academy quiz ${quizLink}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error accessing Khan Academy topic ${khanTopic}: ${error.message}`);
        }
      }
    }
  }
  
  return questions;
}

// OER Commons scraper
async function scrapeOerCommons({ limit, topics, verbose }) {
  const questions = [];
  
  // Map topics to OER Commons search terms
  const searchTerms = {
    'physics': ['physics problems', 'mechanics problems', 'electromagnetism'],
    'chemistry': ['chemistry problems', 'chemical reactions', 'organic chemistry'],
    'math': ['calculus problems', 'algebra problems', 'trigonometry']
  };
  
  // Process each topic
  for (const topic of topics) {
    if (!searchTerms[topic]) continue;
    
    for (const term of searchTerms[topic]) {
      if (questions.length >= limit) break;
      
      try {
        // Search for resources
        const searchUrl = `https://www.oercommons.org/search?f.search=${encodeURIComponent(term)}&f.material_types=assessment&f.license=cc-by&f.license=cc-by-sa&f.license=public-domain`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);
        
        // Find resource links
        const resourceLinks = [];
        $('.results-list .item-title a').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
            resourceLinks.push(`https://www.oercommons.org${href}`);
          }
        });
        
        // Process each resource
        for (const resourceLink of resourceLinks.slice(0, 5)) { // Limit to 5 resources per term
          if (questions.length >= limit) break;
          
          try {
            const resourceResponse = await axios.get(resourceLink);
            const resource$ = cheerio.load(resourceResponse.data);
            
            // Get resource title and license
            const resourceTitle = resource$('.item-title').text().trim();
            let license = 'Unknown';
            resource$('.license-image').each((i, el) => {
              const alt = resource$(el).attr('alt');
              if (alt && alt.includes('CC')) {
                license = alt;
              }
            });
            
            // Extract content
            const content = resource$('.item-description').text().trim();
            
            // Look for question-like content
            const questionMatches = content.match(/(?:question|problem)[^.?!]*\?/gi);
            
            if (questionMatches) {
              for (const match of questionMatches) {
                if (questions.length >= limit) break;
                
                // Skip very short questions
                if (match.length < 20) continue;
                
                // Create a question
                const question = {
                  title: resourceTitle,
                  content: match.trim(),
                  options: ['True', 'False', 'Cannot be determined', 'None of the above'],
                  correct_answer: 0, // Default to first option
                  explanation: "This question was extracted from OER Commons. Please verify the correct answer.",
                  subject: topic,
                  board: 'general',
                  difficulty: 'medium',
                  grade: 'High School',
                  topic_tags: [term],
                  question_type: 'mcq',
                  marks: 1,
                  time_limit: 2,
                  source: 'OER Commons',
                  license: license,
                  source_url: resourceLink
                };
                
                questions.push(question);
                
                if (verbose) {
                  console.log(`Added question from OER Commons: ${question.content.substring(0, 50)}...`);
                }
              }
            }
          } catch (error) {
            if (verbose) {
              console.error(`Error processing OER Commons resource ${resourceLink}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error searching OER Commons for ${term}: ${error.message}`);
        }
      }
    }
  }
  
  return questions;
}

// CK-12 scraper
async function scrapeCK12({ limit, topics, browser, verbose }) {
  const questions = [];
  
  // Map topics to CK-12 subjects
  const ck12Topics = {
    'physics': ['physics', 'ap-physics'],
    'chemistry': ['chemistry', 'ap-chemistry'],
    'math': ['algebra', 'calculus', 'geometry']
  };
  
  // Create a new page
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  // Process each topic
  for (const topic of topics) {
    if (!ck12Topics[topic]) continue;
    
    for (const ck12Topic of ck12Topics[topic]) {
      if (questions.length >= limit) break;
      
      try {
        // Go to practice page
        const topicUrl = `https://www.ck12.org/c/${ck12Topic}/practice/`;
        await page.goto(topicUrl, { waitUntil: 'domcontentloaded' });
        
        // Wait for content to load
        await page.waitForSelector('.practice-question', { timeout: 5000 }).catch(() => {});
        
        // Extract questions
        const questionData = await page.evaluate(() => {
          const questions = [];
          
          document.querySelectorAll('.practice-question').forEach((questionEl) => {
            try {
              const questionText = questionEl.querySelector('.question-stem')?.textContent.trim();
              if (!questionText || questionText.length < 20) return;
              
              const options = [];
              questionEl.querySelectorAll('.answer-choice').forEach((optEl) => {
                options.push(optEl.textContent.trim());
              });
              
              if (options.length >= 2) {
                questions.push({
                  content: questionText,
                  options: options,
                  // We don't know the correct answer, so we'll guess the first option
                  correctIndex: 0
                });
              }
            } catch (e) {
              // Skip this question if there's an error
            }
          });
          
          return questions;
        });
        
        // Add questions to our list
        for (const qData of questionData) {
          if (questions.length >= limit) break;
          
          const question = {
            title: `CK-12 ${ck12Topic.toUpperCase()} Practice`,
            content: qData.content,
            options: qData.options,
            correct_answer: qData.correctIndex,
            explanation: "This question was extracted from CK-12. Please verify the correct answer.",
            subject: topic,
            board: 'general',
            difficulty: 'medium',
            grade: 'High School',
            topic_tags: [ck12Topic],
            question_type: 'mcq',
            marks: 1,
            time_limit: 2,
            source: 'CK-12',
            license: 'CC BY-NC 3.0',
            source_url: topicUrl
          };
          
          questions.push(question);
          
          if (verbose) {
            console.log(`Added question from CK-12: ${question.content.substring(0, 50)}...`);
          }
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error accessing CK-12 topic ${ck12Topic}: ${error.message}`);
        }
      }
    }
  }
  
  return questions;
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});