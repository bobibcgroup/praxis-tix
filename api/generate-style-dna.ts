import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      fallback: true,
      identityPhrase: 'Understated. Refined. Effortless.',
      paletteReasoning: 'Balanced tones that enhance your natural contrast and complexion.',
      leanInto: ['Balanced warm and cool tones', 'Medium-contrast outfits that feel grounded', 'Jewel tones for structure and emphasis'],
      avoid: ['Overly bright neons that overpower', 'Very pale shades that flatten contrast'],
      closingLine: 'Style is clarity. You now have yours.',
    });
  }

  try {
    const body = req.body as {
      lifestyle?: string;
      inspirationPreset?: string;
      skinToneBucket?: string;
      contrastLevel?: string;
      colorSeason?: string;
      undertone?: string;
      archetype?: string;
      verticalLine?: string;
      shoulder?: string;
      confidencePercent?: number;
    };
    const {
      lifestyle = '',
      inspirationPreset = '',
      skinToneBucket = '',
      contrastLevel = '',
      colorSeason = '',
      undertone = '',
      archetype = '',
      verticalLine = '',
      shoulder = '',
      confidencePercent,
    } = body;

    const biometricLine =
      [colorSeason, undertone, archetype, verticalLine, shoulder].some(Boolean)
        ? `Biometric analysis: color season=${colorSeason || 'not set'}, undertone=${undertone || 'not set'}, archetype=${archetype || 'not set'}, vertical line=${verticalLine || 'not set'}, shoulder=${shoulder || 'not set'}${confidencePercent != null ? `, confidence=${confidencePercent}%` : ''}. Use this to ground the identity phrase and recommendations.`
        : '';

    const prompt = `You are a men's style consultant. Generate a short "Style DNA" summary for a user.

User context: lifestyle=${lifestyle || 'not specified'}, style inspiration=${inspirationPreset || 'not specified'}, skin tone=${skinToneBucket || 'not specified'}, contrast=${contrastLevel || 'not specified'}.
${biometricLine ? '\n' + biometricLine + '\n' : ''}

Respond with ONLY a JSON object (no markdown):
{
  "identityPhrase": "A short 3-word or 4-word style identity phrase in quotes, e.g. Understated. Refined. Effortless.",
  "paletteReasoning": "One sentence on why their palette works for them.",
  "leanInto": ["bullet 1", "bullet 2", "bullet 3"],
  "avoid": ["bullet 1", "bullet 2"],
  "closingLine": "One short closing sentence."
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.5,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('[generate-style-dna] Gemini error:', geminiRes.status, err);
      return res.status(200).json({
        success: true,
        fallback: true,
        identityPhrase: 'Understated. Refined. Effortless.',
        paletteReasoning: 'Balanced tones that enhance your natural contrast and complexion.',
        leanInto: ['Balanced warm and cool tones', 'Medium-contrast outfits that feel grounded', 'Jewel tones for structure and emphasis'],
        avoid: ['Overly bright neons that overpower', 'Very pale shades that flatten contrast'],
        closingLine: 'Style is clarity. You now have yours.',
      });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(200).json({
        success: true,
        fallback: true,
        identityPhrase: 'Understated. Refined. Effortless.',
        paletteReasoning: 'Balanced tones that enhance your natural contrast and complexion.',
        leanInto: ['Balanced warm and cool tones', 'Medium-contrast outfits that feel grounded', 'Jewel tones for structure and emphasis'],
        avoid: ['Overly bright neons that overpower', 'Very pale shades that flatten contrast'],
        closingLine: 'Style is clarity. You now have yours.',
      });
    }

    const parsed = JSON.parse(text) as {
      identityPhrase?: string;
      paletteReasoning?: string;
      leanInto?: string[];
      avoid?: string[];
      closingLine?: string;
    };

    return res.status(200).json({
      success: true,
      fallback: false,
      identityPhrase: parsed.identityPhrase ?? 'Understated. Refined. Effortless.',
      paletteReasoning: parsed.paletteReasoning ?? 'Balanced tones that enhance your natural contrast and complexion.',
      leanInto: Array.isArray(parsed.leanInto) && parsed.leanInto.length > 0 ? parsed.leanInto : ['Balanced warm and cool tones', 'Medium-contrast outfits that feel grounded', 'Jewel tones for structure and emphasis'],
      avoid: Array.isArray(parsed.avoid) && parsed.avoid.length > 0 ? parsed.avoid : ['Overly bright neons that overpower', 'Very pale shades that flatten contrast'],
      closingLine: parsed.closingLine ?? 'Style is clarity. You now have yours.',
    });
  } catch (err) {
    console.error('[generate-style-dna]', err);
    return res.status(200).json({
      success: true,
      fallback: true,
      identityPhrase: 'Understated. Refined. Effortless.',
      paletteReasoning: 'Balanced tones that enhance your natural contrast and complexion.',
      leanInto: ['Balanced warm and cool tones', 'Medium-contrast outfits that feel grounded', 'Jewel tones for structure and emphasis'],
      avoid: ['Overly bright neons that overpower', 'Very pale shades that flatten contrast'],
      closingLine: 'Style is clarity. You now have yours.',
    });
  }
}
