import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const appRoot = join(process.cwd(), 'src', 'app');
const adminRoots = [
  join(appRoot, '(admin)'),
  join(appRoot, 'admin'),
];

function isDynamicSegment(name) {
  return /^\[.*\]$/.test(name);
}

function collectDynamicLeafDirs(root) {
  const matches = [];

  if (!existsSync(root)) {
    return matches;
  }

  const walk = (currentPath) => {
    const entries = readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const childPath = join(currentPath, entry.name);
      walk(childPath);

      if (isDynamicSegment(entry.name)) {
        const childEntries = readdirSync(childPath, { withFileTypes: true });
        const hasPageFile = childEntries.some(
          (childEntry) => childEntry.isFile() && childEntry.name === 'page.tsx'
        );

        if (hasPageFile) {
          matches.push(childPath);
        }
      }
    }
  };

  walk(root);

  return matches;
}

function getNextCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function disableAdminDynamicRoutes() {
  const routes = adminRoots.flatMap(collectDynamicLeafDirs);
  const renamedRoutes = [];

  for (const originalPath of routes) {
    const currentName = basename(originalPath);
    const tempName = `__hosting_disabled_${currentName.replace(/[^a-zA-Z0-9_-]/g, '_')}__`;
    const tempPath = join(originalPath, '..', tempName);

    renameSync(originalPath, tempPath);
    renamedRoutes.push({ originalPath, tempPath });
    console.log(`Temporarily disabled: ${originalPath}`);
  }

  return renamedRoutes;
}

function restoreRoutes(renamedRoutes) {
  for (const { originalPath, tempPath } of renamedRoutes) {
    if (existsSync(tempPath)) {
      renameSync(tempPath, originalPath);
      console.log(`Restored: ${originalPath}`);
    }
  }
}

function removeHostingOnlyPaths() {
  const pathsToRemove = [
    join(process.cwd(), 'out', 'admin'),
    join(process.cwd(), 'out', 'admin.html'),
  ];

  for (const targetPath of pathsToRemove) {
    if (existsSync(targetPath)) {
      rmSync(targetPath, { recursive: true, force: true });
      console.log(`Removed: ${targetPath}`);
    }
  }
}

const renamedRoutes = disableAdminDynamicRoutes();

try {
  const result = spawnSync(getNextCommand(), ['next', 'build'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  removeHostingOnlyPaths();
} finally {
  restoreRoutes(renamedRoutes);
}
