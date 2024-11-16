import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_CLAUDE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log("HERE")
    const { jobDescription } = req.body;

    

    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Parse this job description and extract the following information in JSON format:
          {
            "company": "Company name",
            "position": "Job title",
            "url": "Application URL if present",
            "application_id": "Any reference/job ID if present"
          }

          Job Description:
          ${jobDescription}
        `
      }]
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
} 