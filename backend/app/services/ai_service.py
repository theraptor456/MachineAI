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


def call_gemini(message: str, conversation_history: Optional[list] = None, context: str = "") -> str:
    from google import genai

    client = genai.Client(api_key=GEMINI_KEY)

    history_text = ""
    if conversation_history:
        for turn in conversation_history:
            role = "User" if turn["role"] == "user" else "Assistant"
            history_text += f"{role}: {turn['content']}\n"

    full_prompt = f"{SYSTEM_PROMPT}\n\n{context}{history_text}User: {message}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=full_prompt
    )
    return response.text


def call_claude(message: str, conversation_history: Optional[list] = None, context: str = "") -> str:
    from anthropic import Anthropic

    client = Anthropic(api_key=ANTHROPIC_KEY)
    messages = conversation_history or []
    messages.append({"role": "user", "content": message})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT + "\n\n" + context,
        messages=messages
    )
    return response.content[0].text


def call_openai(message: str, conversation_history: Optional[list] = None, context: str = "") -> str:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_KEY)
    messages = [{"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context}]
    if conversation_history:
        for turn in conversation_history:
            messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1024
    )
    return response.choices[0].message.content


def get_mock_response(message: str) -> str:
    return (
        "[MOCK MODE — no API key configured] "
        "This is a placeholder response so you can test the assistant flow end-to-end. "
        f"Once an API key is set in your .env file, this will be replaced with a real answer "
        f"to: \"{message}\""
    )


def get_ai_response(message: str, conversation_history: Optional[list] = None, material: Optional[str] = None, tool_name: Optional[str] = None) -> dict:
    context_parts = []
    if material:
        context_parts.append(f"The user's current project material is: {material}.")
    if tool_name:
        context_parts.append(f"The user's current tool is: {tool_name}.")
    context = " ".join(context_parts)
    if context:
        context += " Take this into account in your recommendations unless the user specifies otherwise.\n\n"

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
            result = provider_fn(message, conversation_history, context)
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


def identify_item_from_image(image_bytes: bytes, mime_type: str, item_type: str) -> dict:
    """
    Uses Gemini vision to identify a CNC tool or material from a photo and
    extract structured specs as JSON.
    item_type should be either "tool" or "material".
    """
    from google import genai
    from google.genai import types
    import json

    if not GEMINI_KEY:
        raise RuntimeError("No Gemini API key configured for image identification.")

    client = genai.Client(api_key=GEMINI_KEY)

    if item_type == "tool":
        prompt = """Identify the CNC cutting tool in this image. Respond with ONLY a JSON object,
no markdown formatting, no explanation, in exactly this shape:
{"name": "string, e.g. '10mm 2-Flute Carbide End Mill'", "material": "string, e.g. 'Carbide' or 'HSS'", "diameter": number or null (mm), "flutes": number or null, "max_rpm": number or null}
If you cannot confidently identify a field, use null for that field."""
    else:
        prompt = """Identify the material/stock in this image (e.g. aluminum bar stock, steel plate, etc).
Respond with ONLY a JSON object, no markdown formatting, no explanation, in exactly this shape:
{"name": "string, e.g. '6061 Aluminum'", "hardness": number or null, "tensile_strength": number or null, "recommended_feed_rate": number or null, "recommended_rpm": number or null}
If you cannot confidently identify a field, use null for that field."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt
        ]
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    return json.loads(text)
