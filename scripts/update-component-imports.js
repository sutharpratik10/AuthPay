#!/usr/bin/env node

/**
 * Update component import paths after Phase 3 reorganization
 */

const fs = require('fs');
const path = require('path');

const componentMappings = {
  // Layout components
  '@/components/navigationbar': '@/components/layout/navigationbar',
  '@/components/footer': '@/components/layout/footer',
  '@/components/client-layout': '@/components/layout/client-layout',
  '@/components/SidebarMenu': '@/components/layout/SidebarMenu',
  
  // Shared components
  '@/components/CookieBanner': '@/components/shared/CookieBanner',
  '@/components/mode-toggle': '@/components/shared/mode-toggle',
  '@/components/theme-loader': '@/components/shared/theme-loader',
  '@/components/theme-provider': '@/components/shared/theme-provider',
  '@/components/error': '@/components/shared/error',
  '@/components/SessionInit': '@/components/shared/SessionInit',
  '@/components/ForceRedirect': '@/components/shared/ForceRedirect',
  
  // Auth components
  '@/components/auth-links': '@/components/auth/auth-links',
  
  // User components
  '@/components/UserProfileDropdown': '@/components/user/UserProfileDropdown',
  '@/components/SubscriptionDashboard': '@/components/user/SubscriptionDashboard',
  '@/components/SubscriptionPlansSelector': '@/components/user/SubscriptionPlansSelector',
  '@/components/DeleteAccountModal': '@/components/user/DeleteAccountModal',
  
  // Relative path updates for files in components folder
  '../navigationbar': '../layout/navigationbar',
  '../footer': '../layout/footer',
  '../client-layout': '../layout/client-layout',
  '../SidebarMenu': '../layout/SidebarMenu',
  '../CookieBanner': '../shared/CookieBanner',
  '../mode-toggle': '../shared/mode-toggle',
  '../theme-loader': '../shared/theme-loader',
  '../theme-provider': '../shared/theme-provider',
  '../error': '../shared/error',
  '../SessionInit': '../shared/SessionInit',
  '../ForceRedirect': '../shared/ForceRedirect',
  '../auth-links': './auth-links',
  '../UserProfileDropdown': '../user/UserProfileDropdown',
  '../SubscriptionDashboard': '../user/SubscriptionDashboard',
  '../SubscriptionPlansSelector': '../user/SubscriptionPlansSelector',
  '../DeleteAccountModal': '../user/DeleteAccountModal',
  
  // Additional relative paths from nested folders
  '../../navigationbar': '../../layout/navigationbar',
  '../../footer': '../../layout/footer',
  '../../client-layout': '../../layout/client-layout',
  '../../SidebarMenu': '../../layout/SidebarMenu',
  '../../CookieBanner': '../../shared/CookieBanner',
  '../../SessionInit': '../../shared/SessionInit',
  '../../ForceRedirect': '../../shared/ForceRedirect',
  '../../auth-links': '../auth-links',
  '../../UserProfileDropdown': '../../user/UserProfileDropdown',
  '../../SubscriptionDashboard': '../../user/SubscriptionDashboard',
  '../../DeleteAccountModal': '../../user/DeleteAccountModal',
  
  './navigationbar': './layout/navigationbar',
  './footer': './layout/footer',
  './SidebarMenu': './layout/SidebarMenu',
  './CookieBanner': './shared/CookieBanner',
  './mode-toggle': './shared/mode-toggle',
  './theme-loader': './shared/theme-loader',
  './theme-provider': './shared/theme-provider',
  './SessionInit': './shared/SessionInit',
  './auth-links': './auth/auth-links',
  './UserProfileDropdown': './user/UserProfileDropdown',
  './SubscriptionDashboard': './user/SubscriptionDashboard',
  './SubscriptionPlansSelector': './user/SubscriptionPlansSelector',
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    for (const [oldPath, newPath] of Object.entries(componentMappings)) {
      const oldPathEscaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const patterns = [
        new RegExp(`from ['"]${oldPathEscaped}['"]`, 'g'),
        new RegExp(`from ['"]${oldPathEscaped}/`, 'g'),
        new RegExp(`import\\(['"]${oldPathEscaped}['"]\\)`, 'g'),
        new RegExp(`import\\(['"]${oldPathEscaped}/`, 'g'),
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

console.log('🔄 Updating component imports (Phase 3)...\n');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const files = walkDirectory(srcDir);
let totalUpdated = 0;

for (const file of files) {
  if (updateImportsInFile(file)) {
    totalUpdated++;
  }
}

console.log(`\n✅ Complete! Updated ${totalUpdated} files.`);
