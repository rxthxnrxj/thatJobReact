import axios from 'axios';

export const parseJobDescription = async (jobDescription) => {
  try {
    const response = await axios.post('http://localhost:5000/api/claude', {
      jobDescription: jobDescription
    });

    if (response.data && response.data.content && response.data.content[0]) {
      try {
        console.log("RESPONSE DATA", response.data.content[0]);
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
