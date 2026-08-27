const SEARXNG_INSTANCES = [
  'https://search.sapti.me',
  'https://searx.tiekoetter.com',
  'https://search.bus-hit.me',
];

export async function webSearch(query: string): Promise<string> {
  for (const instance of SEARXNG_INSTANCES) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&language=zh-CN&categories=general&pageno=1`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).slice(0, 5);
        if (results.length > 0) {
          return results
            .map((r: { title: string; content: string; url: string }) =>
              `【${r.title}】${r.content || ''}\n来源: ${r.url}`)
            .join('\n\n');
        }
      }
    } catch {
      continue;
    }
  }

  // Fallback: Bing or Google if keys are available
  if (process.env.BING_SEARCH_KEY) {
    try {
      const res = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5&mkt=zh-CN`,
        { headers: { 'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.webPages?.value || [];
        return results
          .map((r: { name: string; snippet: string; url: string }) => `【${r.name}】${r.snippet}\n来源: ${r.url}`)
          .join('\n\n');
      }
    } catch {}
  }

  return '';
}
