from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AIQuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)

    @field_validator("question")
    @classmethod
    def strip_question(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question must not be blank.")
        return value


class AIGeneratedAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer: str = Field(min_length=1, max_length=2000)
    key_findings: list[str] = Field(max_length=8)
    recommendations: list[str] = Field(max_length=8)
    confidence: Literal["low", "medium", "high"]


class AIAnswerResponse(AIGeneratedAnswer):
    intent: Literal[
        "revenue_explanation",
        "top_products",
        "highest_revenue_region",
        "valuable_customers",
        "inventory_risk",
        "revenue_prediction",
    ]
