"""
Dummy test data for development and testing.
"""

# Sample input JSON for testing the API
DUMMY_INPUT = {
    "request_id": "req-001-test",
    "context_documents": [
        {
            "doc_id": "doc-001",
            "title": "Data Encryption Policy",
            "content": """Our organization implements AES-256 encryption for all data at rest. 
            All databases are encrypted using industry-standard encryption protocols. 
            Encryption keys are rotated every 90 days and stored in a Hardware Security Module (HSM).
            Data in transit is protected using TLS 1.3 for all API communications.
            Customer data is encrypted both at the application layer and database layer.""",
            "source": "mongodb",
            "metadata": {"category": "security", "last_updated": "2025-01-01"}
        },
        {
            "doc_id": "doc-002", 
            "title": "Access Control Framework",
            "content": """We implement Role-Based Access Control (RBAC) across all systems.
            All user access requires multi-factor authentication (MFA).
            Privileged access is granted on a need-to-know basis and reviewed quarterly.
            Access logs are maintained for 12 months and monitored in real-time.
            Service accounts use short-lived tokens that expire after 1 hour.
            All access requests go through an approval workflow with manager sign-off.""",
            "source": "rag",
            "metadata": {"category": "access_control", "last_updated": "2025-01-05"}
        },
        {
            "doc_id": "doc-003",
            "title": "Incident Response Plan",
            "content": """Our incident response plan follows NIST guidelines.
            Security incidents are classified into P1 (critical), P2 (high), P3 (medium), P4 (low).
            P1 incidents require response within 15 minutes and executive notification within 1 hour.
            We conduct tabletop exercises quarterly and full DR tests annually.
            All incidents are documented in our SIEM system with full audit trails.
            Post-incident reviews are conducted within 5 business days of resolution.""",
            "source": "mongodb",
            "metadata": {"category": "incident_response", "last_updated": "2024-12-15"}
        },
        {
            "doc_id": "doc-004",
            "title": "Compliance Certifications",
            "content": """Our organization maintains the following certifications:
            - SOC 2 Type II (renewed annually, last audit: November 2025)
            - ISO 27001:2022 (certified since 2023)
            - GDPR compliant (EU data processing)
            - HIPAA compliant (healthcare data handling)
            - PCI DSS Level 1 (payment card processing)
            External audits are conducted by Big Four accounting firms.
            Penetration testing is performed bi-annually by certified ethical hackers.""",
            "source": "rag",
            "metadata": {"category": "compliance", "last_updated": "2025-01-03"}
        },
        {
            "doc_id": "doc-005",
            "title": "Data Retention and Backup Policy",
            "content": """Customer data is retained for the duration of the contract plus 30 days.
            Backups are performed daily with 30-day retention for standard backups.
            Critical system backups are retained for 1 year.
            Backup data is encrypted and stored in geographically separate data centers.
            Recovery Point Objective (RPO): 1 hour for critical systems.
            Recovery Time Objective (RTO): 4 hours for critical systems.
            Data deletion requests are processed within 30 days per GDPR requirements.""",
            "source": "mongodb",
            "metadata": {"category": "data_management", "last_updated": "2024-12-20"}
        }
    ],
    "questions": [
        {
            "question_id": "q-001",
            "question_text": "How is data encrypted at rest in your systems?",
            "category": "data_security"
        },
        {
            "question_id": "q-002",
            "question_text": "What access control mechanisms do you have in place?",
            "category": "access_control"
        },
        {
            "question_id": "q-003",
            "question_text": "How do you handle security incidents?",
            "category": "incident_response"
        },
        {
            "question_id": "q-004",
            "question_text": "What compliance certifications does your organization hold?",
            "category": "compliance"
        },
        {
            "question_id": "q-005",
            "question_text": "What is your data retention policy?",
            "category": "data_management"
        },
        {
            "question_id": "q-006",
            "question_text": "How do you protect data in transit?",
            "category": "data_security"
        },
        {
            "question_id": "q-007",
            "question_text": "What is your disaster recovery capability?",
            "category": "business_continuity"
        }
    ]
}


# Expected output structure (example)
EXPECTED_OUTPUT_STRUCTURE = {
    "request_id": "req-001-test",
    "total_questions": 7,
    "total_batches": 2,
    "batches": [
        {
            "batch_number": 1,
            "answers": [
                {
                    "question_id": "q-001",
                    "question_text": "How is data encrypted at rest in your systems?",
                    "answer": "Our organization implements AES-256 encryption for all data at rest. All databases are encrypted using industry-standard encryption protocols. Encryption keys are managed through a Hardware Security Module (HSM) and are rotated every 90 days. Additionally, customer data receives dual-layer protection through both application-level and database-level encryption.",
                    "confidence": "high",
                    "confidence_score": 0.92,
                    "citations": [
                        {
                            "doc_id": "doc-001",
                            "doc_title": "Data Encryption Policy",
                            "relevant_excerpt": "Our organization implements AES-256 encryption for all data at rest. All databases are encrypted using industry-standard encryption protocols.",
                            "relevance_score": 0.95
                        }
                    ],
                    "reasoning": "Direct policy documentation available with specific technical details about encryption standards and key management."
                }
                # ... more answers
            ]
        }
        # ... more batches
    ],
    "status": "completed"
}


def get_dummy_input() -> dict:
    """Return the dummy input data."""
    return DUMMY_INPUT


def get_minimal_test_input() -> dict:
    """Return a minimal test input with just 2 questions."""
    return {
        "request_id": "req-mini-test",
        "context_documents": DUMMY_INPUT["context_documents"][:2],
        "questions": DUMMY_INPUT["questions"][:2]
    }
