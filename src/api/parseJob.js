import axios from 'axios';

export const parseJobDescription = async (jobDescription) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL?.replace(/\/+$/, '') || 'http://localhost:5000'; #prod
    // const API_URL = 'http://localhost:5000';
    
    const response = await axios.post(`${API_URL}/api/claude`, {
      jobDescription: jobDescription
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.content && response.data.content[0]) {
      try {
        const cleanedText = response.data.content[0].text.replace(/None/g, 'null');
        const parsedData = JSON.parse(cleanedText);
        return {
          company: parsedData.company || '',
          position: parsedData.position || '',
          application_url: parsedData.url || '',
          application_id: parsedData.application_id || ''
        };
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
        throw new Error('Failed to parse Claude response');
      }
    } else {
      throw new Error('Invalid response format from Claude');
    }
  } catch (error) {
    console.error('Error calling backend:', error);
    throw error;
  }
};
