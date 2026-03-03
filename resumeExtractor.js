/**
 * resumeExtractor.js
 * Rule-based extraction of structured data from resume text.
 * Extracts: Name, Salary, Years of Experience, Skills
 */

'use strict';

const { ALL_SKILLS, SKILLS_MAP, SKILL_ALIASES } = require('./skills');

// ─── SALARY EXTRACTION ────────────────────────────────────────────────────────

/**
 * Salary patterns — handles LPA, CTC, per annum, USD ranges, hourly etc.
 */
const SALARY_PATTERNS = [
  // Indian format: 12 LPA, 12.5 LPA, ₹10,00,000
  /(?:current\s+salary|expected\s+salary|ctc|salary|package|compensation)\s*[:\-]?\s*([\d,.]+\s*(?:lpa|l\.p\.a|lakhs?\s*per\s*annum|lac|lakh))/gi,
  /(?:current\s+salary|expected\s+salary|ctc|salary|package|compensation)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:lpa|l\.p\.a|lakhs?\s*per\s*annum|pa|per\s+annum)/gi,
  // USD format: $120,000 or $120k
  /(?:salary|compensation|pay|ctc|package)\s*[:\-]?\s*\$?([\d,]+(?:k)?)\s*(?:-\s*\$?[\d,]+k?)?\s*(?:per\s+year|\/\s*year|annually|pa|usd)?/gi,
  // Standalone salary mention
  /\b([\d,.]+)\s*(lpa|l\.p\.a|lakhs?\s*per\s*annum)\b/gi,
  /\b(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)\s*(lpa|per\s+annum|pa)\b/gi,
  // CTC line
  /\bctc\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,.]+\s*(?:lpa|lakhs?|l)?)/gi
];

function extractSalary(text) {
  for (const pattern of SALARY_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const raw = match[0].trim();
      // Normalize
      const normalized = raw
        .replace(/current salary\s*[:\-]?\s*/i, '')
        .replace(/expected salary\s*[:\-]?\s*/i, '')
        .replace(/ctc\s*[:\-]?\s*/i, '')
        .replace(/salary\s*[:\-]?\s*/i, '')
        .replace(/compensation\s*[:\-]?\s*/i, '')
        .trim();
      return normalized || raw;
    }
  }
  return null;
}

// ─── EXPERIENCE EXTRACTION ────────────────────────────────────────────────────

/**
 * Date range months for calculation
 */
const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

function parseDate(str) {
  if (!str) return null;
  str = str.trim().toLowerCase();

  if (str === 'present' || str === 'current' || str === 'till date' || str === 'now') {
    return new Date();
  }

  // MM/YYYY or MM-YYYY
  const mmyyyy = str.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (mmyyyy) {
    return new Date(parseInt(mmyyyy[2]), parseInt(mmyyyy[1]) - 1);
  }

  // YYYY
  const yyyy = str.match(/^(\d{4})$/);
  if (yyyy) {
    return new Date(parseInt(yyyy[1]), 0);
  }

  // Month YYYY or Month, YYYY
  const monthYear = str.match(/^([a-z]+)[,\s]+(\d{4})$/);
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1]];
    if (month !== undefined) {
      return new Date(parseInt(monthYear[2]), month);
    }
  }

  return null;
}

function calcYearsFromDateRange(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return 0;
  const diff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.round(diff * 10) / 10);
}

const EXP_PATTERNS = [
  // Explicit: "5 years of experience", "3+ years", "over 4 years"
  /(?:over|more\s+than|approximately|around|about)?\s*(\d+(?:\.\d+)?)\+?\s*(?:to\s+\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:experience|exp|work\s*exp)/gi,
  // "experience of 5 years"
  /experience\s+of\s+(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/gi,
  // "X years in industry"
  /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s+(?:in\s+(?:the\s+)?(?:industry|field|software|it|tech))/gi,
  // "Total experience: 5 years"
  /total\s*(?:work)?\s*experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/gi,
];

const DATE_RANGE_PATTERN = /([A-Za-z]+\.?\s*\d{4}|\d{4}|\d{1,2}\/\d{4})\s*(?:–|-|to)\s*([A-Za-z]+\.?\s*\d{4}|\d{4}|\d{1,2}\/\d{4}|present|current|till\s*date|now)/gi;

function extractExperience(text) {
  // First try explicit patterns
  for (const pattern of EXP_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      return parseFloat(match[1]);
    }
  }

  // Fall back to date range calculation
  const ranges = [];
  let match;
  const datePattern = new RegExp(DATE_RANGE_PATTERN.source, 'gi');
  while ((match = datePattern.exec(text)) !== null) {
    const years = calcYearsFromDateRange(match[1], match[2]);
    if (years > 0 && years < 50) ranges.push(years);
  }

  if (ranges.length > 0) {
    // Return total or max (longest single role likely indicates career start)
    const total = ranges.reduce((a, b) => a + b, 0);
    return Math.round(total * 10) / 10;
  }

  return null;
}

// ─── NAME EXTRACTION ──────────────────────────────────────────────────────────

function extractName(text) {
  // Common resume name patterns — usually top of resume
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);

  // Try first non-empty line (most resumes start with name)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Name: likely 2-4 capitalized words, no digits, not a heading keyword
    const headingKeywords = /resume|curriculum|vitae|profile|summary|objective|experience|education|skills|contact/i;
    if (!headingKeywords.test(line) && /^[A-Z][a-z]+([\s\-][A-Z][a-z]+){1,3}$/.test(line)) {
      return line;
    }
  }

  // Pattern: "Name: John Doe"
  const namePattern = /(?:name|full\s+name)\s*[:\-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
  const match = namePattern.exec(text);
  if (match) return match[1].trim();

  return null;
}

// ─── SKILLS EXTRACTION ────────────────────────────────────────────────────────

/**
 * Escape special regex chars
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract skills using rule-based token matching
 * Uses word boundary matching for accuracy
 */
function extractSkills(text) {
  const normalizedText = text.toLowerCase();
  const foundSkills = new Set();

  // Match direct skills from dictionary
  for (const [lowerSkill, originalSkill] of SKILLS_MAP.entries()) {
    const escaped = escapeRegex(lowerSkill);
    // Use word boundary or punctuation boundary
    const regex = new RegExp(`(?:^|[\\s,;:/(\\[\\-])${escaped}(?:[\\s,;:/)\\]\\-]|$)`, 'i');
    if (regex.test(normalizedText)) {
      foundSkills.add(originalSkill);
    }
  }

  // Match aliases
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    const escaped = escapeRegex(alias);
    const regex = new RegExp(`(?:^|[\\s,;:/(\\[\\-])${escaped}(?:[\\s,;:/)\\]\\-]|$)`, 'i');
    if (regex.test(normalizedText)) {
      foundSkills.add(canonical);
    }
  }

  // Deduplicate substrings (e.g., if "Spring Boot" found, remove standalone "Spring" added by alias)
  const skillsArr = [...foundSkills];
  const final = skillsArr.filter(skill => {
    // Keep skill unless another found skill fully contains it (as a longer match)
    return !skillsArr.some(other =>
      other !== skill &&
      other.toLowerCase().includes(skill.toLowerCase()) &&
      other.length > skill.length
    );
  });

  return final.sort();
}

// ─── MAIN EXTRACTOR ───────────────────────────────────────────────────────────

/**
 * Extract all structured info from resume text
 */
function extractResumeData(text) {
  return {
    name: extractName(text),
    salary: extractSalary(text),
    yearOfExperience: extractExperience(text),
    resumeSkills: extractSkills(text)
  };
}

module.exports = {
  extractResumeData,
  extractSalary,
  extractExperience,
  extractSkills,
  extractName
};
