"""
FastAPI endpoint example for Escalation Agent
This shows how to integrate the escalation agent into a FastAPI service
"""
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import os
from database import db
from agents.escalation_agent import EscalationAgent
from models.request_for_escalation_agent import EscalationRequest, EscalationResponse

app = FastAPI(
    title="Security Questionnaire Escalation API",
    description="API for processing security questionnaire responses and routing escalations",
    version="1.0.0"
)

# Initialize escalation agent on startup
escalation_agent = None


@app.on_event("startup")
async def startup_event():
    """Initialize database and escalation agent on startup"""
    global escalation_agent
    
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb+srv://username:password@cluster.mongodb.net/")
    db_name = os.getenv("MONGODB_DB_NAME", "security_qa")
    
    await db.connect(mongodb_uri, db_name)
    
    firework_key = os.getenv("FIREWORK_API_KEY", "fw_LvS1WYi7mG6cU8k1p9BPuH")
    escalation_agent = EscalationAgent(
        firework_api_key=firework_key,
        confidence_threshold=float(os.getenv("ESCALATION_CONFIDENCE_THRESHOLD", "0.7"))
    )
    print("✅ Escalation Agent initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await db.disconnect()
    print("✅ Database connection closed")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Security Questionnaire Escalation API",
        "version": "1.0.0"
    }


@app.post("/api/v1/escalate", response_model=EscalationResponse)
async def process_escalation(request: EscalationRequest):
    """
    Process escalation request from citation agentic AI and determine escalations
    
    Args:
        request: EscalationRequest from citation agentic AI
    
    Returns:
        EscalationResponse with escalation decisions and employee routing
    """
    if escalation_agent is None:
        raise HTTPException(status_code=503, detail="Escalation agent not initialized")
    
    try:
        # Process the request through escalation agent
        result = await escalation_agent.process_batch(request)
        
        return result
    
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/v1/escalate/legacy")
async def process_escalation_legacy(request: dict):
    """
    Legacy endpoint for backward compatibility
    Accepts simple dictionary format
    
    Args:
        request: Dictionary with questions, answers, confidence_scores, categories
    
    Returns:
        Dictionary with escalation decisions
    """
    if escalation_agent is None:
        raise HTTPException(status_code=503, detail="Escalation agent not initialized")
    
    try:
        questions = request.get("questions", [])
        answers = request.get("answers", [])
        confidence_scores = request.get("confidence_scores", [])
        categories = request.get("categories", None)
        
        if not all([questions, answers, confidence_scores]):
            raise HTTPException(
                status_code=422,
                detail="Missing required fields: questions, answers, confidence_scores"
            )
        
        result = await escalation_agent.process_batch_legacy(
            questions=questions,
            answers=answers,
            confidence_scores=confidence_scores,
            categories=categories
        )
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/v1/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "agent_initialized": escalation_agent is not None,
        "database_connected": db.database is not None
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "fastapi_endpoint_example:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
