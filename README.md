# Charity Suno - Question Paper Processing System

Charity Suno is a React-based application designed to process question papers by extracting questions from uploaded images, generating AI-powered answers, and providing text-to-speech functionality for the answers.

## Features

### 1. **Image Upload & Question Extraction**

- Upload images from your device or capture them using your camera.
- Extract text from images using AWS Lambda Vision API.
- Automatically identify and parse questions from the extracted text.

### 2. **AI-Powered Question Processing**

- Select questions from the extracted list.
- Send questions to OpenAI for AI-generated answers.
- Display answers in a user-friendly format.

### 3. **Text-to-Speech Functionality**

- Convert AI-generated answers to speech using the Web Speech API.
- Customize playback settings such as voice, speed, and volume.
- Control playback with play, pause, and stop options.

### 4. **User Experience Enhancements**

- Persistent session data across page refreshes.
- View history of previously processed questions and answers.
- Mobile-responsive design for seamless use on any device.

---

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- AWS Lambda endpoint for Vision API
- OpenAI API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/charitymet/charity-suno.git
   cd charity-suno
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:

   ```properties
   VITE_AWS_LAMBDA_ENDPOINT=https://your-lambda-api-endpoint.amazonaws.com/default/visionAPI
   VITE_OPENAI_API_KEY=your-openai-api-key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`.

---

## Usage Guide

### 1. **Upload a Question Paper**

- Click "Upload Image" to select an image from your device.
- Alternatively, click "Use Camera" to capture an image.
- The system will process the image and extract questions.

### 2. **Process Questions**

- Select a question from the extracted list.
- Click "Get Answer" to retrieve an AI-generated answer.
- View the answer in text format.

### 3. **Listen to Answers**

- Use the audio controls to listen to the answer.
- Adjust voice, speed, and volume settings as needed.
- Play, pause, or stop the audio playback.

### 4. **View History**

- Access previously answered questions from the History section.
- Click on a historical question to select it again.

### 5. **Clear Data**

- Click "Clear All Data" to reset the application and start fresh.

---

## AWS Lambda Setup for Vision API

This application uses AWS Lambda for OCR. Follow these steps to set up your Lambda function:

1. Create a new Lambda function in the AWS Console.
2. Set up API Gateway to expose your Lambda as a REST endpoint.
3. Use the following Python code for your Lambda function:

   ```python
   import json
   import boto3
   import base64

   def lambda_handler(event, context):
       body = json.loads(event['body'])
       image_data = body.get('image')
       image_bytes = base64.b64decode(image_data)

       textract = boto3.client('textract')
       response = textract.detect_document_text(Document={'Bytes': image_bytes})

       extracted_text = ""
       for item in response["Blocks"]:
           if item["BlockType"] == "LINE":
               extracted_text += item["Text"] + "\n"

       return {
           'statusCode': 200,
           'headers': {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Allow-Methods': 'POST'
           },
           'body': json.dumps({'text': extracted_text})
       }
   ```

4. Configure appropriate IAM permissions for Textract.
5. Update your `.env` file with the Lambda API Gateway endpoint.

---

## Technology Stack

- **Frontend:** React, Vite
- **APIs:**
  - AWS Lambda (OCR)
  - OpenAI API
  - Web Speech API
- **State Management:** React Context API with session storage
- **Styling:** CSS with responsive design

---

## Security Considerations

- API keys are stored in environment variables and excluded from Git using `.gitignore`.
- For production, consider implementing a backend proxy to secure API keys.
- Validate user inputs and implement proper error handling.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgments

- **AWS Textract** for OCR capabilities.
- **OpenAI** for AI-generated answers.
- **Web Speech API** for text-to-speech functionality.
