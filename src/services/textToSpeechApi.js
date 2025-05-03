import axios from "axios";

// Replace with your actual Lambda function URL
const LAMBDA_API_URL =
  "https://sxst5kcell4xbsveo4qsfitcxe0nvgso.lambda-url.ap-south-1.on.aws";
const apiEndpoint = import.meta.env.PROD ? LAMBDA_API_URL : "/api/lambda-ssml"; // Use the proxy path in development mode

/**
 * Converts text to speech using Lambda API
 * @param {string} text - The text to convert to speech
 * @returns {Promise<Object>} - Promise resolving to audio URL data
 */
export const convertTextToSpeech = async (text) => {
  try {
    const ssmlText = `<speak>${text}</speak>`;

    const response = await axios.post(apiEndpoint, {
      ssmlText,
    });

    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }

    if (!response.data.success || !response.data.audioUrl) {
      throw new Error("Failed to get audio URL from API");
    }

    return {
      audioUrl: response.data.audioUrl,
      expiresIn: response.data.expiresIn || 3600, // Default to 1 hour if not provided
    };
  } catch (error) {
    console.error("Error converting text to speech:", error);
    throw error;
  }
};
