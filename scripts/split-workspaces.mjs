#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const backupStamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = join(root, '.workspace-migration-backup', backupStamp);

function log(message) {
  console.log(`[workspace-split] ${message}`);
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, value) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function writeText(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf-8');
}

function copyPath(source, destination) {
  if (!existsSync(source)) {
    return false;
  }

  ensureDir(dirname(destination));
  cpSync(source, destination, { recursive: true, force: true });
  return true;
}

function backupFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const relative = path.replace(`${root}/`, '').replace(`${root}\\`, '');
  copyPath(path, join(backupDir, relative));
}

function normalizeCompilerOptions(options = {}) {
  const normalized = { ...options };
  delete normalized.paths;
  delete normalized.plugins;
  return normalized;
}

function appendGitignoreEntries(filePath, entries) {
  const current = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '';
  const lines = new Set(current.split(/\r?\n/).filter(Boolean));

  for (const entry of entries) {
    lines.add(entry);
  }

  const result = `${Array.from(lines).join('\n')}\n`;
  writeText(filePath, result);
}

function copyRootAppFilesForPublic() {
  const appRoot = join(root, 'src', 'app');
  const publicAppRoot = join(root, 'apps', 'public', 'src', 'app');
  const candidates = [
    'layout.tsx',
    'globals.css',
    'page.tsx',
    'robots.ts',
    'sitemap.ts',
    'not-found.tsx',
    'error.tsx',
    'loading.tsx',
    'favicon.ico',
    'icon.ico',
    'icon.png',
    'icon.jpg',
    'icon.jpeg',
    'icon.svg',
    'icon.tsx',
    'manifest.ts',
    'opengraph-image.png',
    'twitter-image.png',
  ];

  for (const candidate of candidates) {
    copyPath(join(appRoot, candidate), join(publicAppRoot, candidate));
  }
}

function copyRootAppFilesForAdmin() {
  const appRoot = join(root, 'src', 'app');
  const adminAppRoot = join(root, 'apps', 'admin', 'src', 'app');
  const candidates = [
    'layout.tsx',
    'globals.css',
    'not-found.tsx',
    'error.tsx',
    'loading.tsx',
    'favicon.ico',
    'icon.ico',
    'icon.png',
    'icon.jpg',
    'icon.jpeg',
    'icon.svg',
    'icon.tsx',
    'manifest.ts',
  ];

  for (const candidate of candidates) {
    copyPath(join(appRoot, candidate), join(adminAppRoot, candidate));
  }

  copyPath(join(appRoot, '(admin)'), join(adminAppRoot, '(admin)'));

  writeText(
    join(adminAppRoot, 'page.tsx'),
    `import { redirect } from 'next/navigation';\n\nexport default function AdminRootPage() {\n  redirect('/admin/inicio');\n}\n`
  );
}

function copyFeatures() {
  const featuresRoot = join(root, 'src', 'features');
  const publicFeaturesRoot = join(root, 'apps', 'public', 'src', 'features');
  const adminFeaturesRoot = join(root, 'apps', 'admin', 'src', 'features');

  if (!existsSync(featuresRoot)) {
    return;
  }

  const featureDirs = readdirSync(featuresRoot).filter((entry) => statSync(join(featuresRoot, entry)).isDirectory());

  for (const feature of featureDirs) {
    const source = join(featuresRoot, feature);

    if (feature === 'landing') {
      copyPath(source, join(publicFeaturesRoot, feature));
      continue;
    }

    copyPath(source, join(adminFeaturesRoot, feature));
  }
}

function copyLibAndComponents() {
  copyPath(join(root, 'src', 'components'), join(root, 'apps', 'admin', 'src', 'components'));
  copyPath(join(root, 'src', 'lib'), join(root, 'apps', 'admin', 'src', 'lib'));

  copyPath(join(root, 'src', 'lib', 'firebase'), join(root, 'apps', 'public', 'src', 'lib', 'firebase'));
  copyPath(join(root, 'src', 'components'), join(root, 'apps', 'public', 'src', 'components'));
}

function copyPublicAssetsAndEnv() {
  copyPath(join(root, 'public'), join(root, 'apps', 'public', 'public'));
  copyPath(join(root, 'public'), join(root, 'apps', 'admin', 'public'));

  copyPath(join(root, '.env.local'), join(root, 'apps', 'public', '.env.local'));
  copyPath(join(root, '.env.local'), join(root, 'apps', 'admin', '.env.local'));
}

function buildWorkspacePackage(name, scripts) {
  const rootPackage = readJson(join(root, 'package.json'));

  return {
    name,
    private: true,
    scripts,
    dependencies: rootPackage.dependencies ?? {},
    devDependencies: rootPackage.devDependencies ?? {},
  };
}

function writeWorkspaceFiles() {
  const rootPackage = readJson(join(root, 'package.json'));
  const rootTsconfig = readJson(join(root, 'tsconfig.json'));

  backupFile(join(root, 'package.json'));
  backupFile(join(root, 'tsconfig.json'));
  backupFile(join(root, '.gitignore'));

  writeJson(join(root, 'tsconfig.base.json'), {
    compilerOptions: normalizeCompilerOptions(rootTsconfig.compilerOptions),
  });

  writeJson(join(root, 'package.json'), {
    name: rootPackage.name,
    private: true,
    workspaces: ['apps/public', 'apps/admin'],
    scripts: {
      'dev:public': 'npm run dev --workspace @ana-psi/public',
      'dev:admin': 'npm run dev --workspace @ana-psi/admin',
      'build:public': 'npm run build --workspace @ana-psi/public',
      'build:admin': 'npm run build --workspace @ana-psi/admin',
      'lint:public': 'npm run lint --workspace @ana-psi/public',
      'lint:admin': 'npm run lint --workspace @ana-psi/admin',
      'deploy:public': 'npm run deploy:hosting --workspace @ana-psi/public',
    },
  });

  writeJson(join(root, 'apps', 'public', 'package.json'), buildWorkspacePackage('@ana-psi/public', {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'eslint',
    'deploy:hosting': 'firebase deploy --only hosting',
  }));

  writeJson(join(root, 'apps', 'admin', 'package.json'), buildWorkspacePackage('@ana-psi/admin', {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'eslint',
  }));

  const childTsconfig = {
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: [
      'next-env.d.ts',
      '**/*.ts',
      '**/*.tsx',
      '.next/types/**/*.ts',
      '.next/dev/types/**/*.ts',
      '**/*.mts',
    ],
    exclude: ['node_modules'],
  };

  writeJson(join(root, 'apps', 'public', 'tsconfig.json'), childTsconfig);
  writeJson(join(root, 'apps', 'admin', 'tsconfig.json'), childTsconfig);

  writeText(
    join(root, 'apps', 'public', 'next.config.ts'),
    `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {\n  output: 'export',\n  trailingSlash: true,\n  images: {\n    unoptimized: true,\n  },\n};\n\nexport default nextConfig;\n`
  );

  writeText(
    join(root, 'apps', 'admin', 'next.config.ts'),
    `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n`
  );

  writeJson(join(root, 'apps', 'public', 'firebase.json'), {
    hosting: {
      public: 'out',
      ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
      cleanUrls: true,
    },
  });

  writeJson(join(root, 'apps', 'public', '.firebaserc'), {
    projects: {
      default: 'ana-psi',
    },
  });

  writeText(
    join(root, 'apps', 'public', 'README.md'),
    `# Public app\n\n## Development\n\n\
 npm run dev:public\n\n## Build\n\n\
 npm run build:public\n\n## Deploy to Firebase Hosting\n\n\
 npm run deploy:public\n\nRemember to set \`NEXT_PUBLIC_SITE_URL\` in \`.env.local\` with the public URL of the site.\n`
  );

  writeText(
    join(root, 'apps', 'admin', 'README.md'),
    `# Admin app\n\n## Development\n\n\
 npm run dev:admin\n\n## Build\n\n\
 npm run build:admin\n`
  );

  appendGitignoreEntries(join(root, '.gitignore'), [
    'apps/*/.next',
    'apps/*/out',
    'apps/*/node_modules',
    '.workspace-migration-backup',
  ]);
}

function main() {
  const publicAppPath = join(root, 'apps', 'public');
  const adminAppPath = join(root, 'apps', 'admin');

  if (existsSync(publicAppPath) || existsSync(adminAppPath)) {
    throw new Error('apps/public or apps/admin already exists. Aborting to avoid overwriting your work.');
  }

  ensureDir(backupDir);

  writeWorkspaceFiles();
  copyRootAppFilesForPublic();
  copyRootAppFilesForAdmin();
  copyFeatures();
  copyLibAndComponents();
  copyPublicAssetsAndEnv();

  log('Workspace split scaffold created successfully.');
  log('Next steps:');
  log('1) npm install');
  log('2) npm run dev:public');
  log('3) npm run dev:admin');
  log('4) cd apps/public && firebase deploy --only hosting');
}

try {
  main();
} catch (error) {
  console.error(`[workspace-split] ${error.message}`);
  process.exit(1);
}
