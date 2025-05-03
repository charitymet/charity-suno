# Question Paper Processing System

A React application that allows users to upload images of printed question papers, extract questions using AWS Lambda Vision API, send individual questions to OpenAI for answers, and convert those answers to speech output through connected audio devices.

## Features

- **Image Upload & Question Extraction**

  - Upload images from file system
  - Capture images from camera
  - Extract text using AWS Lambda Vision API
  - Automatically identify and parse questions

- **Question Processing**

  - Select questions from the extracted list
  - Send questions to OpenAI for answers
  - Display AI-generated answers

- **Text-to-Speech**

  - Convert answers to speech using Web Speech API
  - Customize voice, speed, and volume
  - Audio playback controls (play, pause, stop)

- **User Experience**
  - Session persistence across page refreshes
  - Question and answer history
  - Mobile-responsive design

## Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- AWS Lambda endpoint for Vision API processing
- OpenAI API key

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd question-paper-app
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:

   ```
   VITE_AWS_LAMBDA_ENDPOINT=https://your-lambda-api-endpoint.amazonaws.com/default/visionAPI
   VITE_OPENAI_API_KEY=your-openai-api-key
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```
npm run build
```

The built files will be in the `dist` directory and can be served using any static file server.

## Usage

1. **Upload a Question Paper**

   - Click "Upload Image" to select an image from your device
   - Or click "Use Camera" to capture an image using your device camera
   - The system will process the image and extract questions

2. **Process Questions**

   - Select a question from the extracted list
   - Click "Get Answer" to retrieve an AI-generated answer
   - View the answer in text format

3. **Listen to Answers**

   - Use the audio controls to listen to the answer
   - Adjust voice, speed, and volume settings as needed
   - Play, pause, or stop the audio playback

4. **View History**

   - Access previously answered questions from the History section
   - Click on a historical question to select it again (if available in current session)

5. **Clear Data**
   - Click "Clear All Data" button to reset the application and start fresh

## AWS Lambda Setup for Vision API

This application uses an AWS Lambda function for OCR instead of Google Cloud Vision API. Follow these steps to set up your Lambda function:

1. Create a new Lambda function in AWS Console
2. Set up API Gateway to expose your Lambda as a REST endpoint
3. Use the following Lambda function code template (Python with boto3):

```python
import json
import boto3
import base64

def lambda_handler(event, context):
    # Parse the incoming request
    body = json.loads(event['body'])
    image_data = body.get('image')

    # Decode base64 image
    image_bytes = base64.b64decode(image_data)

    # Initialize the Amazon Textract client
    textract = boto3.client('textract')

    # Call Amazon Textract
    response = textract.detect_document_text(
        Document={
            'Bytes': image_bytes
        }
    )

    # Extract and format the detected text
    extracted_text = ""
    for item in response["Blocks"]:
        if item["BlockType"] == "LINE":
            extracted_text += item["Text"] + "\n"

    # Return the extracted text
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST'
        },
        'body': json.dumps({
            'text': extracted_text
        })
    }
```

4. Configure appropriate IAM permissions for Textract
5. Update your `.env` file with the Lambda API Gateway endpoint

## Technology Stack

- **Frontend:** React, Vite
- **APIs:**
  - AWS Lambda (OCR)
  - OpenAI API
  - Web Speech API
- **State Management:** React Context API with session storage
- **Styling:** CSS with responsive design

## Security Considerations

- API keys are stored in environment variables
- In a production environment, consider implementing a backend proxy service to secure API keys
- Validate user inputs and implement proper error handling

## License

MIT
# charity-suno
# charity-suno
# charity-suno
# charity-suno
# charity-suno
# charity-suno
# charity-suno
