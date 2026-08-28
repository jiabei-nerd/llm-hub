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

    const resultBlocks = html.split('class="result__body"');
    for (let i = 1; i < resultBlocks.length && snippets.length < 5; i++) {
      const block = resultBlocks[i];

      let title = '';
      const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)/);
      if (titleMatch) title = titleMatch[1].trim();

      let snippet = '';
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      if (snippetMatch) {
        snippet = snippetMatch[1].replace(/<[^>]+>/g, '').trim();
      }

      if (title && snippet && snippet.length > 10) {
        snippets.push(`【${title}】${snippet}`);
      }
    }

    if (snippets.length > 0) {
      return '【网络搜索结果】\n\n' + snippets.join('\n\n');
    }
  } catch {}

  return '';
}
