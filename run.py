#!/usr/bin/env python3
"""
Run the Security Questionnaire Answerer API.

Usage:
    python run.py
    python run.py --port 8080
    python run.py --reload
"""
import argparse
import uvicorn


def main():
    parser = argparse.ArgumentParser(description="Run the Security Questionnaire API")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args()
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║     Security Questionnaire Answerer - Multi-Agent System     ║
╠══════════════════════════════════════════════════════════════╣
║  Agents:                                                     ║
║    • Knowledge Agent (Engineer 1) - MongoDB + Vector Search  ║
║    • Citation Agent (Engineer 2) - RAG Context Citations     ║
║    • Drafting Agent (Engineer 2) - Answer Generation         ║
║    • Escalation Agent (Engineer 3) - Human Routing           ║
╠══════════════════════════════════════════════════════════════╣
║  API Endpoints:                                              ║
║    POST /process           - Process questionnaire           ║
║    POST /process/with-escalation - With full escalation      ║
║    POST /process/async     - Background processing           ║
║    GET  /health            - Health check                    ║
║    GET  /stats             - Knowledge base stats            ║
║    GET  /docs              - API documentation               ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "src.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()

