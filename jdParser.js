/**
 * jdParser.js
 * Rule-based Job Description parser.
 * Extracts: Job ID, Role, Required Skills, Optional Skills, Summary
 */

'use strict';

const { extractSkills } = require('./resumeExtractor');

// ─── ROLE EXTRACTION ──────────────────────────────────────────────────────────

const ROLE_PATTERNS = [
  /(?:position|job title|role|title)\s*[:\-]\s*(.+)/i,
  /(?:we are looking for|seeking a?|hiring a?)\s+([A-Z][^\n,\.]{5,60})/i,
  /^([A-Z][A-Za-z\s\/\-]+(?:Engineer|Developer|Architect|Analyst|Scientist|Manager|Lead|Specialist|Consultant))\s*$/m
];

function extractRole(text) {
  for (const p of ROLE_PATTERNS) {
    const m = text.match(p);
    if (m) return m[1].trim().replace(/\s+/g, ' ').slice(0, 80);
  }
  // Fallback: look for common titles in first 500 chars
  const titleMatch = text.slice(0, 600).match(
    /\b((?:Software|Full.?Stack|Backend|Frontend|Cloud|DevOps|Data|ML|AI|Security|Systems?|Senior|Junior|Lead|Staff|Principal)\s+(?:Engineer|Developer|Architect|Scientist|Analyst|Specialist|Consultant|Lead)\b)/i
  );
  return titleMatch ? titleMatch[1] : 'Software Engineer';
}

// ─── SALARY EXTRACTION FROM JD ───────────────────────────────────────────────

const JD_SALARY_PATTERNS = [
  /\$\s*([\d,]+)\s*(?:\.00)?\s*(?:-|–|to)\s*\$\s*([\d,]+)/gi,
  /salary\s*[:\-]?\s*\$\s*([\d,]+)\s*(?:-|–|to)?\s*\$?\s*([\d,]+)?/gi,
  /(?:pay|compensation)\s+range\s*[:\-]?\s*\$\s*([\d,]+)\s*(?:-|–|to)\s*\$\s*([\d,]+)/gi,
  /base\s+(?:pay|salary|compensation)\s+range[^\n]*\$\s*([\d,]+)\s*(?:-|–)\s*\$\s*([\d,]+)/gi,
  // Indian format
  /(?:salary|ctc|compensation)\s*[:\-]?\s*([\d,.]+\s*lpa)/gi
];

function extractJdSalary(text) {
  for (const p of JD_SALARY_PATTERNS) {
    p.lastIndex = 0;
    const m = p.exec(text);
    if (m) {
      if (m[2]) return `$${m[1]} - $${m[2]}`;
      return `$${m[1]}`;
    }
  }
  return null;
}

// ─── ABOUT ROLE / SUMMARY EXTRACTION ─────────────────────────────────────────

const SUMMARY_HEADERS = [
  /(?:about\s+(?:the\s+)?(?:role|position|job)|job\s+summary|overview|position\s+overview|what\s+you(?:'ll|\s+will)\s+do|responsibilities|job\s+description)/i
];

function extractAboutRole(text) {
  for (const header of SUMMARY_HEADERS) {
    const idx = text.search(header);
    if (idx !== -1) {
      // Extract up to 300 chars after header
      const start = text.indexOf('\n', idx) + 1;
      const snippet = text.slice(start, start + 350).trim();
      // Clean up bullet points and extra whitespace
      return snippet
        .replace(/^[•\-\*]\s*/gm, '')
        .replace(/\n{2,}/g, ' ')
        .slice(0, 300)
        .trim();
    }
  }
  // Fallback: second paragraph
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
  if (paragraphs.length > 1) return paragraphs[1].trim().slice(0, 300);
  return text.slice(0, 300).trim();
}

// ─── REQUIRED VS OPTIONAL SKILLS ─────────────────────────────────────────────

const REQUIRED_SECTION_PATTERNS = [
  /required\s+(?:skills?|qualifications?|experience|technologies?|tech\s*stack)/i,
  /must\s+have/i,
  /basic\s+qualifications?/i,
  /minimum\s+qualifications?/i,
  /mandatory/i
];

const OPTIONAL_SECTION_PATTERNS = [
  /(?:good\s+to\s+have|nice\s+to\s+have|preferred\s+(?:qualifications?|skills?)|desired\s+(?:qualifications?|skills?|multipliers?)|optional)/i
];

function splitRequiredOptional(text) {
  let requiredSection = text;
  let optionalSection = '';

  // Try to find preferred/optional section
  for (const p of OPTIONAL_SECTION_PATTERNS) {
    const idx = text.search(p);
    if (idx !== -1) {
      requiredSection = text.slice(0, idx);
      optionalSection = text.slice(idx);
      break;
    }
  }

  return { requiredSection, optionalSection };
}

// ─── MAIN JD PARSER ───────────────────────────────────────────────────────────

/**
 * Parse a single JD text block
 * @param {string} text - Raw JD text
 * @param {string} jobId - Job ID string
 * @returns {object} - Structured JD object
 */
function parseJD(text, jobId) {
  const { requiredSection, optionalSection } = splitRequiredOptional(text);

  const requiredSkills = extractSkills(requiredSection);
  const optionalSkills = optionalSection
    ? extractSkills(optionalSection).filter(s => !requiredSkills.includes(s))
    : [];

  // All skills = required + optional (deduplicated)
  const allSkills = [...new Set([...requiredSkills, ...optionalSkills])];

  return {
    jobId,
    role: extractRole(text),
    salary: extractJdSalary(text),
    aboutRole: extractAboutRole(text),
    requiredSkills,
    optionalSkills,
    allSkills
  };
}

/**
 * Load and parse all JDs from the embedded data
 */
function parseAllJDs(jdArray) {
  return jdArray.map((jd, idx) => {
    const parsed = parseJD(jd.text, jd.jobId || `JD${String(idx + 1).padStart(3, '0')}`);
    return parsed;
  });
}

module.exports = { parseJD, parseAllJDs, extractJdSalary, extractRole };
