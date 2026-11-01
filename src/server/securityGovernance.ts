/**
 * Enterprise Security, Secret Redaction & AI Governance Module (Phase 10)
 * Detects and redacts sensitive tokens, API keys, private keys, and connection strings
 * before prompts or context leave the workspace.
 */

export interface SecretRedactionReport {
  sanitizedText: string;
  redactedCount: number;
  detectedTypes: string[];
}

const SECRET_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  {
    label: 'OpenAI / Bearer Key',
    regex: /\bsk-[a-zA-Z0-9_-]{16,}\b/g,
  },
  {
    label: 'Google Cloud / API Key',
    regex: /\bAIza[0-9A-Za-z_-]{30,}\b/g,
  },
  {
    label: 'GitHub Personal Access Token',
    regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  },
  {
    label: 'AWS Access Key ID',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    label: 'Private Key Block',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    label: 'Database Password URI',
    regex: /(postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/([^:\s]+):([^@\s]+)@/gi,
  },
];

export function redactSecrets(input: string): SecretRedactionReport {
  if (!input) {
    return { sanitizedText: '', redactedCount: 0, detectedTypes: [] };
  }

  let sanitizedText = input;
  let redactedCount = 0;
  const detectedTypes = new Set<string>();

  for (const item of SECRET_PATTERNS) {
    sanitizedText = sanitizedText.replace(item.regex, (_match, proto, user) => {
      redactedCount += 1;
      detectedTypes.add(item.label);
      if (typeof proto === 'string' && typeof user === 'string') {
        return `${proto}://${user}:[REDACTED_SECRET]@`;
      }
      return `[REDACTED:${item.label.toUpperCase().replace(/\s+/g, '_')}]`;
    });
  }

  return {
    sanitizedText,
    redactedCount,
    detectedTypes: Array.from(detectedTypes),
  };
}
