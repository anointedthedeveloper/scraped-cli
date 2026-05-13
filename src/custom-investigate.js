/**
 * Custom investigation for a specific person
 */
async function customInvestigation(name, githubUsername) {
  console.error(`\n🔍 CUSTOM INVESTIGATION for: ${name}`);
  
  const results = {
    name: name,
    timestamp: new Date().toISOString(),
    github: await getDetailedGitHubInfo(githubUsername),
    webPresence: await findWebPresence(name),
    projects: await findProjects(name),
    socialMedia: await findSocialMedia(name)
  };
  
  return results;
}

async function getDetailedGitHubInfo(username) {
  try {
    const axios = require('axios');
    
    // Get user info
    const userResponse = await axios.get(`https://api.github.com/users/${username}`);
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
    
    return {
      username: username,
      name: userResponse.data.name,
      bio: userResponse.data.bio,
      location: userResponse.data.location,
      company: userResponse.data.company,
      website: userResponse.data.blog,
      followers: userResponse.data.followers,
      following: userResponse.data.following,
      publicRepos: userResponse.data.public_repos,
      repositories: reposResponse.data.map(repo => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        url: repo.html_url
      }))
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function findWebPresence(name) {
  // Search for personal website, blog, etc.
  const searchResults = [];
  
  // Common patterns
  const possibleUrls = [
    `https://${name.toLowerCase().replace(/ /g, '')}.com`,
    `https://${name.toLowerCase().replace(/ /g, '')}.dev`,
    `https://www.${name.toLowerCase().replace(/ /g, '')}.io`
  ];
  
  return { possibleUrls, searchResults };
}

async function findProjects(name) {
  // Search for projects, contributions
  return {
    notableProjects: [],
    contributions: []
  };
}

async function findSocialMedia(name) {
  const platforms = {
    twitter: `https://twitter.com/search?q=${encodeURIComponent(name)}`,
    linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`,
    instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(name.replace(/ /g, ''))}/`
  };
  
  return platforms;
}

module.exports = { customInvestigation };