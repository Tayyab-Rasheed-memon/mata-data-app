import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { image, prompt } = req.body;
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview', // Ensure this model is available in your OpenAI plan
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
            ],
          },
        ],
      });
      const generatedText = response.choices[0].message.content;
      // Extract JSON from the response
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      const jsonStr = generatedText.substring(jsonStart, jsonEnd + 1);
      const { title, keywords } = JSON.parse(jsonStr);
      res.status(200).json({ title, keywords });
    } catch (error) {
      console.error('Error generating metadata:', error);
      res.status(500).json({ error: 'Failed to generate metadata' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}