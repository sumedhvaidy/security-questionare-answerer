"""
FastAPI application for Security Questionnaire Answerer.

Unified API that orchestrates all agents:
- Engineer 1: Knowledge Agent (MongoDB + Vector Search)
- Engineer 2: Citation Agent + Drafting Agent
- Engineer 3: Escalation Agent
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from contextlib import asynccontextmanager
from typing import Optional
import httpx

from src.core.config import settings
from src.core.database import db
from src.models.api import (
    QuestionnaireInput,
    QuestionnaireOutput,
    EscalationResponse,
)
from src.agents.orchestrator import QuestionnaireOrchestrator, OrchestratorConfig


# Initialize orchestrator
orchestrator = QuestionnaireOrchestrator(
    config=OrchestratorConfig(
        batch_size=settings.batch_size,
        confidence_threshold=settings.confidence_threshold,
        use_knowledge_agent=True,
        use_citation_agent=True,
        run_escalation=True
    )
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("🚀 Security Questionnaire Answerer starting up...")
    print(f"📦 Batch size: {settings.batch_size}")
    print(f"📊 Confidence threshold: {settings.confidence_threshold}")
    
    # Connect to MongoDB for async operations (for escalation agent employee routing)
    try:
        if settings.mongodb_uri:
            await db.connect(settings.mongodb_uri, settings.mongodb_db_name)
        else:
            print("⚠️  MongoDB URI not configured - escalation routing disabled")
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
    
    yield
    
    # Cleanup
    await db.disconnect()
    print("👋 Shutting down...")


app = FastAPI(
    title="Security Questionnaire Answerer",
    description="""
Multi-Agent Security Questionnaire Autopilot

Agents:
- **Knowledge Agent** (Engineer 1): MongoDB vector search, QA library, answerability checking
- **Citation Agent** (Engineer 2): RAG context citations
- **Drafting Agent** (Engineer 2): Answer generation with confidence
- **Escalation Agent** (Engineer 3): Human routing for low confidence answers

Pipeline:
1. Question → Knowledge Agent (check verified answers, vector search)
2. If no answer → Citation Agent + Drafting Agent (RAG path)
3. Low confidence → Escalation Agent (route to humans)
    """,
    version="2.0.0",
    lifespan=lifespan
)


async def forward_to_callback(callback_url: str, data: dict):
    """Forward the response to a callback URL."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(callback_url, json=data)
            print(f"✅ Forwarded to {callback_url} - Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Failed to forward to {callback_url}: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "security-questionnaire-answerer",
        "version": "2.0.0",
        "agents": ["knowledge", "citation", "drafting", "escalation"]
    }


@app.post("/process", response_model=QuestionnaireOutput)
async def process_questionnaire(
    input_data: QuestionnaireInput,
    background_tasks: BackgroundTasks,
    callback_url: Optional[str] = None
) -> QuestionnaireOutput:
    """
    Process a security questionnaire through the multi-agent pipeline.
    
    Pipeline:
    1. Knowledge Agent checks QA library and vector search
    2. Citation Agent finds relevant context
    3. Drafting Agent generates answers with confidence
    4. Low-confidence answers flagged for escalation
    
    Query Parameters:
        callback_url: Optional URL to forward the response to
    
    Returns:
        QuestionnaireOutput with answers, citations, confidence, and escalation flags
    """
    try:
        output = await orchestrator.process_questionnaire(input_data, verbose=True)
        
        # Forward to callback URL if provided
        if callback_url:
            background_tasks.add_task(
                forward_to_callback,
                callback_url,
                output.model_dump()
            )
        
        return output
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/with-escalation")
async def process_with_escalation(
    input_data: QuestionnaireInput,
    background_tasks: BackgroundTasks,
    callback_url: Optional[str] = None
) -> dict:
    """
    Process questionnaire and run full escalation routing.
    
    Returns both the questionnaire output and escalation details
    including which employees are assigned to review each question.
    """
    try:
        output, escalation_response = await orchestrator.process_with_escalation(
            input_data, verbose=True
        )
        
        result = {
            "questionnaire": output.model_dump(),
            "escalation": escalation_response.model_dump() if escalation_response else None
        }
        
        if callback_url:
            background_tasks.add_task(forward_to_callback, callback_url, result)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/async")
async def process_questionnaire_async(
    input_data: QuestionnaireInput,
    background_tasks: BackgroundTasks,
    callback_url: str
):
    """
    Async processing - immediately returns, processes in background,
    then sends result to callback_url.
    """
    async def process_and_forward():
        try:
            output, escalation = await orchestrator.process_with_escalation(input_data)
            result = {
                "questionnaire": output.model_dump(),
                "escalation": escalation.model_dump() if escalation else None
            }
            await forward_to_callback(callback_url, result)
        except Exception as e:
            await forward_to_callback(callback_url, {"error": str(e)})
    
    background_tasks.add_task(process_and_forward)
    
    return {
        "status": "accepted",
        "request_id": input_data.request_id,
        "message": f"Processing {len(input_data.questions)} questions. Results will be sent to {callback_url}"
    }


@app.get("/stats")
async def get_stats():
    """Get statistics about the knowledge base."""
    if orchestrator.knowledge_agent:
        stats = orchestrator.knowledge_agent.get_stats()
        return {
            "status": "ok",
            "knowledge_base": stats
        }
    return {"status": "ok", "knowledge_base": "not configured"}

