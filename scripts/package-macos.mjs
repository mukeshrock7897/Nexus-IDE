#!/usr/bin/env node
/**
 * Nexus IDE — macOS Packaging Entry Script
 * Ensures Vite production bundle is built, then invokes scripts/package-macos.py
 * to assemble Nexus IDE.app, spec-compliant UDIF .dmg images, PKZIP .zip archives,
 * and the 1-click self-extracting Nexus-IDE-Mac-Installer.command.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('[Pre-Build] Compiling production frontend assets via Vite...');
  execSync('npx vite build', { stdio: 'inherit', cwd: ROOT_DIR });
}

execSync('python3 scripts/package-macos.py', { stdio: 'inherit', cwd: ROOT_DIR });
