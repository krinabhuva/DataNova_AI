from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.ai import AIAnswerResponse, AIQuestionRequest
from app.services.ai import (
    GeminiConfigurationError,
    GeminiUpstreamError,
    UnsupportedQuestionError,
    answer_business_question,
)

router = APIRouter(tags=["ai"])


@router.post("/ai/ask", response_model=AIAnswerResponse, summary="Answer a supported business question")
def ask_ai(question: AIQuestionRequest, db: Session = Depends(get_db)) -> AIAnswerResponse:
    try:
        intent, answer = answer_business_question(db, question.question)
    except UnsupportedQuestionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except GeminiConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GeminiUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    db.commit()
    return AIAnswerResponse(intent=intent, **answer.model_dump())
