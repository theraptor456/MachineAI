import os
from typing import Optional

MOCK_MODE = os.getenv("ANTHROPIC_API_KEY") is None

SYSTEM_PROMPT = """You are the MachineAI CNC Assistant, an expert in CNC machining, G-Code generation,
tool selection, and manufacturing best practices. You help students and beginners understand CNC
concepts, generate G-Code from plain English descriptions, and recommend appropriate tools, materials,
feeds, and speeds. Explain concepts clearly and avoid unnecessary jargon unless the user demonstrates
familiarity with CNC terminology."""


def call_claude(message: str, conversation_history: Optional[list] = None) -> str:
    from anthropic import Anthropic

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    messages = conversation_history or []
    messages.append({"role": "user", "content": message})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages
    )
    return response.content[0].text


def call_gemini(message: str, conversation_history: Optional[list] = None) -> str:
    raise NotImplementedError("Gemini fallback not yet implemented")


def call_openai(message: str, conversation_history: Optional[list] = None) -> str:
    raise NotImplementedError("OpenAI fallback not yet implemented")


def get_mock_response(message: str) -> str:
    return (
        "[MOCK MODE — no API key configured] "
        "This is a placeholder response so you can test the assistant flow end-to-end. "
        f"Once ANTHROPIC_API_KEY is set in your .env file, this will be replaced with a real answer "
        f"to: \"{message}\""
    )


def get_ai_response(message: str, conversation_history: Optional[list] = None) -> dict:
    if MOCK_MODE:
        return {
            "response": get_mock_response(message),
            "provider": "mock",
            "success": True
        }

    providers = [
        ("claude", call_claude),
        ("gemini", call_gemini),
        ("openai", call_openai),
    ]

    last_error = None
    for provider_name, provider_fn in providers:
        try:
            result = provider_fn(message, conversation_history)
            return {
                "response": result,
                "provider": provider_name,
                "success": True
            }
        except Exception as e:
            last_error = str(e)
            continue

    return {
        "response": "All AI providers are currently unavailable. Please try again later.",
        "provider": None,
        "success": False,
        "error": last_error
    }
