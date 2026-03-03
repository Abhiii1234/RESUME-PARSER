/**
 * matcher.js
 * Skill mapping and matching score calculation engine.
 * Score = (Matched JD Skills / Total JD Skills) × 100
 */

'use strict';

// ─── SKILL NORMALIZATION ──────────────────────────────────────────────────────

/**
 * Normalize a skill name for comparison
 * Handles: case, punctuation, common abbreviations
 */
function normalizeSkill(skill) {
  return skill
    .toLowerCase()
    .replace(/\.js$/, 'js')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s#\+\.\/]/g, '')
    .trim();
}

/**
 * Check if a resume skill matches a JD skill
 * Handles exact, partial, and alias matches
 */
function skillMatches(resumeSkill, jdSkill) {
  const rn = normalizeSkill(resumeSkill);
  const jn = normalizeSkill(jdSkill);

  // Exact match
  if (rn === jn) return true;

  // One contains the other (e.g., "Spring Boot" matches "Spring")
  if (rn.includes(jn) || jn.includes(rn)) return true;

  // Special aliases
  const aliases = {
    'javascript': ['js'],
    'typescript': ['ts'],
    'nodejs': ['node.js', 'node js'],
    'react': ['reactjs', 'react.js'],
    'vue': ['vuejs', 'vue.js'],
    'postgresql': ['postgres', 'pgsql'],
    'mongodb': ['mongo'],
    'kubernetes': ['k8s'],
    'c++': ['cpp', 'cplusplus'],
    'c#': ['csharp', 'c sharp'],
    '.net': ['dotnet', 'dot net'],
    'rest api': ['restful', 'rest', 'rest apis'],
    'machine learning': ['ml'],
    'artificial intelligence': ['ai'],
    'natural language processing': ['nlp'],
    'continuous integration': ['ci'],
    'git': ['github', 'gitlab', 'bitbucket', 'version control'],
    'bash': ['shell scripting', 'unix shell scripting', 'shell'],
    'linux': ['unix'],
    'elk': ['elk stack', 'elasticsearch kibana logstash']
  };

  for (const [canonical, aliasSet] of Object.entries(aliases)) {
    if ((rn === canonical || aliasSet.includes(rn)) &&
        (jn === canonical || aliasSet.includes(jn))) {
      return true;
    }
  }

  return false;
}

// ─── SKILL ANALYSIS ───────────────────────────────────────────────────────────

/**
 * Analyze which JD skills are present in the resume
 * @param {string[]} resumeSkills - Skills extracted from resume
 * @param {string[]} jdSkills - All skills required in JD
 * @returns {Array<{skill, presentInResume, category}>}
 */
function analyzeSkills(resumeSkills, jdSkills) {
  return jdSkills.map(jdSkill => {
    const found = resumeSkills.some(rs => skillMatches(rs, jdSkill));
    return {
      skill: jdSkill,
      presentInResume: found
    };
  });
}

// ─── SCORE CALCULATION ────────────────────────────────────────────────────────

/**
 * Calculate match score based on JD skill coverage
 * Formula: (Matched JD Skills / Total JD Skills) × 100
 */
function calculateScore(skillsAnalysis) {
  if (!skillsAnalysis || skillsAnalysis.length === 0) return 0;
  const total = skillsAnalysis.length;
  const matched = skillsAnalysis.filter(s => s.presentInResume).length;
  const score = (matched / total) * 100;
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

// ─── WEIGHTED SCORE (BONUS) ───────────────────────────────────────────────────

/**
 * Enhanced score: weights required skills higher than optional
 */
function calculateWeightedScore(resumeSkills, requiredSkills, optionalSkills) {
  const totalRequired = requiredSkills.length;
  const totalOptional = optionalSkills.length;

  const matchedRequired = requiredSkills.filter(s =>
    resumeSkills.some(rs => skillMatches(rs, s))
  ).length;

  const matchedOptional = optionalSkills.filter(s =>
    resumeSkills.some(rs => skillMatches(rs, s))
  ).length;

  if (totalRequired === 0 && totalOptional === 0) return 0;

  // Required: 70% weight, Optional: 30% weight
  const requiredScore = totalRequired > 0 ? (matchedRequired / totalRequired) * 70 : 0;
  const optionalScore = totalOptional > 0 ? (matchedOptional / totalOptional) * 30 : 0;

  const score = (totalOptional > 0)
    ? requiredScore + optionalScore
    : (totalRequired > 0 ? (matchedRequired / totalRequired) * 100 : 0);

  return Math.round(score * 10) / 10;
}

// ─── FULL MATCH RESULT ────────────────────────────────────────────────────────

/**
 * Generate full matching result for one JD against a resume
 */
function matchResumeToJD(resumeData, jd) {
  const { resumeSkills } = resumeData;

  // Skill analysis covers ALL JD skills (required + optional)
  const skillsAnalysis = analyzeSkills(resumeSkills, jd.allSkills);

  // Primary score: based on all JD skills
  const matchingScore = calculateScore(skillsAnalysis);

  // Weighted score (bonus metric)
  const weightedScore = calculateWeightedScore(
    resumeSkills,
    jd.requiredSkills,
    jd.optionalSkills
  );

  const matchedCount = skillsAnalysis.filter(s => s.presentInResume).length;
  const totalCount = skillsAnalysis.length;

  return {
    jobId: jd.jobId,
    role: jd.role,
    salary: jd.salary,
    aboutRole: jd.aboutRole,
    skillsAnalysis,
    matchingScore,
    weightedScore,
    matchedSkillsCount: matchedCount,
    totalSkillsCount: totalCount,
    summary: `${matchedCount}/${totalCount} skills matched`
  };
}

/**
 * Match a resume against all JDs and sort by score
 */
function matchResumeToAllJDs(resumeData, parsedJDs) {
  const matches = parsedJDs.map(jd => matchResumeToJD(resumeData, jd));
  // Sort by matching score descending
  return matches.sort((a, b) => b.matchingScore - a.matchingScore);
}

module.exports = {
  analyzeSkills,
  calculateScore,
  calculateWeightedScore,
  matchResumeToJD,
  matchResumeToAllJDs,
  skillMatches,
  normalizeSkill
};
