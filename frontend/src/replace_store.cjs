const fs = require('fs');
const path = require('path');

const directory = 'c:/FPT/Project/student-chatbox/frontend/src';

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
             results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk(directory, function(err, results) {
  if (err) throw err;
  
  results.forEach(file => {
    // Skip the stores themselves, AppRoutes, Topbar, and authApi to avoid messing up what we just did manually
    if (file.includes('useAuthStore.ts') || 
        file.includes('useUserStore.ts') || 
        file.includes('AppRoutes.tsx') || 
        file.includes('Topbar.tsx') ||
        file.includes('axiosInstance.ts') ||
        file.includes('LoginPage.tsx')) return;
        
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Replace usePermission import
    if (content.includes(`import { usePermission } from '@/store/useAuthStore'`)) {
      content = content.replace(`import { usePermission } from '@/store/useAuthStore'`, `import { usePermission } from '@/store/useUserStore'`);
      modified = true;
    }

    if (content.includes(`import { useAuthStore, usePermission } from '@/store/useAuthStore'`)) {
      content = content.replace(`import { useAuthStore, usePermission } from '@/store/useAuthStore'`, `import { useAuthStore } from '@/store/useAuthStore'\nimport { useUserStore, usePermission } from '@/store/useUserStore'`);
      modified = true;
    }

    if (content.includes(`import { useAuthStore } from '@/store/useAuthStore'`)) {
      // If it uses s => s.user, we need to import useUserStore
      if (content.includes(`useAuthStore(s => s.user)`) || content.includes(`useAuthStore((s) => s.user)`)) {
        content = content.replace(`import { useAuthStore } from '@/store/useAuthStore'`, `import { useAuthStore } from '@/store/useAuthStore'\nimport { useUserStore } from '@/store/useUserStore'`);
        content = content.replace(/useAuthStore\(\s*s\s*=>\s*s\.user\s*\)/g, 'useUserStore(s => s.user)');
        content = content.replace(/useAuthStore\(\s*\(\s*s\s*\)\s*=>\s*s\.user\s*\)/g, 'useUserStore(s => s.user)');
        
        // Remove useAuthStore import if it's no longer used
        if (!content.includes('useAuthStore(s => s.accessToken)') && !content.includes('useAuthStore(s => s.logout)')) {
          content = content.replace(`import { useAuthStore } from '@/store/useAuthStore'\n`, '');
        }
        modified = true;
      }
    }

    // Special case for useChatStream.ts
    if (content.includes('import { useAuthStore } from \'../store/useAuthStore\';')) {
        // it uses accessToken, which is fine, no change needed for user
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Modified: ' + file);
    }
  });
});
