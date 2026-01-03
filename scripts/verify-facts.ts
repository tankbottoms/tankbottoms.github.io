#!/usr/bin/env bun

/**
 * Fact Verification Script
 *
 * Scans all blog posts, team.json, and schemes pages for common factual errors.
 * Run after any content generation to catch inaccuracies.
 *
 * Usage: bun run scripts/verify-facts.ts
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface FactError {
  file: string;
  line: number;
  type: 'critical' | 'warning' | 'info';
  category: string;
  error: string;
  suggestion: string;
}

const errors: FactError[] = [];

// Critical fact patterns that indicate errors
const CRITICAL_PATTERNS = [
  {
    pattern: /Cane (was )?convicted|convicted.*Cane(?! fraudster)/gi,
    category: 'Legal Status',
    error: 'Kyleen Cane was acquitted, not convicted',
    suggestion: 'Use "indicted" or "alleged" instead'
  },
  {
    pattern: /Cane (was )?found guilty|guilty verdict.*Cane/gi,
    category: 'Legal Status',
    error: 'Kyleen Cane was acquitted, not found guilty',
    suggestion: 'Use "indicted in 2014, acquitted in 2018"'
  },
  {
    pattern: /Wallace (was )?acquitted/gi,
    category: 'Legal Status',
    error: 'Jan Wallace has civil fraud judgment, not criminal acquittal',
    suggestion: 'Use "convicted fraudster" based on Thomas & Wong judgment'
  },
  {
    pattern: /Hearn.*stock promoter|stock promoter.*Hearn/gi,
    category: 'Person Characterization',
    error: 'William Hearn is not documented as a stock promoter',
    suggestion: 'Verify actual criminal charges in court dockets'
  },
  {
    pattern: /DiScala.*acquitted|DiScala.*not guilty/gi,
    category: 'Legal Status',
    error: 'Abraxas DiScala was indicted (outcome may be pending)',
    suggestion: 'Verify case outcome before stating'
  }
];

// Warning patterns that should be verified
const WARNING_PATTERNS = [
  {
    pattern: /Michael Cane(?! \(pre-2001\)|, formerly)/gi,
    category: 'Name Usage',
    error: 'Using "Michael Cane" without temporal qualifier',
    suggestion: 'Use "Kyleen Cane (formerly Michael Cane)" or "Michael Cane (pre-2001)"'
  },
  {
    pattern: /\\$[0-9,]+(M|million|billion)/gi,
    category: 'Financial Figures',
    error: 'Financial figure without source citation',
    suggestion: 'Add footnote with source document CID'
  },
  {
    pattern: /CEO|CFO|Director|President/gi,
    category: 'Corporate Roles',
    error: 'Corporate role stated - verify against SEC filings',
    suggestion: 'Cross-check with EDGAR filings for accuracy'
  }
];

// Info patterns for additional verification
const INFO_PATTERNS = [
  {
    pattern: /\\d{4}-\\d{2}-\\d{2}/g,
    category: 'Dates',
    error: 'Date found - verify against source documents',
    suggestion: 'Cross-reference date with court records or SEC filings'
  },
  {
    pattern: /alleged|allegedly/gi,
    category: 'Legal Language',
    error: 'Using "alleged" - verify this is appropriate',
    suggestion: 'Use "alleged" for unproven claims, remove for proven facts'
  }
];

async function scanFile(filePath: string): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\\n');

  // Check critical patterns
  for (const pattern of CRITICAL_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.pattern.test(lines[i])) {
        errors.push({
          file: filePath,
          line: i + 1,
          type: 'critical',
          category: pattern.category,
          error: pattern.error,
          suggestion: pattern.suggestion
        });
      }
    }
  }

  // Check warning patterns
  for (const pattern of WARNING_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.pattern.test(lines[i])) {
        errors.push({
          file: filePath,
          line: i + 1,
          type: 'warning',
          category: pattern.category,
          error: pattern.error,
          suggestion: pattern.suggestion
        });
      }
    }
  }

  // Check info patterns (limit to avoid noise)
  const financialCount = (content.match(WARNING_PATTERNS[1].pattern) || []).length;
  if (financialCount > 3) {
    errors.push({
      file: filePath,
      line: 0,
      type: 'info',
      category: 'Financial Figures',
      error: `Found ${financialCount} financial figures`,
      suggestion: 'Verify all amounts have source citations'
    });
  }
}

async function scanBlogPosts(): Promise<void> {
  const postsDir = join(process.cwd(), 'src/docs/posts');
  const files = await readdir(postsDir);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = join(postsDir, file);
    await scanFile(filePath);
  }
}

async function scanTeamJSON(): Promise<void> {
  const teamPath = join(process.cwd(), 'static/json/team.json');
  const content = await readFile(teamPath, 'utf-8');
  const team = JSON.parse(content);

  // Check each associate's status
  for (const associate of team.associates) {
    // Kyleen Cane should be "indicted", not "convicted"
    if (associate.name === 'Kyleen Elisabeth Cane' && associate.status === 'convicted') {
      errors.push({
        file: 'static/json/team.json',
        line: 0,
        type: 'critical',
        category: 'Legal Status',
        error: `Kyleen Cane marked as "convicted" but was acquitted in 2018`,
        suggestion: 'Change status to "indicted" with note about acquittal'
      });
    }

    // Jan Wallace should be "convicted"
    if (associate.name === 'Jan Mary Wallace' && associate.status !== 'convicted') {
      errors.push({
        file: 'static/json/team.json',
        line: 0,
        type: 'critical',
        category: 'Legal Status',
        error: `Jan Wallace not marked as "convicted"`,
        suggestion: 'Change status to "convicted" based on Thomas & Wong judgment'
      });
    }

    // Check for Hearn mischaracterization
    if (associate.name?.includes('Hearn') && associate.role?.toLowerCase().includes('stock promoter')) {
      errors.push({
        file: 'static/json/team.json',
        line: 0,
        type: 'critical',
        category: 'Person Characterization',
        error: `William Hearn characterized as "stock promoter"`,
        suggestion: 'Remove or verify against court records'
      });
    }
  }
}

async function scanSchemesPage(): Promise<void> {
  const schemesPath = join(process.cwd(), 'src/routes/schemes/+page.svelte');
  await scanFile(schemesPath);
}

async function scanCHANGELOG(): Promise<void> {
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  await scanFile(changelogPath);
}

function printReport(): void {
  console.log('\\n🔍 Fact Verification Report\\n');
  console.log('━'.repeat(80));

  const critical = errors.filter(e => e.type === 'critical');
  const warnings = errors.filter(e => e.type === 'warning');
  const info = errors.filter(e => e.type === 'info');

  if (critical.length > 0) {
    console.log('\\n🚨 CRITICAL ERRORS (Must Fix):\\n');
    for (const error of critical) {
      console.log(`📄 ${error.file}:${error.line}`);
      console.log(`   Category: ${error.category}`);
      console.log(`   Error: ${error.error}`);
      console.log(`   Suggestion: ${error.suggestion}`);
      console.log('');
    }
  }

  if (warnings.length > 0) {
    console.log('\\n⚠️  WARNINGS (Should Verify):\\n');
    const uniqueWarnings = warnings.slice(0, 10); // Limit output
    for (const error of uniqueWarnings) {
      console.log(`📄 ${error.file}:${error.line}`);
      console.log(`   ${error.error} - ${error.suggestion}`);
      console.log('');
    }
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more warnings\\n`);
    }
  }

  if (info.length > 0) {
    console.log(`\\nℹ️  INFO: ${info.length} items to verify (dates, financial figures, roles)\\n`);
  }

  console.log('━'.repeat(80));
  console.log(`\\n📊 Summary:`);
  console.log(`   🚨 Critical: ${critical.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  console.log(`   ℹ️  Info: ${info.length}`);

  if (critical.length === 0 && warnings.length === 0) {
    console.log('\\n✅ No critical errors or warnings found!\\n');
  } else {
    console.log('\\n❌ Issues found - review and fix before publishing\\n');
    process.exit(1);
  }
}

async function main() {
  console.log('🔍 Scanning for factual errors...\\n');

  console.log('📄 Scanning blog posts...');
  await scanBlogPosts();

  console.log('👥 Scanning team.json...');
  await scanTeamJSON();

  console.log('📋 Scanning schemes page...');
  await scanSchemesPage();

  console.log('📝 Scanning CHANGELOG...');
  await scanCHANGELOG();

  printReport();
}

main().catch(console.error);
