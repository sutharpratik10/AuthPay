#!/usr/bin/env node

/**
 * Fix incorrect import paths after restructure
 */

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Fix double helpers path
    const fixes = [
      { from: '@/lib/utils/helpers/helpers', to: '@/lib/utils/helpers' },
      { from: '@/lib/utils/helpers/config', to: '@/lib/utils/config' },
      { from: '@/lib/utils/helpers/constants', to: '@/lib/utils/constants' },
      { from: '@/lib/utils/helpers/analytics', to: '@/lib/utils/analytics' },
      { from: '@/lib/utils/helpers/client-info', to: '@/lib/utils/client-info' },
      { from: '@/lib/utils/helpers/subscription-utils', to: '@/lib/utils/subscription-utils' },
    ];

    fixes.forEach(({ from, to }) => {
      const fromQuoted = from.replace(/\//g, '\\/');
      const patterns = [
        new RegExp(`from ['"]${fromQuoted}['"]`, 'g'),
        new RegExp(`from ['"]${fromQuoted}/`, 'g'),
        new RegExp(`import\\(['"]${fromQuoted}['"]\\)`, 'g'),
        new RegExp(`require\\(['"]${fromQuoted}['"]\\)`, 'g'),
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, (match) => {
            updated = true;
            return match.replace(from, to);
          });
        }
      });
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
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

console.log('🔧 Fixing import paths...\n');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const files = walkDirectory(srcDir);
let totalFixed = 0;

for (const file of files) {
  if (fixImportsInFile(file)) {
    totalFixed++;
  }
}

console.log(`\n✅ Complete! Fixed ${totalFixed} files.`);
