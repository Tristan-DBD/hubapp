const { execSync } = require('child_process');
const { version } = require('../package.json');

const tag = `v${version}`;
const apk = 'android/app/build/outputs/apk/release/app-arm64-v8a-release.apk';

try {
  console.log(`🔨 Building APK v${version}...`);
  execSync('npm run release', { stdio: 'inherit', cwd: __dirname + '/..' });

  console.log(`🏷️  Creating git tag ${tag}...`);
  execSync(`git tag ${tag}`, { stdio: 'inherit' });
  execSync('git push origin --tags', { stdio: 'inherit' });

  console.log(`📦 Publishing GitHub Release ${tag}...`);
  execSync(`gh release create ${tag} "${apk}" --generate-notes`, { stdio: 'inherit' });

  console.log(`✅ Done! https://github.com/Tristan-DBD/hubapp/releases/tag/${tag}`);
} catch (err) {
  console.error(`❌ Failed: ${err.message}`);
  process.exit(1);
}
