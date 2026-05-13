const fs = require('fs').promises;

/**
 * Generates a detailed intelligence report
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
  let overview = `${name} intelligence report compiled from multiple open sources. `;
  
  if (data.wikipedia && data.wikipedia.found) {
    overview += `Wikipedia provides biographical information: ${data.wikipedia.summary.substring(0, 150)}... `;
  }
  
  if (data.github && data.github.found) {
    const userCount = data.github.users.length;
    overview += `GitHub presence detected with ${userCount} related profile${userCount > 1 ? 's' : ''}. `;
  }
  
  if (data.news && data.news.found && data.news.articles) {
    overview += `${data.news.articles.length} recent news articles found. `;
  }
  
  if (!data.wikipedia.found && !data.github.found && (!data.news || !data.news.found)) {
    overview += `Limited public information available. Results may be incomplete.`;
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
    score += 25;
    factors++;
  }
  
  if (data.news && data.news.found && data.news.articles) {
    score += Math.min(25, data.news.articles.length * 5);
    factors++;
  }
  
  if (data.academic && data.academic.found) {
    score += 10;
    factors++;
  }
  
  if (data.social && data.social.found) {
    score += 10;
    factors++;
  }
  
  return factors > 0 ? Math.min(100, score) : 15;
}

/**
 * Extract biographical data
 */
function extractBiographicalData(data) {
  const bio = {
    name: data.query,
    summary: '',
    knownFor: []
  };
  
  if (data.wikipedia && data.wikipedia.found) {
    bio.summary = data.wikipedia.summary;
    bio.wikipediaUrl = data.wikipedia.url;
    if (data.wikipedia.description) {
      bio.description = data.wikipedia.description;
    }
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
    professional.githubProfiles = data.github.users.map(u => u.username);
    
    // Extract skills from GitHub bios
    data.github.users.forEach(user => {
      if (user.bio) {
        const possibleSkills = extractSkills(user.bio);
        professional.skills.push(...possibleSkills);
      }
    });
    
    professional.skills = [...new Set(professional.skills)];
  }
  
  return professional;
}

/**
 * Extract skills from text
 */
function extractSkills(text) {
  const skillKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'AI', 'ML', 'Developer', 'Engineer'];
  return skillKeywords.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
}

/**
 * Extract social media data
 */
function extractSocialData(data) {
  const social = {
    platforms: [],
    profiles: []
  };
  
  if (data.social && data.social.found) {
    if (data.social.platforms) {
      social.platforms = Object.keys(data.social.platforms);
    }
  }
  
  return social;
}

/**
 * Extract news data
 */
function extractNewsData(data) {
  const news = {
    recentMentions: [],
    totalArticles: 0,
    sentiment: 'neutral'
  };
  
  if (data.news && data.news.found && data.news.articles) {
    news.totalArticles = data.news.articles.length;
    news.recentMentions = data.news.articles.slice(0, 5).map(article => ({
      title: article.title,
      date: article.publishedAt,
      source: article.source
    }));
  }
  
  return news;
}

/**
 * Extract technical information
 */
function extractTechnicalData(data) {
  const technical = {
    repositories: [],
    technologies: [],
    contributions: []
  };
  
  if (data.github && data.github.found) {
    data.github.users.forEach(user => {
      if (user.publicRepos) {
        technical.contributions.push(`${user.username}: ${user.publicRepos} public repositories`);
      }
    });
  }
  
  return technical;
}

/**
 * Extract web presence
 */
function extractWebPresence(data) {
  const webPresence = {
    websites: [],
    socialLinks: []
  };
  
  if (data.wikipedia && data.wikipedia.found && data.wikipedia.url) {
    webPresence.websites.push(data.wikipedia.url);
  }
  
  if (data.github && data.github.found) {
    data.github.users.forEach(user => {
      if (user.profileUrl) {
        webPresence.websites.push(user.profileUrl);
      }
    });
  }
  
  if (data.social && data.social.platforms) {
    Object.values(data.social.platforms).forEach(url => {
      if (url) webPresence.socialLinks.push(url);
    });
  }
  
  return webPresence;
}

/**
 * Collect all sources
 */
function collectSources(data) {
  const sources = [];
  
  if (data.wikipedia && data.wikipedia.found) {
    sources.push({ 
      name: 'Wikipedia', 
      url: data.wikipedia.url, 
      type: 'encyclopedia',
      reliability: 'high'
    });
  }
  
  if (data.github && data.github.found) {
    sources.push({ 
      name: 'GitHub', 
      type: 'development',
      reliability: 'high'
    });
  }
  
  if (data.news && data.news.found && data.news.articles) {
    data.news.articles.slice(0, 3).forEach(article => {
      sources.push({
        name: article.source,
        url: article.url,
        type: 'news',
        reliability: 'medium'
      });
    });
  }
  
  if (data.social && data.social.found) {
    sources.push({
      name: 'Social Media',
      type: 'social',
      reliability: 'low'
    });
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
  if (data.news && data.news.found && data.news.articles) count += data.news.articles.length;
  if (data.academic && data.academic.found) count++;
  return count;
}

/**
 * Count total data points
 */
function countDataPoints(data) {
  let points = 0;
  if (data.wikipedia && data.wikipedia.summary) points += 50;
  if (data.github && data.github.users) points += data.github.users.length * 20;
  if (data.news && data.news.articles) points += data.news.articles.length * 10;
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

module.exports = { 
  generateIntelligenceReport, 
  saveReport,
  calculateConfidenceScore
};