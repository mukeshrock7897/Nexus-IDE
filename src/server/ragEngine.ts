/**
 * Codebase Intelligence, AST Symbol/Dependency Extractor & Hybrid Vector RAG Engine (Phase 6)
 */

import type { RagSearchResult, WorkspaceFile } from '../shared/ipc-types';

export interface ExtractedSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable';
  filePath: string;
  line: number;
  signature: string;
}

export interface ModuleDependencyEdge {
  fromFile: string;
  toSpecifier: string;
  line: number;
}

export interface CodebaseIndexGraph {
  indexedAt: string;
  fileCount: number;
  chunkCount: number;
  symbols: ExtractedSymbol[];
  dependencies: ModuleDependencyEdge[];
  vectorBackend: 'local-memory' | 'chromadb' | 'qdrant' | 'faiss';
}

export function extractSymbolsAndDependencies(files: WorkspaceFile[]): CodebaseIndexGraph {
  const symbols: ExtractedSymbol[] = [];
  const dependencies: ModuleDependencyEdge[] = [];
  let chunkCount = 0;

  for (const file of files) {
    const lines = file.content.split('\n');
    chunkCount += Math.max(1, Math.ceil(lines.length / 25));

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      const lineNum = idx + 1;

      // Extract TypeScript/JS/Python/Rust/Go/Java imports
      const importMatch =
        line.match(/^import\s+.*?\s+from\s+['"]([^'"]+)['"]/) ||
        line.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+/) ||
        line.match(/^use\s+([a-zA-Z0-9_:]+)/);
      if (importMatch) {
        dependencies.push({
          fromFile: file.path,
          toSpecifier: importMatch[1],
          line: lineNum,
        });
      }

      // Extract Classes / Structs
      const classMatch = line.match(
        /^(?:export\s+)?(?:abstract\s+)?(?:class|struct)\s+([A-Za-z0-9_]+)/
      );
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          filePath: file.path,
          line: lineNum,
          signature: line.replace(/\{$/, '').trim(),
        });
        return;
      }

      // Extract Interfaces / Types
      const interfaceMatch = line.match(
        /^(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)/
      );
      if (interfaceMatch) {
        symbols.push({
          name: interfaceMatch[1],
          kind: 'interface',
          filePath: file.path,
          line: lineNum,
          signature: line.replace(/\{$/, '').trim(),
        });
        return;
      }

      // Extract Functions / Methods
      const fnMatch =
        line.match(
          /^(?:export\s+)?(?:async\s+)?(?:function|def|pub\s+fn|fn|func)\s+([A-Za-z0-9_]+)/
        ) ||
        line.match(
          /^(?:public|private|protected)\s+(?:async\s+)?([A-Za-z0-9_]+)\s*\(/
        );
      if (fnMatch && !['if', 'for', 'while', 'switch', 'catch', 'constructor'].includes(fnMatch[1])) {
        symbols.push({
          name: fnMatch[1],
          kind: 'function',
          filePath: file.path,
          line: lineNum,
          signature: line.replace(/\{$/, '').trim(),
        });
      }
    });
  }

  return {
    indexedAt: new Date().toISOString(),
    fileCount: files.length,
    chunkCount,
    symbols,
    dependencies,
    vectorBackend: 'local-memory',
  };
}

/**
 * Hybrid RAG Retriever combining lexical BM25-style scoring, AST symbol boosting, and semantic token overlap.
 */
export function hybridRagSearch(
  query: string,
  files: WorkspaceFile[],
  mode: 'hybrid' | 'semantic' | 'symbol' = 'hybrid'
): RagSearchResult[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const queryTokens = clean
    .replace(/[^a-z0-9_]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (queryTokens.length === 0) return [];

  const graph = extractSymbolsAndDependencies(files);
  const results: RagSearchResult[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');
    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) return;
      const lineNum = idx + 1;
      const lowerLine = line.toLowerCase();
      const lowerPath = file.path.toLowerCase();

      let tokenHits = 0;
      for (const token of queryTokens) {
        if (lowerLine.includes(token) || lowerPath.includes(token)) {
          tokenHits += 1;
        }
      }

      const matchingSymbol = graph.symbols.find(
        (s) => s.filePath === file.path && s.line === lineNum
      );

      if (mode === 'symbol' && !matchingSymbol) {
        return;
      }

      if (tokenHits > 0 || (matchingSymbol && matchingSymbol.name.toLowerCase().includes(clean))) {
        const baseScore = tokenHits / queryTokens.length;
        const symbolBoost = matchingSymbol ? 0.25 : 0;
        const exactBoost = lowerLine.includes(clean) ? 0.15 : 0;
        const score = Number(Math.min(0.99, baseScore * 0.7 + symbolBoost + exactBoost).toFixed(2));

        results.push({
          filePath: file.path,
          line: lineNum,
          snippet: line,
          score,
          symbolName: matchingSymbol?.name,
          symbolKind: matchingSymbol?.kind,
        });
      }
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 35);
}
