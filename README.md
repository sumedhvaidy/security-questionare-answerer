# Security Questionnaire Autopilot

**Turn 200–1,500 question security questionnaires (often Excel) into completed answers with citations in minutes, with human escalation only when needed.**

A multi-agent system that processes security questionnaires using AI agents for knowledge retrieval, citation generation, answer drafting, and intelligent escalation.

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Agent Responsibilities](#agent-responsibilities)
- [API Endpoints](#api-endpoints)
- [Development](#development)

---

## 🎯 System Overview

### Goal
Automate security questionnaire completion by:
- Processing 200–1,500 questions efficiently
- Generating answers with citations and confidence scores
- Escalating uncertain items to the right human owner
- Providing a clean upload → download UI

### Multi-Agent Pipeline

The system uses four specialized agents working together:

1. **Knowledge Agent** (Engineer 1) - Vector search, embeddings, semantic matching
2. **Citation & Drafting Agent** (Engineer 2) - Creates citations and generates answers
3. **Escalation Agent** (Engineer 3) - Human escalation for low confidence answers
4. **Parser & UI** (Engineer 4) - File upload, questionnaire parsing, demo interface

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  • File upload (Excel/CSV questionnaires)                   │
│  • View answers + sources                                    │
│  • Escalation status dashboard                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (FastAPI/Flask)                     │
│  • Orchestrates agent workflow                              │
│  • Processes batches of questions                           │
│  • Returns structured responses                             │
└──────────┬───────────────┬───────────────┬──────────────────┘
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │Knowledge │    │Citation/ │    │Escalation│
    │  Agent   │    │ Drafting │    │  Agent   │
    │          │    │  Agent   │    │          │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┴───────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              MongoDB Atlas (State + Memory)                  │
│  • Security documents (RAG)                                  │
│  • Codebase chunks (vector embeddings)                       │
│  • Employee directory                                        │
│  • QA library (verified answers)                             │
│  • Unanswered questions / audit logs                         │
└─────────────────────────────────────────────────────────────┘
```

### Agent Responsibilities

#### 🧠 Engineer 1: Knowledge Agent (MongoDB + Vector Search)
**Location**: `agents/knowledge_agent.py`

**Responsibilities**:
- Vector search and embeddings (using VoyageAI)
- Semantic matching across documents
- QA library lookup (verified answers)
- Document chunk retrieval
- Confidence scoring for evidence

**Technologies**:
- MongoDB Atlas Vector Search
- VoyageAI embeddings (`voyage-3-large`)
- Anthropic Claude (for answer generation)

#### 📚 Engineer 2: Citation Agent + Drafting Agent
**Location**: `app/agents/citation_agent.py`, `app/agents/drafting_agent.py`

**Responsibilities**:
- **Citation Agent**: Finds relevant citations from context documents
- **Drafting Agent**: Generates answers with confidence scores
- Processes questions in batches
- Creates structured output with citations

**Technologies**:
- Fireworks AI (`deepseek-v3p2`)
- JSON structured outputs

#### 🔄 Engineer 3: Escalation Agent
**Location**: `agents/escalation_agent.py`

**Responsibilities**:
- Determines if human escalation is needed (low confidence answers)
- Routes questions to appropriate employees/departments
- Uses Fireworks AI for intelligent escalation decisions
- Threshold-based fallback (confidence < 0.7)

**Technologies**:
- Fireworks AI (`deepseek-v3p2`)
- MongoDB (employee directory)
- Category-based routing (Security, Compliance, Engineering)

#### 📄 Engineer 4: Parser & UI
**Location**: `frontend/`, file upload handlers

**Responsibilities**:
- File upload (Excel/CSV security questionnaires)
- Question parsing and normalization
- Demo interface
- Answer generation display
- Escalation status tracking

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+ (Python 3.12 recommended for best compatibility)
- MongoDB Atlas account (for vector search and document storage)
- Fireworks AI API key
- VoyageAI API key (for embeddings)
- Anthropic API key (for Knowledge Agent)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd security-questionare-answerer
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

   **Note**: If you encounter `pydantic-core` build errors (common with Python 3.14+):
   - **Recommended**: Use Python 3.12: `pyenv install 3.12.0 && pyenv local 3.12.0`
   - **Alternative**: Install Rust: `brew install rust` (macOS)

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```bash
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=app-name
   MONGODB_DB_NAME=security_questionnaire
   
   # Fireworks AI Configuration
   FIREWORKS_API_KEY=fw_your_api_key_here
   FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v3p2
   
   # Batch Configuration
   BATCH_SIZE=5
   
   # VoyageAI (for Knowledge Agent)
   VOYAGE_API_KEY=your_voyage_api_key_here
   
   # Anthropic (for Knowledge Agent)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. **Seed employee data** (for Escalation Agent)
   ```bash
   export MONGODB_URI="your_mongodb_uri"
   export FIREWORKS_API_KEY="your_fireworks_key"
   python seed_employees.py
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`

6. **Test the API**
   ```bash
   python test_api.py
   ```

### Quick Test

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test processing endpoint
python test_api.py
```

---

## ⚙️ Configuration

### Environment Variables

All configuration is done via environment variables (or `.env` file):

#### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `FIREWORKS_API_KEY` | Fireworks AI API key | `fw_LvS1WYi7mG6cU8k1p9BPuH` |

#### Optional (with defaults)

| Variable | Description | Default |
|----------|-------------|---------|
| `FIREWORKS_MODEL` | Fireworks AI model to use | `accounts/fireworks/models/deepseek-v3p2` |
| `BATCH_SIZE` | Questions per batch | `5` |
| `MONGODB_DB_NAME` | MongoDB database name | `security_questionnaire` |
| `VOYAGE_API_KEY` | VoyageAI API key (for embeddings) | - |
| `ANTHROPIC_API_KEY` | Anthropic API key (for Knowledge Agent) | - |

#### Escalation Agent Specific

| Variable | Description | Default |
|----------|-------------|---------|
| `ESCALATION_CONFIDENCE_THRESHOLD` | Confidence threshold for escalation | `0.7` |

### Configuration File

Configuration can also be set in `app/config.py` (Settings class using Pydantic):

```python
from app.config import settings

print(settings.fireworks_model)  # accounts/fireworks/models/deepseek-v3p2
print(settings.batch_size)       # 5
```

---

## 🤖 Agent Responsibilities

### 1. Knowledge Agent (Engineer 1)

**Purpose**: Vector search, embeddings, and semantic matching

**Key Features**:
- Checks QA library for verified answers (memory)
- Performs vector search on document chunks
- Generates embeddings using VoyageAI
- Scores evidence confidence
- Returns structured evidence with citations

**Usage**:
```python
from agents.knowledge_agent import KnowledgeAgent

agent = KnowledgeAgent()
response = agent.answer_question("How is data encrypted at rest?")
print(response.answer)
print(response.confidence_score)
print(response.evidence)
```

### 2. Citation Agent + Drafting Agent (Engineer 2)

**Purpose**: Create citations and generate answers with confidence

**Flow**:
1. **Citation Agent**: Finds relevant citations from context documents
2. **Drafting Agent**: Generates professional answers based on citations
3. Assigns confidence scores (high/medium/low)
4. Returns structured JSON output

**API Endpoint**: `POST /process`

**Request Format**:
```json
{
  "questions": [
    {
      "question_id": "Q-001",
      "question_text": "How is customer data encrypted?",
      "category": "Data Security"
    }
  ],
  "context_documents": [
    {
      "doc_id": "DOC-001",
      "title": "Data Protection Policy",
      "content": "..."
    }
  ]
}
```

### 3. Escalation Agent (Engineer 3)

**Purpose**: Human escalation for low confidence answers

**Key Features**:
- Processes batches of Q&A pairs
- Uses Fireworks AI to determine escalation needs
- Routes to appropriate employees based on:
  - Question category (encryption, compliance, etc.)
  - Employee expertise areas
  - Department matching
- Threshold-based fallback (confidence < 0.7)

**Usage**:
```python
from agents.escalation_agent import EscalationAgent
from models.request_for_escalation_agent import EscalationRequest

agent = EscalationAgent(
    firework_api_key="fw_...",
    confidence_threshold=0.7
)

result = await agent.process_batch(escalation_request)
for res in result.results:
    if res.requires_escalation:
        print(f"Escalated to: {res.routed_to['name']}")
```

### 4. Parser & UI (Engineer 4)

**Purpose**: File upload, parsing, and demo interface

**Features**:
- Excel/CSV questionnaire upload
- Question extraction and normalization
- Processing status display
- Results download
- Escalation tracking

---

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "citation-drafting-agent"
}
```

### Process Questionnaire

```http
POST /process
Content-Type: application/json
```

**Request Body**:
```json
{
  "questions": [
    {
      "question_id": "Q-001",
      "question_text": "How is customer data encrypted at rest?",
      "category": "Data Security"
    }
  ],
  "context_documents": [
    {
      "doc_id": "DOC-001",
      "title": "Data Protection Policy",
      "content": "All customer data is encrypted using AES-256..."
    }
  ]
}
```

**Response**:
```json
{
  "request_id": "req-001",
  "total_questions": 1,
  "total_batches": 1,
  "batches": [
    {
      "batch_number": 1,
      "answers": [
        {
          "question_id": "Q-001",
          "question_text": "How is customer data encrypted at rest?",
          "answer": "Customer data at rest is encrypted using AES-256...",
          "confidence": "high",
          "confidence_score": 0.95,
          "citations": [
            {
              "doc_id": "DOC-001",
              "doc_title": "Data Protection Policy",
              "relevant_excerpt": "All customer data is encrypted...",
              "relevance_score": 1.0
            }
          ],
          "reasoning": "Citation directly addresses encryption at rest."
        }
      ]
    }
  ],
  "status": "completed"
}
```

### Escalation Endpoint

```http
POST /api/v1/escalate
Content-Type: application/json
```

See `fastapi_endpoint_example.py` for full implementation.

---

## 🗄️ Database Setup

### MongoDB Collections

The system uses the following MongoDB collections:

1. **`employees`** - Employee directory for escalation routing
2. **`documents`** - Security documents for RAG
3. **`chunks`** - Document chunks with vector embeddings
4. **`qa_library`** - Verified question-answer pairs

### Seed Employee Data

```bash
export MONGODB_URI="your_mongodb_uri"
python seed_employees.py
```

This creates 8 fake employees across Security, Engineering, and Compliance departments.

### MongoDB Indexes

The following indexes are automatically created:

- `employees.email` (unique)
- `employees.department`
- `employees.expertise_areas`
- `chunks` vector index for semantic search

---

## 🔧 Development

### Project Structure

```
security-questionare-answerer/
├── app/                          # FastAPI application (Engineer 2)
│   ├── main.py                  # FastAPI app with /process endpoint
│   ├── config.py                # Configuration settings
│   ├── agents/
│   │   ├── citation_agent.py   # Citation Agent
│   │   └── drafting_agent.py   # Drafting Agent
│   └── models.py                # Pydantic models
├── agents/                       # Core agents
│   ├── knowledge_agent.py       # Knowledge Agent (Engineer 1)
│   └── escalation_agent.py      # Escalation Agent (Engineer 3)
├── models/                       # Data models
│   ├── employee.py              # Employee models
│   └── request_for_escalation_agent.py  # Escalation request models
├── frontend/                     # Next.js UI (Engineer 4)
├── database.py                   # MongoDB connection
├── seed_employees.py             # Seed employee data
├── test_api.py                   # API tests
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

### Running Tests

```bash
# Test API
python test_api.py

# Test escalation agent
python example_citation_request.py

# Test full flow
python test_full_flow.py
```

### Development Mode

```bash
# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📚 Additional Documentation

- [Citation Request Integration](./CITATION_REQUEST_INTEGRATION.md) - Detailed guide on Escalation Request format
- [Fireworks Model Fix](./FIREWORKS_MODEL_FIX.md) - Troubleshooting Fireworks AI model issues

---

## 🔐 Security Notes

- **Never commit API keys** to version control
- Use `.env` file (already in `.gitignore`)
- Rotate API keys regularly
- Use MongoDB Atlas IP whitelist for production
- Implement rate limiting for production APIs

---

## 🐛 Troubleshooting

### Fireworks AI 404 Errors

If you see "Model not found" errors:
- The model `deepseek-v3p2` should work with most API keys
- Check your Fireworks AI account for available models
- The system falls back to threshold-based escalation if Fireworks AI is unavailable

### MongoDB Connection Issues

- Verify your MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure SSL certificates are installed (`pip install certifi`)

### Python 3.14 Compatibility

- Use Python 3.12 for best compatibility
- Or install Rust for building `pydantic-core`: `brew install rust`

---

## 📝 License

[Your License Here]

---

## 👥 Contributors

- Engineer 1: Knowledge Agent (MongoDB + Vector Search)
- Engineer 2: Citation Agent + Drafting Agent
- Engineer 3: Escalation Agent
- Engineer 4: Parser & UI

---

**Made for the Security Questionnaire Autopilot Hackathon**
