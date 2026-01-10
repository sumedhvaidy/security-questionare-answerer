# Security Questionnaire Answerer

**Engineer 2: Citation Agent + Drafting Agent**

A FastAPI service that processes security questionnaires by:
1. **Citation Agent**: Finds relevant citations from context documents (RAG/MongoDB)
2. **Drafting Agent**: Generates answers with confidence scores based on citations

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload

# Test the API
python test_api.py
```

## API Endpoints

### Health Check
```
GET /health
```

### Process Questionnaire
```
POST /process
```

## Input/Output Schema

### Input JSON
```json
{
  "request_id": "req-001",
  "context_documents": [
    {
      "doc_id": "doc-001",
      "title": "Security Policy",
      "content": "Document content here...",
      "source": "mongodb",
      "metadata": {"category": "security"}
    }
  ],
  "questions": [
    {
      "question_id": "q-001",
      "question_text": "How is data encrypted?",
      "category": "data_security"
    }
  ]
}
```

### Output JSON
```json
{
  "request_id": "req-001",
  "total_questions": 5,
  "total_batches": 1,
  "batches": [
    {
      "batch_number": 1,
      "answers": [
        {
          "question_id": "q-001",
          "question_text": "How is data encrypted?",
          "answer": "Generated answer...",
          "confidence": "high",
          "confidence_score": 0.85,
          "citations": [
            {
              "doc_id": "doc-001",
              "doc_title": "Security Policy",
              "relevant_excerpt": "Relevant text...",
              "relevance_score": 0.9
            }
          ],
          "reasoning": "Why this confidence level..."
        }
      ]
    }
  ],
  "status": "completed"
}
```

## Architecture

```
Input (Questions + Context)
         │
         ▼
   ┌─────────────┐
   │  Citation   │  → Finds relevant excerpts
   │    Agent    │  → Assigns relevance scores
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Drafting   │  → Generates answers
   │    Agent    │  → Assigns confidence
   └──────┬──────┘
          │
          ▼
Output (Answers + Citations + Confidence)
```

## Configuration

Environment variables (or in `.env`):
- `FIREWORKS_API_KEY`: Your Fireworks AI API key
- `FIREWORKS_MODEL`: Model to use (default: deepseek-v3p2)
- `BATCH_SIZE`: Questions per batch (default: 5)

## Model

Uses **Fireworks AI** with the `deepseek-v3p2` model for both agents.
