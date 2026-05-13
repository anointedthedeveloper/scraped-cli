const axios = require('axios');

async function investigateGitHubUser(username) {
  console.log(`\n🔍 Investigating GitHub user: ${username}\n`);
  
  try {
    // Get user profile
    const userRes = await axios.get(`https://api.github.com/users/${username}`);
    const user = userRes.data;
    
    console.log('='.repeat(60));
    console.log(`📊 GITHUB PROFILE: ${user.name || username}`);
    console.log('='.repeat(60));
    console.log(`\n👤 Username: ${user.login}`);
    console.log(`📝 Bio: ${user.bio || 'No bio available'}`);
    console.log(`📍 Location: ${user.location || 'Not specified'}`);
    console.log(`🏢 Company: ${user.company || 'Not specified'}`);
    console.log(`🌐 Website: ${user.blog || 'Not specified'}`);
    console.log(`\n📊 Stats:`);
    console.log(`   • Followers: ${user.followers}`);
    console.log(`   • Following: ${user.following}`);
    console.log(`   • Public Repos: ${user.public_repos}`);
    
    // Get repositories
    const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
    const repos = reposRes.data;
    
    console.log(`\n📁 Latest Repositories:`);
    repos.forEach((repo, i) => {
      console.log(`\n   ${i+1}. ${repo.name}`);
      console.log(`      📝 ${repo.description || 'No description'}`);
      console.log(`      ⭐ Stars: ${repo.stargazers_count} | 🍴 Forks: ${repo.forks_count}`);
      console.log(`      🔗 ${repo.html_url}`);
    });
    
    // Save full report
    const fs = require('fs');
    const report = {
      user: user,
      repositories: repos,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(`${username}-github-report.json`, JSON.stringify(report, null, 2));
    console.log(`\n✅ Full report saved to: ${username}-github-report.json`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run investigation
const username = 'anointedthedeveloper';
investigateGitHubUser(username);