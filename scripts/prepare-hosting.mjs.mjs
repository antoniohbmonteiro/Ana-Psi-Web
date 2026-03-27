import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

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