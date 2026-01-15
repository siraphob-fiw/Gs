const fs = require('fs');
const path = require('path');

/**
 * Environment-specific turbo configuration setup
 */
const configs = {
  development: 'turbo.dev.json',
  production: 'turbo.prod.json',
  staging: 'turbo.staging.json'
};

/**
 * Copy environment-specific config to turbo.json
 */
function setupTurboConfig(environment = 'development') {
  const configFile = configs[environment];
  
  if (!configFile) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log('Available environments:', Object.keys(configs).join(', '));
    process.exit(1);
  }
  
  const configPath = path.join(process.cwd(), configFile);
  const targetPath = path.join(process.cwd(), 'turbo.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configFile}`);
    console.log('Available config files:', Object.values(configs).filter(f => fs.existsSync(path.join(process.cwd(), f))).join(', '));
    process.exit(1);
  }
  
  try {
    // Read the environment-specific config
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Validate JSON
    JSON.parse(configContent);
    
    // Copy to turbo.json
    fs.writeFileSync(targetPath, configContent);
    
    console.log(`✅ Switched to ${environment} configuration`);
    console.log(`   Source: ${configFile}`);
    console.log(`   Target: turbo.json`);
    
    // Show current config info
    const config = JSON.parse(configContent);
    const taskCount = Object.keys(config.tasks || {}).length;
    console.log(`   Tasks: ${taskCount}`);
    
  } catch (error) {
    console.error(`❌ Error setting up config:`, error.message);
    process.exit(1);
  }
}

/**
 * Show current configuration status
 */
function showStatus() {
  console.log('�� Current Turbo Configuration Status:\n');
  
  // Check which config files exist
  Object.entries(configs).forEach(([env, file]) => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`${exists ? '✅' : '❌'} ${env.padEnd(12)} - ${file}`);
  });
  
  // Check current turbo.json
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  if (fs.existsSync(turboJsonPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(turboJsonPath, 'utf8'));
      const taskCount = Object.keys(config.tasks || {}).length;
      console.log(`\n�� Current turbo.json: ${taskCount} tasks`);
    } catch (error) {
      console.log('\n❌ Current turbo.json: Invalid JSON');
    }
  } else {
    console.log('\n❌ Current turbo.json: Not found');
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
��️  Turbo Configuration Manager

Usage: node scripts/setup-turbo-config.js [environment] [options]

Environments:
  development  - Development configuration with watch mode
  production   - Production configuration with caching
  staging      - Staging configuration

Options:
  --status     Show current configuration status
  --help, -h   Show this help message

Examples:
  node scripts/setup-turbo-config.js development
  node scripts/setup-turbo-config.js production
  node scripts/setup-turbo-config.js --status

Configuration Files:
  turbo.dev.json     - Development config (watch mode, no cache)
  turbo.prod.json    - Production config (cached builds)
  turbo.staging.json - Staging config (production-like with dev features)
`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    return { help: true };
  }
  
  if (args.includes('--status')) {
    return { status: true };
  }
  
  const environment = args.find(arg => !arg.startsWith('--'));
  return { environment: environment || 'development' };
}

/**
 * Main execution
 */
function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  if (args.status) {
    showStatus();
    process.exit(0);
  }
  
  setupTurboConfig(args.environment);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { setupTurboConfig, showStatus, configs };