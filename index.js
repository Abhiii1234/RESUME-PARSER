/**
 * index.js
 * Main entry point — runs a demo against the sample resume
 * and outputs the full JSON result to console and file.
 *
 * Usage:
 *   node index.js                         # Uses sample_resume.txt
 *   node index.js path/to/resume.pdf      # Uses a PDF file
 *   node index.js --server                # Starts HTTP API server
 */

'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

// ─── SERVER MODE ──────────────────────────────────────────────────────────────
if (args.includes('--server') || process.env.PORT || process.env.NODE_ENV === 'production') {
  require('./server');
} else {
  // ─── CLI / DEMO MODE ──────────────────────────────────────────────────────────
  const { parsePdf } = require('./pdfParser');
  const { extractResumeData } = require('./resumeExtractor');
  const { parseAllJDs } = require('./jdParser');
  const { matchResumeToAllJDs } = require('./matcher');

  console.log('\n══════════════════════════════════════════════');
  console.log('   Resume Parser & Job Matcher — Demo Run   ');
  console.log('══════════════════════════════════════════════\n');

  // ─── LOAD RESUME ─────────────────────────────────────────────────────────────

  let resumeText = '';
  const inputFile = args[0];

  if (inputFile) {
    const filePath = path.resolve(inputFile);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    if (filePath.endsWith('.pdf')) {
      console.log(`📄 Parsing PDF: ${filePath}`);
      resumeText = parsePdf(filePath);
      if (!resumeText || resumeText.length < 50) {
        console.warn('⚠️  PDF text extraction yielded minimal content. Using fallback sample resume.');
        resumeText = fs.readFileSync(
          path.join(__dirname, 'data/resumes/sample_resume.txt'), 'utf8'
        );
      }
    } else {
      resumeText = fs.readFileSync(filePath, 'utf8');
    }
    console.log(`✅ Resume loaded from: ${filePath}\n`);
  } else {
    // Graceful degradation if local sample file isn't available
    const samplePath = path.join(__dirname, 'data/resumes/sample_resume.txt');
    if (fs.existsSync(samplePath)) {
      resumeText = fs.readFileSync(samplePath, 'utf8');
      console.log(`📋 Using sample resume: ${samplePath}\n`);
    } else {
      console.warn(`⚠️ Sample resume not found at ${samplePath}. Exiting CLI mode.`);
      process.exit(1);
    }
  }

  // ─── LOAD JDs ─────────────────────────────────────────────────────────────────

  const jdsRaw = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data/jds/jds.json'), 'utf8')
  );
  const parsedJDs = parseAllJDs(jdsRaw);
  console.log(`📂 Loaded ${parsedJDs.length} Job Descriptions\n`);

  // ─── EXTRACT RESUME DATA ──────────────────────────────────────────────────────

  console.log('🔍 Extracting resume data...');
  const resumeData = extractResumeData(resumeText);

  console.log(`   👤 Name          : ${resumeData.name || 'Not detected'}`);
  console.log(`   💰 Salary        : ${resumeData.salary || 'Not mentioned'}`);
  console.log(`   📅 Experience    : ${resumeData.yearOfExperience != null ? resumeData.yearOfExperience + ' years' : 'Not detected'}`);
  console.log(`   🛠  Skills found  : ${resumeData.resumeSkills.length} skills`);
  console.log(`      ${resumeData.resumeSkills.slice(0, 10).join(', ')}${resumeData.resumeSkills.length > 10 ? '...' : ''}\n`);

  // ─── MATCH AGAINST JDs ────────────────────────────────────────────────────────

  console.log('🔗 Matching resume against all JDs...\n');
  const matchingJobs = matchResumeToAllJDs(resumeData, parsedJDs);

  console.log('📊 Top 5 Matching Jobs:');
  console.log('─'.repeat(65));
  matchingJobs.slice(0, 5).forEach((job, i) => {
    const bar = '█'.repeat(Math.round(job.matchingScore / 5)) + '░'.repeat(20 - Math.round(job.matchingScore / 5));
    console.log(`${i + 1}. [${job.jobId}] ${job.role}`);
    console.log(`   Score: ${job.matchingScore.toFixed(1)}%  ${bar}`);
    console.log(`   Skills: ${job.summary}`);
    console.log(`   Salary: ${job.salary || 'Not specified'}`);
    console.log();
  });

  // ─── BUILD FINAL OUTPUT JSON ──────────────────────────────────────────────────

  const output = {
    name: resumeData.name,
    salary: resumeData.salary,
    yearOfExperience: resumeData.yearOfExperience,
    resumeSkills: resumeData.resumeSkills,
    matchingJobs: matchingJobs.map(job => ({
      jobId: job.jobId,
      role: job.role,
      salary: job.salary,
      aboutRole: job.aboutRole,
      skillsAnalysis: job.skillsAnalysis,
      matchingScore: job.matchingScore,
      weightedScore: job.weightedScore,
      summary: job.summary
    }))
  };

  // ─── SAVE OUTPUT ─────────────────────────────────────────────────────────────

  const outputPath = path.join(__dirname, 'output', 'result.json');
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('─'.repeat(65));
  console.log(`\n✅ Full JSON output saved to: ${outputPath}`);
  console.log('\nRun with --server flag to start HTTP API:');
  console.log('  node index.js --server\n');
}
