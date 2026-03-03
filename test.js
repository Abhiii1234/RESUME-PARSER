/**
 * tests/test.js
 * Unit tests for Resume Parser & Job Matcher
 * Uses Node.js built-in assert module — no test framework needed
 *
 * Run: node tests/test.js
 */

'use strict';

const assert = require('assert');
const { extractSalary, extractExperience, extractSkills, extractName } = require('./resumeExtractor');
const { parseJD } = require('./jdParser');
const { analyzeSkills, calculateScore, skillMatches } = require('./matcher');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     Expected: ${err.expected} | Got: ${err.actual}`);
    failed++;
  }
}

// ─── SALARY TESTS ─────────────────────────────────────────────────────────────
console.log('\n📋 Salary Extraction Tests');

test('Extracts Indian LPA salary', () => {
  const result = extractSalary('Current Salary: 12 LPA');
  assert.ok(result, 'Should find salary');
  assert.ok(result.includes('12'), 'Should include 12');
});

test('Extracts CTC format', () => {
  const result = extractSalary('CTC: ₹10,00,000 per annum');
  assert.ok(result, 'Should find CTC salary');
});

test('Extracts expected salary', () => {
  const result = extractSalary('Expected Salary: 18 LPA');
  assert.ok(result, 'Should find expected salary');
  assert.ok(result.includes('18'), 'Should include 18');
});

test('Returns null if no salary', () => {
  const result = extractSalary('Experienced software engineer with Python skills');
  assert.strictEqual(result, null, 'Should return null for no salary');
});

// ─── EXPERIENCE TESTS ─────────────────────────────────────────────────────────
console.log('\n📋 Experience Extraction Tests');

test('Extracts explicit years', () => {
  const result = extractExperience('I have 5 years of experience in software development');
  assert.strictEqual(result, 5, 'Should extract 5 years');
});

test('Extracts years with plus notation', () => {
  const result = extractExperience('6+ years of experience');
  assert.strictEqual(result, 6, 'Should extract 6 years');
});

test('Extracts from total experience label', () => {
  const result = extractExperience('Total Experience: 4.5 years');
  assert.strictEqual(result, 4.5, 'Should extract 4.5 years');
});

test('Calculates from date ranges', () => {
  const result = extractExperience('Jan 2020 – Present');
  assert.ok(result > 4, 'Should calculate over 4 years');
  assert.ok(result < 8, 'Should be less than 8 years');
});

test('Returns null if no experience found', () => {
  const result = extractExperience('No experience information here.');
  assert.strictEqual(result, null, 'Should return null');
});

// ─── SKILLS TESTS ─────────────────────────────────────────────────────────────
console.log('\n📋 Skills Extraction Tests');

test('Extracts Java and Spring Boot', () => {
  const skills = extractSkills('Proficient in Java, Spring Boot, and MySQL');
  assert.ok(skills.includes('Java'), 'Should find Java');
  assert.ok(skills.includes('Spring Boot'), 'Should find Spring Boot');
  assert.ok(skills.includes('MySQL'), 'Should find MySQL');
});

test('Extracts cloud technologies', () => {
  const skills = extractSkills('Experience with AWS, Docker, Kubernetes, and Terraform');
  assert.ok(skills.includes('AWS'), 'Should find AWS');
  assert.ok(skills.includes('Docker'), 'Should find Docker');
  assert.ok(skills.includes('Kubernetes'), 'Should find Kubernetes');
});

test('Extracts Python', () => {
  const skills = extractSkills('Python developer with 5 years experience');
  assert.ok(skills.includes('Python'), 'Should find Python');
});

test('Extracts React', () => {
  const skills = extractSkills('Built apps using React and TypeScript');
  assert.ok(skills.includes('React'), 'Should find React');
  assert.ok(skills.includes('TypeScript'), 'Should find TypeScript');
});

test('Returns array', () => {
  const skills = extractSkills('Java developer');
  assert.ok(Array.isArray(skills), 'Should return array');
});

// ─── NAME TESTS ───────────────────────────────────────────────────────────────
console.log('\n📋 Name Extraction Tests');

test('Extracts name from first line', () => {
  const name = extractName('John Doe\nSoftware Engineer\nEmail: john@test.com');
  assert.strictEqual(name, 'John Doe', 'Should extract John Doe');
});

test('Extracts name from label', () => {
  const name = extractName('Name: Jane Smith\nSenior Developer');
  assert.ok(name !== null, 'Should extract some name');
});

// ─── JD PARSING TESTS ─────────────────────────────────────────────────────────
console.log('\n📋 JD Parsing Tests');

const sampleJD = `Senior Java Developer
Required Skills: Java, Spring Boot, MySQL, Docker, REST API
Good to have: Python, Kubernetes, AWS
Salary: $120,000 - $150,000`;

test('Parses JD role', () => {
  const jd = parseJD(sampleJD, 'TEST001');
  assert.strictEqual(jd.jobId, 'TEST001', 'JobId should match');
});

test('Extracts required skills from JD', () => {
  const jd = parseJD(sampleJD, 'TEST001');
  assert.ok(jd.requiredSkills.includes('Java'), 'Should find Java in required');
  assert.ok(jd.requiredSkills.includes('Docker'), 'Should find Docker in required');
});

test('Extracts optional skills from JD', () => {
  const jd = parseJD(sampleJD, 'TEST001');
  assert.ok(jd.optionalSkills.length > 0, 'Should have optional skills');
});

test('Extracts salary from JD', () => {
  const jd = parseJD(sampleJD, 'TEST001');
  assert.ok(jd.salary, 'Should extract salary');
  assert.ok(jd.salary.includes('120'), 'Should include 120k');
});

// ─── MATCHING TESTS ───────────────────────────────────────────────────────────
console.log('\n📋 Matching & Score Tests');

test('Perfect match returns 100', () => {
  const jdSkills = ['Java', 'Python', 'Docker'];
  const resumeSkills = ['Java', 'Python', 'Docker'];
  const analysis = analyzeSkills(resumeSkills, jdSkills);
  const score = calculateScore(analysis);
  assert.strictEqual(score, 100, 'Perfect match should be 100');
});

test('No match returns 0', () => {
  const jdSkills = ['COBOL', 'Fortran'];
  const resumeSkills = ['React', 'Vue'];
  const analysis = analyzeSkills(resumeSkills, jdSkills);
  const score = calculateScore(analysis);
  assert.strictEqual(score, 0, 'No match should be 0');
});

test('Partial match calculates correctly', () => {
  const jdSkills = ['Java', 'Python', 'Docker', 'Kafka'];
  const resumeSkills = ['Java', 'Python'];
  const analysis = analyzeSkills(resumeSkills, jdSkills);
  const score = calculateScore(analysis);
  assert.strictEqual(score, 50, 'Half match should be 50');
});

test('Skill analysis marks matched skills', () => {
  const jdSkills = ['Java', 'Python'];
  const resumeSkills = ['Java'];
  const analysis = analyzeSkills(resumeSkills, jdSkills);
  const javaEntry = analysis.find(a => a.skill === 'Java');
  const pyEntry = analysis.find(a => a.skill === 'Python');
  assert.strictEqual(javaEntry.presentInResume, true, 'Java should be present');
  assert.strictEqual(pyEntry.presentInResume, false, 'Python should be absent');
});

test('Skill matching is case insensitive', () => {
  assert.ok(skillMatches('java', 'Java'), 'Should match case insensitively');
  assert.ok(skillMatches('DOCKER', 'docker'), 'Should match uppercase');
});

test('Alias matching works', () => {
  assert.ok(skillMatches('Node.js', 'nodejs'), 'Node.js should match nodejs');
  assert.ok(skillMatches('PostgreSQL', 'postgres'), 'PostgreSQL should match postgres');
});

// ─── RESULTS ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);

if (failed > 0) {
  console.log('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!\n');
}
