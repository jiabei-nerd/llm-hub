export async function webSearch(query: string): Promise<string> {
  try {
    const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) return '';

    const html = await res.text();

    // Remove all HTML tags and extract text
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');

    // Find sentences that contain the search terms
    const queryTerms = query.split(/\s+/).filter(t => t.length > 1);
    const sentences = text.split(/[。.！!？?\n]/).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 20 && trimmed.length < 500 && queryTerms.some(t => trimmed.includes(t));
    });

    const uniqueSnippets: string[] = [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (!uniqueSnippets.some(existing => existing.includes(trimmed.slice(0, 30)))) {
        uniqueSnippets.push(trimmed);
      }
      if (uniqueSnippets.length >= 6) break;
    }

    if (uniqueSnippets.length > 0) {
      return '以下是从互联网搜索到的相关信息：\n\n' + uniqueSnippets.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
    }
  } catch (e) {
    console.log('[SEARCH] ERROR:', e instanceof Error ? e.message : e);
  }

  return '';
}
