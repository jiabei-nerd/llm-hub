export async function webSearch(query: string): Promise<string> {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-CN&num=5`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return '';

    const html = await res.text();

    // Extract text snippets from Google results
    const snippets: string[] = [];

    // Match data-sncf blocks (Google's result snippets)
    const divMatches = html.match(/<div[^>]*class="[^"]*BNeawe[^"]*"[^>]*>([\s\S]*?)<\/div>/g) || [];
    for (const div of divMatches) {
      const text = div.replace(/<[^>]+>/g, '').trim();
      if (text.length > 20 && text.length < 500 && !snippets.includes(text)) {
        snippets.push(text);
      }
      if (snippets.length >= 5) break;
    }

    // Fallback: extract any substantial text blocks
    if (snippets.length === 0) {
      const allText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ');

      const sentences = allText.split(/[。！？.!?]/).filter(s => s.trim().length > 30);
      for (const s of sentences.slice(0, 5)) {
        snippets.push(s.trim().slice(0, 300));
      }
    }

    if (snippets.length > 0) {
      return '【网络搜索结果】\n' + snippets.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
    }
  } catch {}

  return '';
}
