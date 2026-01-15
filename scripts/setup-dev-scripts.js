const fs = require('fs');
const path = require('path');

/**
 * Library configuration with their specific dev/watch script needs
 */
const libraryConfigs = {
  'shared-types': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'naming-standards': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-utils': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-validation': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-logging': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-middleware': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-external': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-i18n': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-database': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-monitoring': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-notifications': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-ui': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-cache': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-security': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  },
  'shared-testing': {
    devScript: 'tsc --watch',
    watchScript: 'tsc --watch --preserveWatchOutput'
  }
};

/**
 * Update a single library's package.json with dev scripts
 */
function updateLibraryPackageJson(libName, config) {
  const libPath = path.join(process.cwd(), 'libs', libName);
  const packageJsonPath = path.join(libPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.warn(`⚠️  Library ${libName} not found at ${libPath}`);
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Ensure scripts object exists
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add dev and watch scripts
    packageJson.scripts.dev = config.devScript;
    packageJson.scripts['dev:watch'] = config.watchScript;
    
    // Add clean script if it doesn't exist
    if (!packageJson.scripts.clean) {
      packageJson.scripts.clean = 'rimraf dist';
    }
    
    // Add typecheck script if it doesn't exist
    if (!packageJson.scripts.typecheck) {
      packageJson.scripts.typecheck = 'tsc --noEmit';
    }
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated ${libName} package.json`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${libName}:`, error.message);
    return false;
  }
}

/**
 * Main function to update all libraries
 */
function setupDevScripts() {
  console.log('�� Setting up development scripts for all libraries...\n');
  
  let successCount = 0;
  let totalCount = Object.keys(libraryConfigs).length;
  
  for (const [libName, config] of Object.entries(libraryConfigs)) {
    if (updateLibraryPackageJson(libName, config)) {
      successCount++;
    }
  }
  
  console.log(`\n🎉 Setup complete! Updated ${successCount}/${totalCount} libraries`);
  
  if (successCount === totalCount) {
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run dev:libs:watch');
    console.log('2. In another terminal, run your app: npm run dev:api or npm run dev:training');
    console.log('3. Or run everything together: npm run dev:full');
    console.log('\n📁 Configuration files:');
    console.log('- turbo.json: Production builds');
    console.log('- turbo.dev.json: Development with watch mode');
  }
}

// Run if called directly
if (require.main === module) {
  setupDevScripts();
}

module.exports = { setupDevScripts, updateLibraryPackageJson, libraryConfigs };
