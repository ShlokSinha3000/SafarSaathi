
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sarvamai import SarvamAI

load_dotenv()

app = FastAPI(title="SafarSaathi API")

# Allow your local SafarSaathi frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranslationRequest(BaseModel):
    text: str
    source_language: str = "auto"
    target_language: str = "hi-IN"


@app.get("/")
def home():
    return {
        "message": "Welcome to SafarSaathi!",
        "status": "Backend is running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/translate")
def translate(request: TranslationRequest):
    api_key = os.getenv("SARVAM_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Sarvam API key is missing from backend/.env",
        )

    if not request.text.strip() or len(request.text) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Enter text containing 1–2000 characters.",
        )

    try:
        client = SarvamAI(api_subscription_key=api_key)

        result = client.text.translate(
            input=request.text,
            source_language_code=request.source_language,
            target_language_code=request.target_language,
        )

        return {"translated_text": result.translated_text}

    except Exception as e:
        print(f"Translation error: {e}")
        raise HTTPException(
            status_code=502,
            detail=(
                "Translation failed. Check the API key, supported "
                "languages, and Sarvam account access."
            ),
        )
