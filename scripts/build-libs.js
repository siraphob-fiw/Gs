const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Build order based on dependency analysis
 * Libraries are grouped by dependency levels to ensure proper build sequence
 */
const buildOrder = [
  // Level 1: No internal dependencies - can build independently
  {
    level: 1,
    libraries: ['shared-types'],
    description: 'Base libraries with no internal dependencies'
  },
  
  // Level 2: Depends only on Level 1
  {
    level: 2,
    libraries: ['shared-utils'],
    description: 'Utilities depending on shared-types'
  },
  
  // Level 3: Depends on Level 1-2
  {
    level: 3,
    libraries: [
      'shared-validation',
      'shared-logging',
      'shared-database',
      'shared-middleware',
      'shared-external',
      'shared-i18n'
    ],
    description: 'Core services depending on types and utils'
  },
  
  // Level 4: Depends on Level 1-3
  {
    level: 4,
    libraries: [
      'shared-cache',
      'shared-monitoring',
      'shared-notifications',
    ],
    description: 'Advanced services depending on core services'
  },
  
  // Level 5: Depends on Level 1-4
  {
    level: 5,
    libraries: ['shared-security'],
    description: 'Security services depending on logging and database'
  },
  
  // Level 6: Depends on multiple libraries
  {
    level: 6,
    libraries: ['shared-testing'],
    description: 'Testing utilities depending on multiple libraries'
  }
];

/**
 * Check if a library exists and has a build script
 */
function checkLibraryExists(libName) {
  const libPath = path.join(process.cwd(), 'libs', libName);
  const packageJsonPath = path.join(libPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.warn(`⚠️  Library ${libName} not found at ${libPath}`);
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.build) {
      console.warn(`⚠️  Library ${libName} has no build script`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`⚠️  Error reading package.json for ${libName}:`, error.message);
    return false;
  }
}

/**
 * Build a single library
 */
function buildLibrary(libName) {
  console.log(`🔨 Building ${libName}...`);
  const startTime = Date.now();
  
  try {
    execSync(`npm run build --workspace=libs/${libName}`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${libName} built successfully (${duration}s)`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to build ${libName}:`);
    console.error(error.stdout || error.message);
    return false;
  }
}

/**
 * Build libraries in parallel within the same level
 */
async function buildLevel(levelInfo, options = {}) {
  const { parallel = false, continueOnError = false } = options;
  
  console.log(`\n📦 Level ${levelInfo.level}: ${levelInfo.description}`);
  console.log(`Libraries: ${levelInfo.libraries.join(', ')}`);
  
  // Filter out non-existent libraries
  const validLibraries = levelInfo.libraries.filter(checkLibraryExists);
  
  if (validLibraries.length === 0) {
    console.log(`⚠️  No valid libraries found in level ${levelInfo.level}`);
    return true;
  }
  
  if (parallel && validLibraries.length > 1) {
    // Build in parallel using Promise.all
    console.log(`🚀 Building ${validLibraries.length} libraries in parallel...`);
    
    const buildPromises = validLibraries.map(libName => 
      new Promise((resolve) => {
        const success = buildLibrary(libName);
        resolve({ libName, success });
      })
    );
    
    const results = await Promise.all(buildPromises);
    const failures = results.filter(r => !r.success);
    
    if (failures.length > 0 && !continueOnError) {
      console.error(`\n❌ ${failures.length} libraries failed to build in level ${levelInfo.level}`);
      failures.forEach(f => console.error(`   - ${f.libName}`));
      return false;
    }
    
    return true;
  } else {
    // Build sequentially
    for (const libName of validLibraries) {
      const success = buildLibrary(libName);
      if (!success && !continueOnError) {
        console.error(`\n❌ Build failed at ${libName} in level ${levelInfo.level}`);
        return false;
      }
    }
    return true;
  }
}

/**
 * Main build function
 */
async function buildLibraries(options = {}) {
  const { 
    parallel = false, 
    continueOnError = false, 
    levels = null,
    clean = false 
  } = options;
  
  console.log('🏗️  Starting StrengthOS Libraries Build Process');
  console.log(`Build mode: ${parallel ? 'Parallel within levels' : 'Sequential'}`);
  console.log(`Error handling: ${continueOnError ? 'Continue on error' : 'Stop on first error'}`);
  
  const startTime = Date.now();
  
  // Clean dist folders if requested
  if (clean) {
    console.log('\n🧹 Cleaning dist folders...');
    try {
      execSync('npm run clean --workspaces --if-present', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Clean command failed, continuing with build...');
    }
  }
  
  // Build specific levels if specified, otherwise build all
  const levelsToBuild = levels ? buildOrder.filter(l => levels.includes(l.level)) : buildOrder;
  
  for (const levelInfo of levelsToBuild) {
    const success = await buildLevel(levelInfo, { parallel, continueOnError });
    if (!success && !continueOnError) {
      console.error('\n💥 Build process terminated due to errors');
      process.exit(1);
    }
  }
  
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 All libraries built successfully in ${totalDuration}s`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    parallel: args.includes('--parallel'),
    continueOnError: args.includes('--continue-on-error'),
    clean: args.includes('--clean'),
    help: args.includes('--help') || args.includes('-h')
  };
  
  // Parse levels
  const levelsIndex = args.findIndex(arg => arg === '--levels');
  if (levelsIndex !== -1 && args[levelsIndex + 1]) {
    options.levels = args[levelsIndex + 1].split(',').map(l => parseInt(l.trim()));
  }
  
  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
🏗️  StrengthOS Libraries Build Script

Usage: node scripts/build-libs.js [options]

Options:
  --parallel           Build libraries in parallel within each dependency level
  --continue-on-error  Continue building even if some libraries fail
  --clean             Clean dist folders before building
  --levels <numbers>   Build only specific dependency levels (comma-separated)
  --help, -h          Show this help message

Examples:
  node scripts/build-libs.js
  node scripts/build-libs.js --parallel
  node scripts/build-libs.js --levels 1,2,3
  node scripts/build-libs.js --parallel --continue-on-error --clean

Dependency Levels:
${buildOrder.map(level => 
  `  Level ${level.level}: ${level.libraries.join(', ')}\n    ${level.description}`
).join('\n')}
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  // Add debug logging
  console.log('Starting build process with options:', options);
  
  buildLibraries(options).catch(error => {
    console.error('💥 Build script failed:', error);
    process.exit(1);
  });
}

module.exports = { buildLibraries, buildOrder, checkLibraryExists };
