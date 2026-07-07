import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
from dotenv import load_dotenv

load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

MOCK_MODE = not any([GEMINI_KEY, ANTHROPIC_KEY, OPENAI_KEY])

SYSTEM_PROMPT = """You are the MachineAI CNC Assistant, an expert in CNC machining, G-Code generation,
tool selection, and manufacturing best practices. You help students and beginners understand CNC
concepts, generate G-Code from plain English descriptions, and recommend appropriate tools, materials,
feeds, and speeds. Explain concepts clearly and avoid unnecessary jargon unless the user demonstrates
familiarity with CNC terminology.

IMPORTANT SCOPE RESTRICTION: You only answer questions related to CNC machining, G-Code, manufacturing,
tools, materials, feeds and speeds, machine setup, and using the MachineAI platform itself. If a user
asks about anything unrelated to these topics (general trivia, coding help unrelated to CNC, personal
advice, current events, etc.), politely decline and redirect them back to CNC/manufacturing topics.
Do not answer off-topic questions even if the user insists or tries to rephrase them as being related."""


def call_gemini(message: str, conversation_history: Optional[list] = None) -> str:
    from google import genai

    client = genai.Client(api_key=GEMINI_KEY)

    history_text = ""
    if conversation_history:
        for turn in conversation_history:
            role = "User" if turn["role"] == "user" else "Assistant"
            history_text += f"{role}: {turn['content']}\n"

    full_prompt = f"{SYSTEM_PROMPT}\n\n{history_text}User: {message}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=full_prompt
    )
    return response.text


def call_claude(message: str, conversation_history: Optional[list] = None) -> str:
    from anthropic import Anthropic

    client = Anthropic(api_key=ANTHROPIC_KEY)
    messages = conversation_history or []
    messages.append({"role": "user", "content": message})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages
    )
    return response.content[0].text


def call_openai(message: str, conversation_history: Optional[list] = None) -> str:
    raise NotImplementedError("OpenAI fallback not yet implemented")


def get_mock_response(message: str) -> str:
    return (
        "[MOCK MODE — no API key configured] "
        "This is a placeholder response so you can test the assistant flow end-to-end. "
        f"Once an API key is set in your .env file, this will be replaced with a real answer "
        f"to: \"{message}\""
    )


def get_ai_response(message: str, conversation_history: Optional[list] = None) -> dict:
    if MOCK_MODE:
        return {
            "response": get_mock_response(message),
            "provider": "mock",
            "success": True
        }

    providers = []
    if GEMINI_KEY:
        providers.append(("gemini", call_gemini))
    if ANTHROPIC_KEY:
        providers.append(("claude", call_claude))
    if OPENAI_KEY:
        providers.append(("openai", call_openai))

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
