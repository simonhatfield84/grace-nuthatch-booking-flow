
#!/usr/bin/env node
// Host-only theme — do not import outside /host routes

const fs = require('fs');
const path = require('path');

const THEME_CSS_PATH = path.join(__dirname, '../src/theme/host-theme.css');
const TOKENS_PATH = path.join(__dirname, '../src/theme/host-tokens.ts');
const HOST_LAYOUT_PATH = path.join(__dirname, '../src/components/layouts/HostLayout.tsx');
const SNAPSHOTS_DIR = path.join(__dirname, '../public/theme-snapshots');

function assertHostTheme() {
  console.log('🎨 Validating Host theme files...');

  let errors = [];
  let warnings = [];

  // Check if theme files exist
  if (!fs.existsSync(THEME_CSS_PATH)) {
    errors.push(`❌ Host theme CSS file not found: ${THEME_CSS_PATH}`);
  }

  if (!fs.existsSync(TOKENS_PATH)) {
    errors.push(`❌ Host tokens file not found: ${TOKENS_PATH}`);
  }

  if (!fs.existsSync(HOST_LAYOUT_PATH)) {
    errors.push(`❌ Host layout file not found: ${HOST_LAYOUT_PATH}`);
  }

  if (errors.length > 0) {
    console.error('\n' + errors.join('\n'));
    console.error('\n🔧 To fix: Ensure all required Host theme files exist.');
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
    errors.push(`❌ Missing required CSS variables: ${missingVariables.join(', ')}`);
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
    errors.push(`❌ Empty CSS variables found: ${emptyVariables.join(', ')}`);
  }

  // Check for .host-app selector
  if (!cssContent.includes('.host-app')) {
    errors.push('❌ .host-app selector not found in CSS file');
  }

  // Read and validate tokens file
  const tokensContent = fs.readFileSync(TOKENS_PATH, 'utf8');
  
  if (!tokensContent.includes('HOST_TOKENS')) {
    errors.push('❌ HOST_TOKENS not found in tokens file');
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
    errors.push(`❌ Missing required color tokens: ${missingColors.join(', ')}`);
  }

  // Validate HOST_TOKENS structure
  try {
    const tokensMatch = tokensContent.match(/export const HOST_TOKENS[^=]*=\s*({[\s\S]*?});/);
    if (tokensMatch) {
      const tokensString = tokensMatch[1];
      // Basic structure validation
      const requiredSections = ['colors', 'typography', 'layout', 'breakpoints'];
      const missingSections = requiredSections.filter(section => !tokensString.includes(`${section}:`));
      
      if (missingSections.length > 0) {
        errors.push(`❌ Missing HOST_TOKENS sections: ${missingSections.join(', ')}`);
      }
    }
  } catch (error) {
    errors.push(`❌ Failed to parse HOST_TOKENS structure: ${error.message}`);
  }

  // Validate Host Layout wrapper
  const layoutContent = fs.readFileSync(HOST_LAYOUT_PATH, 'utf8');
  
  if (!layoutContent.includes('host-app')) {
    errors.push('❌ .host-app wrapper class missing from HostLayout component');
  }

  if (!layoutContent.includes('dark')) {
    warnings.push('⚠️  Dark class not found in HostLayout - this may cause theme issues');
  }

  if (!layoutContent.includes('import') || !layoutContent.includes('host-theme.css')) {
    errors.push('❌ host-theme.css not imported in HostLayout');
  }

  // Validate snapshot consistency (if snapshots exist)
  if (fs.existsSync(SNAPSHOTS_DIR)) {
    try {
      const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.startsWith('host-') && f.endsWith('.json'));
      if (snapshotFiles.length > 0) {
        const latestSnapshot = snapshotFiles.sort().pop();
        const snapshotPath = path.join(SNAPSHOTS_DIR, latestSnapshot);
        const snapshotData = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        
        // Compare current tokens with snapshot (basic check)
        if (snapshotData.tokens && snapshotData.tokens.colors) {
          const currentColors = requiredColors.filter(color => tokensContent.includes(`${color}:`));
          const snapshotColors = Object.keys(snapshotData.tokens.colors);
          
          if (currentColors.length !== snapshotColors.length) {
            warnings.push(`⚠️  Token structure changed since last snapshot (${latestSnapshot})`);
          }
        }
      }
    } catch (snapshotError) {
      warnings.push(`⚠️  Could not validate against snapshots: ${snapshotError.message}`);
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error('\n❌ HOST THEME VALIDATION FAILED\n');
    console.error(errors.join('\n'));
    
    console.error('\n🔧 HOW TO FIX:');
    console.error('1. Ensure all required CSS variables are defined with non-empty values');
    console.error('2. Verify HOST_TOKENS contains all required sections: colors, typography, layout, breakpoints');
    console.error('3. Check that HostLayout.tsx contains .host-app wrapper and imports host-theme.css');
    console.error('4. Run `npm run host:tokens` to regenerate design tokens if structure changed');
    console.error('5. Verify that no HOST_TOKEN keys were renamed without updating all references\n');
    
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  WARNINGS:');
    warnings.forEach(warning => console.warn(warning));
  }

  console.log('\n✅ Host theme validation passed');
  console.log(`📊 Validated ${requiredVariables.length} CSS variables`);
  console.log(`🎨 Validated ${requiredColors.length} color tokens`);
  console.log(`🔧 Checked ${requiredSections.length} token sections`);
  
  return true;
}

function generateSnapshot() {
  try {
    console.log('📸 Creating theme snapshot...');
    
    // Ensure snapshots directory exists
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
      fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    }

    // Read current tokens
    const tokensContent = fs.readFileSync(TOKENS_PATH, 'utf8');
    const cssContent = fs.readFileSync(THEME_CSS_PATH, 'utf8');

    // Extract CSS variables
    const cssVariables = {};
    const variableRegex = /--(host-[\w-]+):\s*([^;]+);/g;
    let match;
    while ((match = variableRegex.exec(cssContent)) !== null) {
      const [, varName, value] = match;
      cssVariables[`--${varName}`] = value.trim();
    }

    // Create snapshot
    const snapshot = {
      timestamp: new Date().toISOString(),
      version: `build-${Date.now()}`,
      tokens: null, // Would extract actual tokens in real implementation
      cssVariables,
      validation: {
        requiredVariables: Object.keys(cssVariables).length,
        hasHostAppSelector: cssContent.includes('.host-app'),
        hasLayoutWrapper: fs.existsSync(HOST_LAYOUT_PATH) && fs.readFileSync(HOST_LAYOUT_PATH, 'utf8').includes('host-app')
      }
    };

    // Save snapshot
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const snapshotPath = path.join(SNAPSHOTS_DIR, `host-${timestamp}-${Date.now().toString().slice(-6)}.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    // Update index
    const indexPath = path.join(SNAPSHOTS_DIR, 'index.json');
    const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.startsWith('host-') && f.endsWith('.json'));
    fs.writeFileSync(indexPath, JSON.stringify(snapshotFiles, null, 2));

    console.log(`✅ Snapshot created: ${path.basename(snapshotPath)}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create snapshot:', error.message);
    return false;
  }
}

// Run validation
try {
  const isValid = assertHostTheme();
  
  if (isValid && process.argv.includes('--create-snapshot')) {
    generateSnapshot();
  }
} catch (error) {
  console.error('❌ Host theme validation failed:', error.message);
  process.exit(1);
}
