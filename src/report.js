const fs = require('fs').promises;

/**
 * Generates a detailed report about a person or topic
 * @param {string} name - Person/topic name
 * @param {Object} data - Collected data
 * @returns {Object} - Formatted report
 */
function generateIntelligenceReport(name, data) {
  const report = {
    generatedAt: new Date().toISOString(),
    query: name,
    summary: {
      title: `Intelligence Report: ${name}`,
      overview: generateOverview(name, data),
      confidence: calculateConfidenceScore(data)
    },
    sections: {
      biography: extractBiographicalData(data),
      professional: extractProfessionalData(data),
      social: extractSocialData(data),
      news: extractNewsData(data),
      technical: extractTechnicalData(data),
      webPresence: extractWebPresence(data)
    },
    sources: collectSources(data),
    metadata: {
      totalSources: countSources(data),
      dataPoints: countDataPoints(data),
      lastUpdated: new Date().toISOString()
    }
  };
  
  return report;
}

/**
 * Generate overview text
 */
function generateOverview(name, data) {
  let overview = `${name} intelligence report compiled from multiple sources. `;
  
  if (data.wikipedia && data.wikipedia.found) {
    overview += `Wikipedia provides a summary: ${data.wikipedia.summary.substring(0, 200)}... `;
  }
  
  if (data.github && data.github.found) {
    overview += `GitHub presence detected with ${data.github.users.length} related profiles. `;
  }
  
  return overview;
}

/**
 * Calculate confidence score (0-100)
 */
function calculateConfidenceScore(data) {
  let score = 0;
  let factors = 0;
  
  if (data.wikipedia && data.wikipedia.found) {
    score += 30;
    factors++;
  }
  
  if (data.github && data.github.found) {
    score += 20;
    factors++;
  }
  
  if (data.news && data.news.results && data.news.results.length > 0) {
    score += Math.min(30, data.news.results.length * 5);
    factors++;
  }
  
  return factors > 0 ? Math.min(100, score) : 10;
}

/**
 * Extract biographical data
 */
function extractBiographicalData(data) {
  const bio = {
    name: data.query,
    summary: '',
    birthInfo: null,
    education: [],
    knownFor: []
  };
  
  if (data.wikipedia && data.wikipedia.found) {
    bio.summary = data.wikipedia.summary;
    bio.wikipediaUrl = data.wikipedia.url;
  }
  
  return bio;
}

/**
 * Extract professional data
 */
function extractProfessionalData(data) {
  const professional = {
    occupation: [],
    companies: [],
    skills: [],
    achievements: []
  };
  
  if (data.github && data.github.found) {
    professional.skills.push('Software Development');
    data.github.users.forEach(user => {
      professional.githubProfiles.push(user.username);
    });
  }
  
  return professional;
}

/**
 * Extract social media presence
 */
function extractSocialData(data) {
  return {
    twitter: null,
    linkedin: null,
    instagram: null,
    facebook: null,
    other: []
  };
}

/**
 * Extract news mentions
 */
function extractNewsData(data) {
  return {
    recentMentions: [],
    totalArticles: 0,
    sentiment: 'neutral'
  };
}

/**
 * Extract technical information
 */
function extractTechnicalData(data) {
  return {
    repositories: [],
    technologies: [],
    contributions: []
  };
}

/**
 * Extract web presence
 */
function extractWebPresence(data) {
  return {
    personalWebsite: null,
    blog: null,
    otherWebsites: []
  };
}

/**
 * Collect all sources
 */
function collectSources(data) {
  const sources = [];
  
  if (data.wikipedia && data.wikipedia.found) {
    sources.push({ name: 'Wikipedia', url: data.wikipedia.url, type: 'encyclopedia' });
  }
  
  if (data.github && data.github.found) {
    sources.push({ name: 'GitHub', type: 'development' });
  }
  
  return sources;
}

/**
 * Count total sources
 */
function countSources(data) {
  let count = 0;
  if (data.wikipedia && data.wikipedia.found) count++;
  if (data.github && data.github.found) count++;
  if (data.news && data.news.results) count += data.news.results.length;
  return count;
}

/**
 * Count total data points
 */
function countDataPoints(data) {
  let points = 0;
  if (data.wikipedia && data.wikipedia.summary) points += 10;
  if (data.github && data.github.users) points += data.github.users.length * 5;
  return points;
}

/**
 * Save report to file
 */
async function saveReport(report, filename = 'intelligence-report.json') {
  const jsonString = JSON.stringify(report, null, 2);
  await fs.writeFile(filename, jsonString, 'utf8');
  return filename;
}

module.exports = { generateIntelligenceReport, saveReport };