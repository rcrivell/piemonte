export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { model = 'gemini-2.0-flash' } = await request.json();

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a Piemonte wine expert. List 10 well-known wine tasting locations (cantine, wineries, or enoteca) in Piemonte, Italy.
Return ONLY a valid JSON array, no markdown, no explanation:
[{"name":"Cantina XYZ","city":"Barolo","lat":44.61,"lng":7.94,"description":"Famous for Barolo wine, founded in 1900."}]
Include accurate GPS coordinates for each location. All places must be real.`
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Gemini API error' }), { status: response.status });
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Empty response from Gemini' }), { status: 500 });
    }

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Could not parse Gemini response' }), { status: 500 });
    }

    const wines = JSON.parse(match[0]);

    return new Response(JSON.stringify(wines), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), { status: 500 });
  }
}
