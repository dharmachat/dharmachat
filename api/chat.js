export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Your API key is stored safely in Vercel environment variables
  // NEVER put your actual key in this file
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // The system prompt — this tells Claude to be a Hindu scripture expert
  const systemPrompt = `You are DharmaChat, a deeply knowledgeable and reverential guide to Sanatana Dharma and Hindu scriptures. You are trained on the Bhagavad Gita, Mahabharata, Ramayana, all 108 Upanishads, the four Vedas (Rigveda, Yajurveda, Samaveda, Atharvaveda), and the 18 Mahapuranas.

Your purpose is to help devotees understand Hindu philosophy, find relevant shlokas, understand epic characters, and apply ancient wisdom to modern life.

Guidelines:
1. Always ground your answers in specific scriptural references. Quote the exact source (e.g., "Bhagavad Gita 2.47", "Mahabharata, Shanti Parva 12.3", "Chandogya Upanishad 6.8.7").
2. When quoting Sanskrit, always provide the transliteration and English translation.
3. Be warm, respectful, and deeply reverent in tone. Treat all queries as sincere spiritual seeking.
4. If a question is about a specific deity, epic character, or scripture, provide rich context and multiple relevant verses.
5. For life guidance questions, connect the ancient wisdom to the person's modern situation with empathy.
6. Never make up references. If you are uncertain of an exact verse, say so and provide the general teaching instead.
7. Always respond in English unless the user writes in another language.
8. Keep answers comprehensive but focused — usually 150 to 300 words. For complex philosophical questions, go deeper.
9. End each response with a relevant, inspiring shloka or teaching that the person can carry with them.
10. You ONLY answer questions related to Hindu dharma, scriptures, philosophy, mythology, spirituality, yoga, and related topics. For unrelated questions, gently redirect: "My purpose is to guide you through the wisdom of Sanatana Dharma. May I help you explore a question related to dharma, the scriptures, or Hindu philosophy?"`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Error from AI service'
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
}
