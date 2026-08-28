export async function webSearch(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return '';

    const html = await res.text();
    const snippets: string[] = [];

    const matches = html.match(/class="result__snippet"[^>]*>[\s\S]*?<\/a>/g) || [];
    for (const match of matches) {
      const text = match.replace(/class="result__snippet"[^>]*>/, '').replace(/<\/a>$/, '').replace(/<[^>]+>/g, '').trim();
      if (text.length > 10) {
        snippets.push(text);
      }
      if (snippets.length >= 6) break;
    }

    if (snippets.length > 0) {
      return '以下是从互联网搜索到的相关信息：\n\n' + snippets.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
    }
  } catch {}

  return '';
}
