#!/usr/bin/env node

/**
 * Pre-commit Hook: Check Locked Files
 * 
 * This script prevents accidental modifications to @locked files without
 * corresponding updates to contracts or tests.
 * 
 * Locked files are critical to the application and should not be changed
 * during refactoring without explicit approval and test updates.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const LOCKED_FILES = [
  'supabase/functions/booking-create-secure/index.ts',
  'supabase/functions/locks/index.ts',
  'src/pages/NewHostInterface.tsx',
  'supabase/functions/public-stripe-settings/index.ts',
];

const REQUIRED_FILES = [
  'src/lib/contracts.ts',
  'tests/smoke/01-booking-widget-no-deposit.spec.ts',
  'tests/smoke/02-locks-flow.spec.ts',
  'tests/smoke/04-public-stripe-settings.spec.ts',
];

console.log('🔒 Checking locked files...\n');

try {
  // Get changed files
  const changedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  const lockedFilesChanged = changedFiles.filter(file => 
    LOCKED_FILES.includes(file)
  );

  if (lockedFilesChanged.length === 0) {
    console.log('✅ No locked files changed\n');
    process.exit(0);
  }

  console.log('⚠️  Locked files changed:', lockedFilesChanged.join(', '), '\n');

  // Check if contracts or tests were also updated
  const contractsChanged = changedFiles.some(file => 
    REQUIRED_FILES.includes(file)
  );

  if (!contractsChanged) {
    console.error('❌ ERROR: Locked files modified without updating contracts or tests!\n');
    console.error('Locked files changed:');
    lockedFilesChanged.forEach(file => console.error(`  - ${file}`));
    console.error('\nYou must also update one of:');
    REQUIRED_FILES.forEach(file => console.error(`  - ${file}`));
    console.error('\nThis ensures that changes to critical files are validated by tests.');
    console.error('\nTo bypass (NOT RECOMMENDED): git commit --no-verify\n');
    process.exit(1);
  }

  console.log('✅ Contracts/tests updated alongside locked files\n');
  process.exit(0);

} catch (error) {
  console.error('❌ Error checking locked files:', error.message);
  process.exit(1);
}
