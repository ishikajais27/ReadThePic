# Image to Text Backend - GLM-OCR

## Setup Instructions

### 1. Install Python (3.9 or higher)

Make sure Python 3.9+ is installed on your system.

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### 3. Activate Virtual Environment

**Windows:**

```bash
venv\Scripts\activate
```

**Mac/Linux:**

```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** First installation will download the GLM-OCR model (~2GB). This happens automatically on first run.

### 5. Run the Server

```bash
python -m app.main
```

Or:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

### 6. Test the API

**Health Check:**

```bash
curl http://localhost:8000/health
```

**Extract Text (using curl):**

```bash
curl -X POST "http://localhost:8000/api/extract-text" \
  -F "file=@/path/to/your/image.png" \
  -F "task_type=text"
```

## API Endpoints

### POST /api/extract-text

Extract text from a single image.

**Parameters:**

- `file` (required): Image file
- `task_type` (optional): "text", "formula", or "table" (default: "text")

**Response:**

```json
{
  "success": true,
  "filename": "image.png",
  "task_type": "text",
  "extracted_text": "Extracted content here..."
}
```

### POST /api/extract-text-batch

Extract text from multiple images.

**Parameters:**

- `files` (required): Array of image files
- `task_type` (optional): "text", "formula", or "table"

## Environment Variables

Edit `.env` file to customize:

- `MODEL_PATH`: Hugging Face model path (default: zai-org/GLM-OCR)
- `MAX_NEW_TOKENS`: Maximum tokens to generate (default: 8192)
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

## Hardware Requirements

- **Minimum:** 8GB RAM, CPU only (slower)
- **Recommended:** 16GB RAM, NVIDIA GPU with 6GB+ VRAM
- **Storage:** 5GB for model files

## Troubleshooting

**Out of Memory:** Reduce `MAX_NEW_TOKENS` in `.env`

**Slow Processing:** Install CUDA-enabled PyTorch for GPU acceleration

**Model Download Issues:** Check internet connection, model downloads from Hugging Face
