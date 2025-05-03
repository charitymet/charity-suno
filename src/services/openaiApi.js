import axios from "axios";

// Maximum number of retries when encountering rate limit errors
const MAX_RETRIES = 3;
// Base delay in milliseconds before retrying (will be multiplied by 2^retryCount)
const BASE_RETRY_DELAY = 1000;
const VITE_LAMBDA_ENDPOINT =
  "https://feyfaopxrz25duocz6vohhdlyq0oybff.lambda-url.ap-south-1.on.aws/";
// Get the API endpoint from environment variables or use proxy path for development
const apiEndpoint = import.meta.env.PROD
  ? VITE_LAMBDA_ENDPOINT
  : "/api/lambda-ai"; // Use the proxy path in development mode

export const getAnswerForQuestion = async (question, marks) => {
  console.log("API endpoint:", apiEndpoint);
  // Validate the question input
  if (!question || typeof question !== "string" || question.trim() === "") {
    throw new Error("Question must be a non-empty string");
  }
  let retryCount = 0;

  const makeRequest = async () => {
    try {
      console.log(`Sending question to Lambda endpoint: ${apiEndpoint}`);

      // Prepare request payload with question and marks
      const payload = {
        question,
      };

      // Add marks to payload if provided
      if (marks !== undefined && marks !== null) {
        payload.marks = marks;
      }

      // Call the Lambda function with the question and marks
      const response = await axios.post(apiEndpoint, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 500000, // 500 second timeout
      });
      console.log("Lambda response status:", response.status);

      console.log("Lambda response:", response.data);

      // Handle the Lambda response - should be directly in format {question, answer}
      if (response.data && response.data.answer) {
        return response.data.answer;
      }

      throw new Error("No answer returned from the Lambda service");
    } catch (error) {
      console.error("Error getting answer from Lambda service:", error);

      // Check if it's a network error or timeout
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount - 1);
          console.log(
            `Request timeout. Retrying in ${
              delay / 1000
            } seconds... (Attempt ${retryCount}/${MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return makeRequest();
        } else {
          throw new Error(
            "The service is taking too long to respond. Please try again later."
          );
        }
      }

      // Handle HTTP status errors
      if (error.response) {
        // Extract error message from response
        let errorMessage = "An unknown error occurred";

        if (error.response.data) {
          if (typeof error.response.data === "string") {
            try {
              const parsed = JSON.parse(error.response.data);
              errorMessage = parsed.error || parsed.message || errorMessage;
            } catch (e) {
              errorMessage = error.response.data;
            }
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        }

        throw new Error(
          `Error from Lambda service (${error.response.status}): ${errorMessage}`
        );
      } else if (error.request) {
        throw new Error(
          "Network error. Please check your internet connection."
        );
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  };

  return makeRequest();
};
