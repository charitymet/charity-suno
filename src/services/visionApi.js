import axios from "axios";
const AWS_LAMBDA_ENDPOINT =
  "https://eomq47naou5oopejqkm2e3q3ya0mgpyv.lambda-url.ap-south-1.on.aws/";
// Using AWS Lambda API instead of Google Cloud Vision as requested
const apiEndpoint = import.meta.env.PROD ? AWS_LAMBDA_ENDPOINT : "/api/lambda"; // Use the proxy path in development mode
export const extractTextFromImage = async (imageFile) => {
  try {
    // Convert image file to base64
    const base64Image = await fileToBase64(imageFile);

    // Get the API endpoint from environment variables or use proxy path for development

    console.log("Sending image to OCR service...");

    // Call AWS Lambda API for OCR processing
    const response = await axios.post(
      apiEndpoint,
      {
        image: base64Image,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 second timeout
      }
    );

    if (!response.data) {
      throw new Error("No data returned from OCR service");
    }

    if (response.status !== 200) {
      throw new Error(`OCR service returned status ${response.status}`);
    }

    console.log("OCR processing complete, parsing questions...", response.data);
    return processExtractedText(response.data);
  } catch (error) {
    console.error("Error extracting text:", error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `OCR service error: ${error.response.status} - ${
          error.response.data.message || "Unknown error"
        }`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(
        "OCR service timeout or no response. Please check your internet connection and try again."
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Error processing image: ${error.message}`);
    }
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Keep the complete data URL as Lambda expects this format
      // Format: "data:image/jpeg;base64,/9j/4AAQSkZ..."
      const dataUrl = reader.result;
      resolve(dataUrl);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Process the extracted text to identify individual questions
const processExtractedText = (data) => {
  // Check if Lambda returned the new format with question and marks fields
  if (
    data.success &&
    data.questions &&
    Array.isArray(data.questions) &&
    data.questions.length > 0 &&
    data.questions[0].hasOwnProperty("question")
  ) {
    console.log(
      `Lambda returned ${data.questions.length} questions with marks. Using new format...`
    );

    // Transform the array of question objects into the expected format with id and text properties
    const formattedQuestions = data.questions.map((item, index) => ({
      id: `${index + 1}.`,
      text: item.question + (item.marks ? ` (${item.marks} marks)` : ""),
      marks: item.marks, // Preserve the marks field for potential future use
    }));

    return {
      fullText: formattedQuestions.map((q) => `${q.id} ${q.text}`).join("\n\n"),
      questions: formattedQuestions,
    };
  }

  // Check if Lambda returned the older direct questions format (array of strings)
  if (
    data.success &&
    data.questions &&
    Array.isArray(data.questions) &&
    data.questions.length > 0 &&
    typeof data.questions[0] === "string"
  ) {
    console.log(
      `Lambda returned ${data.questions.length} direct questions. Using them directly...`
    );

    // Transform the array of strings into the expected format with id and text properties
    const formattedQuestions = data.questions.map((questionText, index) => ({
      id: `${index + 1}.`,
      text: questionText.trim(),
    }));

    return {
      fullText: formattedQuestions.map((q) => `${q.id} ${q.text}`).join("\n\n"),
      questions: formattedQuestions,
    };
  }

  // Check if Lambda already returned the older structured question data that needs reconstruction
  if (
    data.questions &&
    Array.isArray(data.questions) &&
    data.questions.length > 0
  ) {
    console.log(
      `Lambda returned ${data.questions.length} question fragments. Reconstructing...`
    );
    return reconstructQuestions(data);
  }

  // Fallback to the original text processing if Lambda didn't provide structured questions
  const fullText = data.text || data.extractedText || "";

  // Log the extracted text for debugging
  console.log("Extracted text:", fullText.substring(0, 100) + "...");

  // More sophisticated question parsing logic
  const questions = [];

  // First try numbered questions (e.g. "1. What is...")
  const numberedQuestionPattern = /(\d+[\.)]\s*)(.*?)(?=\d+[\.)]\s*|$)/gs;
  let match;
  let foundQuestions = false;

  while ((match = numberedQuestionPattern.exec(fullText)) !== null) {
    if (match[2] && match[2].trim()) {
      questions.push({
        number: match[1].trim(),
        text: match[2].trim(),
      });
      foundQuestions = true;
    }
  }

  // If no numbered questions found, try to find question marks
  if (!foundQuestions) {
    const questionMarkPattern = /([^.!?]+\?)/g;
    while ((match = questionMarkPattern.exec(fullText)) !== null) {
      if (match[1] && match[1].trim()) {
        questions.push({
          number: `Q${questions.length + 1}.`,
          text: match[1].trim(),
        });
      }
    }
  }

  // If still no questions found, split by sentences as fallback
  if (questions.length === 0) {
    const sentences = fullText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);
    sentences.forEach((sentence, index) => {
      questions.push({
        number: `${index + 1}.`,
        text: sentence.trim(),
      });
    });
  }

  return {
    fullText,
    questions: questions.map((q) => ({ id: q.number, text: q.text })),
  };
};

// New function to handle Lambda's fragmented questions format
const reconstructQuestions = (data) => {
  const fullText = data.extractedText || "";
  const fragmentedQuestions = data.questions || [];

  // Attempt to reconstruct complete questions from fragments
  const reconstructedQuestions = [];
  let currentQuestion = "";
  let currentId = "";
  let questionIndex = 1;

  // First pass: merge fragments that seem to be part of the same question
  for (let i = 0; i < fragmentedQuestions.length; i++) {
    const fragment = fragmentedQuestions[i];
    const text = fragment.text.trim();
    const number = fragment.number?.trim() || "";

    // Check if this is the start of a new question or continuation
    if (
      text.match(/^[A-Z]/) && // Starts with capital letter
      (number.match(/^\d+[\.)]\s*$/) || // Has a numeric prefix
        number.match(/^[A-Z][.)]\s*$/) || // Has an alphabetic prefix
        text.match(
          /^([W|w]hat|[W|w]hy|[H|h]ow|[D|d]escribe|[E|e]xplain|[D|d]iscuss|[A|a]nalyze)/
        ))
    ) {
      // Starts with question word

      // If we have accumulated text, save it as a question
      if (currentQuestion) {
        reconstructedQuestions.push({
          id: currentId || `${questionIndex}.`,
          text: currentQuestion.trim(),
        });
        questionIndex++;
      }

      // Start a new question
      currentQuestion = text;
      currentId = number || `${questionIndex}.`;
    } else {
      // Continuation of current question
      if (currentQuestion) {
        currentQuestion += " " + text;
      } else {
        // First fragment doesn't start with a capital letter - still treat as first question
        currentQuestion = text;
        currentId = number || `${questionIndex}.`;
      }
    }
  }

  // Don't forget the last question
  if (currentQuestion) {
    reconstructedQuestions.push({
      id: currentId || `${questionIndex}.`,
      text: currentQuestion.trim(),
    });
  }

  // Second pass: clean up questions
  const cleanedQuestions = reconstructedQuestions.map((question) => {
    // Remove any trailing "Attempt any one:" and similar phrases
    let cleanedText = question.text.replace(/\s*Attempt any one:.*$/, "");

    // Clean up any multiple question marks
    cleanedText = cleanedText.replace(/\?\s*\?/g, "?");

    return {
      id: question.id,
      text: cleanedText.trim(),
    };
  });

  // If reconstruction failed (no questions detected), fall back to the original method
  if (cleanedQuestions.length === 0) {
    return processExtractedText({ text: fullText });
  }

  // Return reconstructed questions with the full text
  return {
    fullText,
    questions: cleanedQuestions,
  };
};
