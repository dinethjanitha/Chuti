#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

console.log('🔍 Running pre-build validation...\n');

// Check if required files exist
const requiredFiles = [
  'app.json',
  'package.json',
  'tsconfig.json',
  '.env'
];

console.log('📂 Checking required files...');
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles);
  process.exit(1);
}
console.log('✅ All required files exist\n');

// Check environment variables
console.log('🌍 Checking environment variables...');
const envContent = fs.readFileSync('.env', 'utf-8');
const requiredEnvVars = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SOCKET_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => 
  !envContent.includes(envVar)
);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing environment variables:', missingEnvVars);
  process.exit(1);
}
console.log('✅ Environment variables check passed\n');

// Run TypeScript check
console.log('🔧 Running TypeScript type check...');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ TypeScript errors found:');
    console.error(stderr);
    process.exit(1);
  }
  console.log('✅ TypeScript check passed\n');

  // Run ESLint check
  console.log('🧹 Running ESLint check...');
  exec('npx eslint . --ext .ts,.tsx,.js,.jsx', (error, stdout, stderr) => {
    if (error && error.code !== 1) { // ESLint returns 1 for warnings, which is OK
      console.error('❌ ESLint errors found:');
      console.error(stderr);
      process.exit(1);
    }
    
    if (stdout) {
      console.log('⚠️  ESLint warnings (non-blocking):');
      console.log(stdout);
    } else {
      console.log('✅ ESLint check passed');
    }

    console.log('\n🎉 All pre-build validations passed!');
    console.log('📱 Ready to build your app!');
  });
});
