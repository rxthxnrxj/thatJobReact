const parseWithClaude = async (emailContent) => {
  const prompt = `
    You are an AI assistant helping to parse job application emails. Analyze this email and:
    
    1. First, determine if this is:
       - A new job application confirmation
       - A status update for an existing application
       - Neither (not job related)
    
    2. If it's job related, extract:
       - Company name
       - Position title
       - Application ID/reference number (if any)
       - Application URL (if any)
       - Current status (applied/processing/rejected/accepted)
       - Any next steps or important dates
    
    Return the data in this JSON format:
    {
      "type": "new_application" | "status_update" | "not_relevant",
      "data": {
        "company": "",
        "position": "",
        "application_id": "",
        "url": "",
        "status": "",
        "next_steps": "",
        "confidence_score": 0-1
      }
    }

    Email content:
    ${emailContent}
  `;

  try {
    const completion = await claude.createCompletion({
      model: "claude-v1",
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.2
    });

    return JSON.parse(completion.data.choices[0].text.trim());
  } catch (error) {
    console.error('Error parsing with Claude:', error);
    throw error;
  }
}; 