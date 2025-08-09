
#!/usr/bin/env node
// Host-only theme — do not import outside /host routes

const fs = require('fs');
const path = require('path');

const THEME_CSS_PATH = path.join(__dirname, '../src/theme/host-theme.css');
const TOKENS_PATH = path.join(__dirname, '../src/theme/host-tokens.ts');

function assertHostTheme() {
  console.log('🎨 Validating Host theme files...');

  // Check if theme files exist
  if (!fs.existsSync(THEME_CSS_PATH)) {
    console.error('❌ Host theme CSS file not found:', THEME_CSS_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(TOKENS_PATH)) {
    console.error('❌ Host tokens file not found:', TOKENS_PATH);
    process.exit(1);
  }

  // Read and validate CSS variables
  const cssContent = fs.readFileSync(THEME_CSS_PATH, 'utf8');
  
  const requiredVariables = [
    '--host-bg',
    '--host-card',
    '--host-text',
    '--host-border',
    '--host-muted',
    '--host-accent',
    '--host-sidebar-collapsed',
    '--host-sidebar-expanded'
  ];

  const missingVariables = [];
  
  for (const variable of requiredVariables) {
    if (!cssContent.includes(variable)) {
      missingVariables.push(variable);
    }
  }

  if (missingVariables.length > 0) {
    console.error('❌ Missing required CSS variables:', missingVariables.join(', '));
    process.exit(1);
  }

  // Validate that variables have values
  const variableRegex = /--(host-[\w-]+):\s*([^;]+);/g;
  let match;
  const emptyVariables = [];

  while ((match = variableRegex.exec(cssContent)) !== null) {
    const [, varName, value] = match;
    if (!value.trim() || value.trim() === '') {
      emptyVariables.push(`--${varName}`);
    }
  }

  if (emptyVariables.length > 0) {
    console.error('❌ Empty CSS variables found:', emptyVariables.join(', '));
    process.exit(1);
  }

  // Read and validate tokens file
  const tokensContent = fs.readFileSync(TOKENS_PATH, 'utf8');
  
  if (!tokensContent.includes('HOST_TOKENS')) {
    console.error('❌ HOST_TOKENS not found in tokens file');
    process.exit(1);
  }

  // Check for essential color tokens
  const requiredColors = ['background', 'card', 'text', 'border', 'muted'];
  const missingColors = [];

  for (const color of requiredColors) {
    if (!tokensContent.includes(`${color}:`)) {
      missingColors.push(color);
    }
  }

  if (missingColors.length > 0) {
    console.error('❌ Missing required color tokens:', missingColors.join(', '));
    process.exit(1);
  }

  console.log('✅ Host theme validation passed');
  console.log(`📊 Found ${requiredVariables.length} CSS variables`);
  console.log(`🎨 Found ${requiredColors.length} color tokens`);
}

// Run validation
try {
  assertHostTheme();
} catch (error) {
  console.error('❌ Host theme validation failed:', error.message);
  process.exit(1);
}
