#!/usr/bin/env node

/**
 * This script updates all import paths after the folder restructure
 * Run with: node scripts/update-imports.js
 */

const fs = require('fs');
const path = require('path');

// Define the import mappings (old path -> new path)
const importMappings = {
  // Config files
  '@/auth.config': '@/config/auth.config',
  '@/auth': '@/config/auth',
  '../auth.config': '../config/auth.config',
  '../../auth.config': '../../config/auth.config',
  '../../../auth.config': '../../../config/auth.config',
  
  // API utilities
  '@/lib/api-helpers': '@/lib/api/helpers',
  '@/lib/api-permissions': '@/lib/api/permissions',
  
  // Auth utilities
  '@/lib/session-manager': '@/lib/auth/session-manager',
  '@/lib/session-validation': '@/lib/auth/session-validation',
  '@/lib/password-strength': '@/lib/auth/password-strength',
  '@/lib/role-utils': '@/lib/auth/role-utils',
  
  // Cache
  '@/lib/query-cache': '@/lib/cache/query-cache',
  
  // General utilities
  '@/lib/analytics': '@/lib/utils/analytics',
  '@/lib/client-info': '@/lib/utils/client-info',
  '@/lib/config': '@/lib/utils/config',
  '@/lib/constants': '@/lib/utils/constants',
  '@/lib/subscription-utils': '@/lib/utils/subscription-utils',
  '@/lib/utils': '@/lib/utils/helpers',
  '@/lib/initialize-server': '@/lib/utils/initialize-server',
  
  // Database (old db -> server/db)
  '@/db': '@/server/db',
  '../db': '../server/db',
  '../../db': '../../server/db',
  '../../../db': '../../../server/db',
  '../../../../db': '../../../../server/db',
  
  // Services (old services -> server/services)
  '@/services': '@/server/services',
  '../services': '../server/services',
  '../../services': '../../server/services',
  '../../../services': '../../../server/services',
  
  // Context
  '@/lib/auth-context': '@/contexts/auth-context',
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update each import mapping
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      // Match import/export statements
      const patterns = [
        new RegExp(`from ['"]${oldPath.replace(/\//g, '\\/')}['"]`, 'g'),
        new RegExp(`from ['"]${oldPath.replace(/\//g, '\\/')}/`, 'g'),
        new RegExp(`import\\(['"]${oldPath.replace(/\//g, '\\/')}['"]\\)`, 'g'),
        new RegExp(`import\\(['"]${oldPath.replace(/\//g, '\\/')}/`, 'g'),
        new RegExp(`require\\(['"]${oldPath.replace(/\//g, '\\/')}['"]\\)`, 'g'),
        new RegExp(`require\\(['"]${oldPath.replace(/\//g, '\\/')}/`, 'g'),
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, (match) => {
            updated = true;
            return match.replace(oldPath, newPath);
          });
        }
      });
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, and other build folders
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(item)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
console.log('🔄 Starting import path updates...\n');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const testsDir = path.join(rootDir, 'tests');
const scriptsDir = path.join(rootDir, 'scripts');

const dirsToProcess = [srcDir];
if (fs.existsSync(testsDir)) dirsToProcess.push(testsDir);
if (fs.existsSync(scriptsDir)) dirsToProcess.push(scriptsDir);

let totalUpdated = 0;

for (const dir of dirsToProcess) {
  console.log(`\n📁 Processing: ${dir}\n`);
  const files = walkDirectory(dir);
  
  for (const file of files) {
    if (updateImportsInFile(file)) {
      totalUpdated++;
    }
  }
}

console.log(`\n✅ Complete! Updated ${totalUpdated} files.`);
