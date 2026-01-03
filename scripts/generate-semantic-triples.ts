#!/usr/bin/env bun

/**
 * Semantic Triples Generator
 *
 * Extracts semantic triples (subject-predicate-object) from all blog posts,
 * scheme documents, and team data to create a searchable knowledge graph.
 *
 * Usage: bun run scripts/generate-semantic-triples.ts
 * Output: static/json/semantic-triples.json
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

interface SemanticTriple {
  subject: string;
  predicate: string;
  object: string;
  source: {
    document: string;
    type: 'blog-post' | 'scheme' | 'team' | 'chapter';
    cid?: string;
    date?: string;
    severity?: number;
  };
  confidence: 'verified' | 'documented' | 'alleged';
}

interface SemanticTriplesOutput {
  metadata: {
    generated: string;
    totalTriples: number;
    sources: {
      blogPosts: number;
      schemes: number;
      team: number;
    };
  };
  triples: SemanticTriple[];
  indices: {
    bySubject: Record<string, number[]>;
    byPredicate: Record<string, number[]>;
    byObject: Record<string, number[]>;
    byDocument: Record<string, number[]>;
    byCIK: Record<string, number[]>;
  };
}

/**
 * Extract triples from markdown content using pattern matching
 */
function extractTriplesFromText(text: string, metadata: any): SemanticTriple[] {
  const triples: SemanticTriple[] = [];

  // Pattern 1: "X served as Y for Z"
  const servedAsPattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*) served as ([^,]+) (?:for|of) ([^.,]+)/g;
  let match;
  while ((match = servedAsPattern.exec(text)) !== null) {
    triples.push({
      subject: match[1].trim(),
      predicate: 'served as',
      object: `${match[2].trim()} of ${match[3].trim()}`,
      source: {
        document: metadata.slug,
        type: 'blog-post',
        date: metadata.date,
        severity: metadata.severity
      },
      confidence: 'documented'
    });
  }

  // Pattern 2: "X was Y of Z"
  const wasPattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*) (?:was|is) (?:the )?([A-Z][^,]+?) (?:of|at) ([^.,]+)/g;
  while ((match = wasPattern.exec(text)) !== null) {
    triples.push({
      subject: match[1].trim(),
      predicate: 'was',
      object: `${match[2].trim()} of ${match[3].trim()}`,
      source: {
        document: metadata.slug,
        type: 'blog-post',
        date: metadata.date,
        severity: metadata.severity
      },
      confidence: 'documented'
    });
  }

  // Pattern 3: "X controlled Y"
  const controlledPattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*) controlled ([^.,]+)/g;
  while ((match = controlledPattern.exec(text)) !== null) {
    triples.push({
      subject: match[1].trim(),
      predicate: 'controlled',
      object: match[2].trim(),
      source: {
        document: metadata.slug,
        type: 'blog-post',
        date: metadata.date,
        severity: metadata.severity
      },
      confidence: 'documented'
    });
  }

  // Pattern 4: "X owned Y"
  const ownedPattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*) owned ([^.,]+)/g;
  while ((match = ownedPattern.exec(text)) !== null) {
    triples.push({
      subject: match[1].trim(),
      predicate: 'owned',
      object: match[2].trim(),
      source: {
        document: metadata.slug,
        type: 'blog-post',
        date: metadata.date,
        severity: metadata.severity
      },
      confidence: 'documented'
    });
  }

  // Pattern 5: "X defrauded Y"
  const defraudedPattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*) defrauded ([^.,]+)/g;
  while ((match = defraudedPattern.exec(text)) !== null) {
    triples.push({
      subject: match[1].trim(),
      predicate: 'defrauded',
      object: match[2].trim(),
      source: {
        document: metadata.slug,
        type: 'blog-post',
        date: metadata.date,
        severity: metadata.severity
      },
      confidence: 'alleged'
    });
  }

  // Pattern 6: "X testified that Y"
  const testifiedPattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*) testified(?: under oath)? that ([^"]+?(?:"|$))/g;
  while ((match = testifiedPattern.exec(text)) !== null) {
    triples.push({
      subject: match[1].trim(),
      predicate: 'testified',
      object: match[2].trim().replace(/["']$/, ''),
      source: {
        document: metadata.slug,
        type: 'blog-post',
        date: metadata.date,
        severity: metadata.severity
      },
      confidence: 'verified'
    });
  }

  // Pattern 7: CIK references
  const cikPattern = /\(CIK (\d+)\)/g;
  const companyPattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*(?:,? Inc\.?|,? LLC|,? Ltd\.?|,? Corp\.?)?) \(CIK (\d+)\)/g;
  while ((match = companyPattern.exec(text)) !== null) {
    triples.push({
      subject: match[1].trim(),
      predicate: 'has CIK',
      object: match[2],
      source: {
        document: metadata.slug,
        type: 'blog-post',
        date: metadata.date,
        cid: match[2]
      },
      confidence: 'verified'
    });
  }

  return triples;
}

/**
 * Process all blog posts in src/docs/posts
 */
async function processBlogPosts(): Promise<SemanticTriple[]> {
  const postsDir = join(process.cwd(), 'src/docs/posts');
  const files = await readdir(postsDir);
  const triples: SemanticTriple[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = join(postsDir, file);
    const content = await readFile(filePath, 'utf-8');
    const { data, content: markdown } = matter(content);

    const slug = file.replace(/\.md$/, '');
    const metadata = { ...data, slug };

    // Extract triples from markdown content
    const postTriples = extractTriplesFromText(markdown, metadata);
    triples.push(...postTriples);

    // Add frontmatter-based triples
    if (data.author) {
      triples.push({
        subject: slug,
        predicate: 'authored by',
        object: data.author,
        source: {
          document: slug,
          type: 'blog-post',
          date: data.date
        },
        confidence: 'verified'
      });
    }

    if (data.severity) {
      triples.push({
        subject: slug,
        predicate: 'has severity',
        object: String(data.severity),
        source: {
          document: slug,
          type: 'blog-post',
          severity: data.severity
        },
        confidence: 'verified'
      });
    }
  }

  return triples;
}

/**
 * Process team.json for relationship triples
 */
async function processTeam(): Promise<SemanticTriple[]> {
  const triples: SemanticTriple[] = [];

  try {
    const teamPath = join(process.cwd(), 'static/json/team.json');
    const teamData = JSON.parse(await readFile(teamPath, 'utf-8'));

    for (const associate of teamData.associates) {
      // Role triples
      if (associate.role) {
        triples.push({
          subject: associate.name,
          predicate: 'has role',
          object: associate.role,
          source: {
            document: 'team.json',
            type: 'team'
          },
          confidence: 'verified'
        });
      }

      // Company associations
      for (const company of associate.companies || []) {
        triples.push({
          subject: associate.name,
          predicate: 'associated with',
          object: company,
          source: {
            document: 'team.json',
            type: 'team'
          },
          confidence: 'verified'
        });
      }

      // Crimes
      for (const crime of associate.crimes || []) {
        triples.push({
          subject: associate.name,
          predicate: 'charged with',
          object: crime,
          source: {
            document: 'team.json',
            type: 'team'
          },
          confidence: associate.status === 'convicted' ? 'verified' : 'alleged'
        });
      }

      // Relationships
      for (const rel of associate.relationships || []) {
        triples.push({
          subject: associate.name,
          predicate: rel.relationship,
          object: rel.person,
          source: {
            document: 'team.json',
            type: 'team'
          },
          confidence: 'documented'
        });
      }

      // Aliases
      for (const alias of associate.aliases || []) {
        triples.push({
          subject: associate.name,
          predicate: 'also known as',
          object: alias,
          source: {
            document: 'team.json',
            type: 'team'
          },
          confidence: 'verified'
        });
      }
    }
  } catch (error) {
    console.warn('Could not process team.json:', error);
  }

  return triples;
}

/**
 * Build indices for fast lookup
 */
function buildIndices(triples: SemanticTriple[]): SemanticTriplesOutput['indices'] {
  const indices: SemanticTriplesOutput['indices'] = {
    bySubject: {},
    byPredicate: {},
    byObject: {},
    byDocument: {},
    byCIK: {}
  };

  triples.forEach((triple, index) => {
    // Subject index
    if (!indices.bySubject[triple.subject]) {
      indices.bySubject[triple.subject] = [];
    }
    indices.bySubject[triple.subject].push(index);

    // Predicate index
    if (!indices.byPredicate[triple.predicate]) {
      indices.byPredicate[triple.predicate] = [];
    }
    indices.byPredicate[triple.predicate].push(index);

    // Object index
    if (!indices.byObject[triple.object]) {
      indices.byObject[triple.object] = [];
    }
    indices.byObject[triple.object].push(index);

    // Document index
    if (!indices.byDocument[triple.source.document]) {
      indices.byDocument[triple.source.document] = [];
    }
    indices.byDocument[triple.source.document].push(index);

    // CIK index
    if (triple.source.cid) {
      if (!indices.byCIK[triple.source.cid]) {
        indices.byCIK[triple.source.cid] = [];
      }
      indices.byCIK[triple.source.cid].push(index);
    }
  });

  return indices;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Generating semantic triples...\n');

  // Process all sources
  console.log('📄 Processing blog posts...');
  const blogTriples = await processBlogPosts();
  console.log(`   Found ${blogTriples.length} triples from blog posts`);

  console.log('👥 Processing team data...');
  const teamTriples = await processTeam();
  console.log(`   Found ${teamTriples.length} triples from team data`);

  // Combine and deduplicate
  const allTriples = [...blogTriples, ...teamTriples];

  // Remove duplicates based on subject-predicate-object combination
  const uniqueTriples = allTriples.filter((triple, index, self) =>
    index === self.findIndex((t) =>
      t.subject === triple.subject &&
      t.predicate === triple.predicate &&
      t.object === triple.object
    )
  );

  console.log(`\n✨ Total unique triples: ${uniqueTriples.length}`);

  // Build indices
  console.log('🗂️  Building indices...');
  const indices = buildIndices(uniqueTriples);

  // Create output
  const output: SemanticTriplesOutput = {
    metadata: {
      generated: new Date().toISOString(),
      totalTriples: uniqueTriples.length,
      sources: {
        blogPosts: blogTriples.length,
        schemes: 0,
        team: teamTriples.length
      }
    },
    triples: uniqueTriples,
    indices
  };

  // Write to file
  const outputPath = join(process.cwd(), 'static/json/semantic-triples.json');
  await writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Semantic triples generated: ${outputPath}`);
  console.log(`\n📊 Index sizes:`);
  console.log(`   - Subjects: ${Object.keys(indices.bySubject).length}`);
  console.log(`   - Predicates: ${Object.keys(indices.byPredicate).length}`);
  console.log(`   - Objects: ${Object.keys(indices.byObject).length}`);
  console.log(`   - Documents: ${Object.keys(indices.byDocument).length}`);
  console.log(`   - CIKs: ${Object.keys(indices.byCIK).length}`);
}

main().catch(console.error);
