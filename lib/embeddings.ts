const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';

function apiKey() {
  return process.env.OPENAI_API_KEY?.trim() || '';
}

export function semanticMemoryAvailable() {
  return Boolean(apiKey());
}

export async function createEmbedding(input: string) {
  const key = apiKey();
  if (!key) return null;
  const cleaned = input.trim().slice(0, 24_000);
  if (!cleaned) return null;

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ARIDON_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small',
      input: cleaned,
      dimensions: 1536,
    }),
    cache: 'no-store',
  });

  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || `Embedding request failed (${response.status}).`);
  const embedding = data?.data?.[0]?.embedding;
  return Array.isArray(embedding) ? embedding : null;
}
