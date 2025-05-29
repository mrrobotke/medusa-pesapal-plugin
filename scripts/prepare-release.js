#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const versionType = process.argv[2] || 'patch'; // patch, minor, major

console.log(`🚀 Preparing ${versionType} release for medusa-payment-pesapal`);

try {
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Update version
  console.log(`📈 Bumping ${versionType} version...`);
  execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });

  // Read updated version
  const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const newVersion = updatedPackageJson.version;

  console.log(`✅ Version updated to v${newVersion}`);
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Commit your changes: git add . && git commit -m "Release v' + newVersion + '"');
  console.log('3. Create and push tag: git tag v' + newVersion + ' && git push origin v' + newVersion);
  console.log('4. Create a GitHub release to trigger automatic npm publishing');

} catch (error) {
  console.error('❌ Release preparation failed:', error.message);
  process.exit(1);
} 