# ems-backend/app/api/endpoints/actions.py

import asyncio
import os  # <-- MISSING IMPORT
import json  # <-- MISSING IMPORT
from datetime import datetime  # <-- MISSING IMPORT
from fastapi import APIRouter, Depends, HTTPException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic.json import pydantic_encoder  # <-- MISSING IMPORT

from app.models import pydantic_models as models
from app.data.mock_data import MOCK_ALERTS, MOCK_RL_SUGGESTIONS, MOCK_SITES, MOCK_MAINTENANCE_ASSETS
from app.api.deps import get_current_user
from typing import List 
from app.data.mock_data import LAST_SUGGESTION_ACTION

# --- Configure the Llama Model via Groq ---
try:
    from app.core.config import settings
    groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    if groq_api_key:
        llm = ChatOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_api_key,
            model="llama-3.1-8b-instant",
            temperature=0.7,
        )
        print("✅ Llama 3 model on Groq configured successfully.")
    else:
        print("⚠️ GROQ_API_KEY not found in environment")
        llm = None
except Exception as e:
    print(f"⚠️ Llama/Groq AI could not be configured: {e}")
    llm = None

router = APIRouter()

@router.post("/sites/{site_id}/alerts/{alert_id}/acknowledge", response_model=dict)
async def acknowledge_alert(site_id: str, alert_id: str, current_user: models.User = Depends(get_current_user)):
    await asyncio.sleep(0.5)
    if site_id in MOCK_ALERTS:
        for alert in MOCK_ALERTS[site_id]:
            if alert.id == alert_id:
                alert.status = 'acknowledged'
                return {"success": True}
    raise HTTPException(status_code=404, detail="Alert not found")

@router.post("/sites/{site_id}/suggestions/{suggestion_id}/accept", response_model=dict)
async def accept_suggestion(site_id: str, suggestion_id: str, current_user: models.User = Depends(get_current_user)):
    await asyncio.sleep(0.8)
    if site_id in MOCK_RL_SUGGESTIONS:
        for suggestion in MOCK_RL_SUGGESTIONS[site_id]:
            if suggestion.id == suggestion_id:
                suggestion.status = 'accepted'
                # SET THE COOLDOWN TIMESTAMP
                LAST_SUGGESTION_ACTION[site_id] = datetime.now()
                return {"success": True, "schedule": "Action scheduled for next control cycle."}
    raise HTTPException(status_code=404, detail="Suggestion not found")

@router.post("/sites/{site_id}/suggestions/{suggestion_id}/reject", response_model=dict)
async def reject_suggestion(site_id: str, suggestion_id: str, current_user: models.User = Depends(get_current_user)):
    await asyncio.sleep(0.8)
    if site_id in MOCK_RL_SUGGESTIONS:
        for suggestion in MOCK_RL_SUGGESTIONS[site_id]:
            if suggestion.id == suggestion_id:
                suggestion.status = 'rejected'
                # SET THE COOLDOWN TIMESTAMP
                LAST_SUGGESTION_ACTION[site_id] = datetime.now()
                return {"success": True}
    raise HTTPException(status_code=404, detail="Suggestion not found")

@router.post("/sites/{site_id}/maintenance/{asset_id}/schedule", response_model=dict)
async def schedule_maintenance(site_id: str, asset_id: str, current_user: models.User = Depends(get_current_user)):
    await asyncio.sleep(1.2)
    return {"success": True, "message": f"Maintenance for asset {asset_id} has been scheduled."}

@router.post("/sites/{site_id}/rl-strategy", response_model=dict)
async def update_rl_strategy(site_id: str, strategy: models.RLStrategy, current_user: models.User = Depends(get_current_user)):
    await asyncio.sleep(1)
    print(f"Site {site_id} RL strategy updated to: {strategy.dict()}")
    return {"success": True}

@router.post("/alerts/analyze-root-cause", response_model=str)
async def analyze_root_cause(alert: models.Alert, current_user: models.User = Depends(get_current_user)):
    # This remains a mock endpoint as requested
    await asyncio.sleep(2.5)
    response = "This is a mock analysis for the alert." # Simplified for brevity
    return response


@router.post("/actions/ask-ai", response_model=str)
async def ask_ai(query: models.AIQuery, current_user: models.User = Depends(get_current_user)):
    if not llm:
        raise HTTPException(status_code=503, detail="AI service is not configured or available.")

    await asyncio.sleep(0.5)

    system_context = {
        "sites": [site.dict() for site in MOCK_SITES],
        "assets": [asset.dict() for asset in MOCK_MAINTENANCE_ASSETS],
        "active_alerts": MOCK_ALERTS,
        "pending_suggestions": MOCK_RL_SUGGESTIONS,
        "current_time_ist": datetime.now().isoformat()
    }
    context_json = json.dumps(system_context, default=pydantic_encoder, indent=2)

    system_prompt = """
    You are an expert AI assistant for VidhyutAI's Energy Management System (EMS).
    Your task is to answer the user's question based ONLY on the real-time system data provided.
    Be concise, helpful, and answer in clear, simple language.

    **CRITICAL FORMATTING RULES:**
    - Always use standard markdown.
    - Use `**bold**` for emphasis.
    - For lists, use numbered lists for main items and bulleted lists (using '*') for sub-items. Each item MUST be on a new line.

    **--- EXAMPLE OF CORRECT FORMATTING ---**
    USER QUESTION: "list all my assets"

    YOUR CORRECT RESPONSE FORMAT:
    Here is the list of all assets:

    1.  **site_ahd_gj - Sabarmati Riverfront Solar**
        * `asset_ahd_inv01`: Inverter Unit SR-01
        * `asset_ahd_pv01`: Rooftop PV Array 3B

    2.  **site_srt_gj - Surat Industrial Power Hub**
        * `asset_srt_gt01`: Gas Turbine Primary
    **--- END OF EXAMPLE ---**
    """
    
    human_prompt = """
    --- SYSTEM DATA (JSON) ---
    {context}
    --- END OF SYSTEM DATA ---

    USER QUESTION: "{question}"
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", human_prompt),
    ])


    chain = prompt | llm

    try:
        response = await chain.ainvoke({
            "context": context_json,
            "question": query.question
        })
        return response.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred with the AI service: {e}")
    
    
@router.get("/sites/{site_id}/suggestions", response_model=List[models.RLSuggestion])
async def get_suggestions(site_id: str, current_user: models.User = Depends(get_current_user)):
    """
    Retrieves all pending RL suggestions for a given site.
    """
    await asyncio.sleep(0.5)
    return [s for s in MOCK_RL_SUGGESTIONS.get(site_id, []) if s.status == 'pending']