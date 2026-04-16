from openai import AsyncOpenAI
from dotenv import load_dotenv
from system_prompt import get_system_prompt

load_dotenv()

# Configure AI client from environment variables
client = AsyncOpenAI(
    base_url=os.getenv("AI_BASE_URL", "http://localhost:11434/v1"),
    api_key=os.getenv("AI_API_KEY", "ollama")
)

AI_MODEL = os.getenv("AI_MODEL", "llama3.2:1b")

async def generate_chat_response(messages: list[dict], cart_items: list[str], diet: str = "None", pantry_items: list[str] = None):
    # Prepend the system prompt containing the user's live cart context
    sys_content = get_system_prompt(cart_items)
    
    if pantry_items:
        sys_content += f"\n\nPANTRY CONTEXT: The user already has these items in their pantry at home: {', '.join(pantry_items)}. Try to suggest recipes that use these items to prevent food waste!"
        
    if diet and diet != "None":
        sys_content += f"\n\nCRITICAL CONSTRAINT: The user follows a strict {diet} diet. You MUST ONLY recommend {diet}-friendly recipes and foods. If their cart contains non-{diet} items, you MUST warn them!"
    
    system_message = {"role": "system", "content": sys_content}
    full_messages = [system_message] + messages
    
    try:
        response = await client.chat.completions.create(
            model=AI_MODEL,
            messages=full_messages,
            max_tokens=400,
            stream=True,
            extra_body={"keep_alive": "1h"}
        )
        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"Error communicating with Local AI: {str(e)}. Please ensure Ollama is running on your Mac!"

async def warmup_model():
    """Warms up the model by sending a tiny, non-streaming request."""
    try:
        await client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "system", "content": "ping"}],
            max_tokens=1,
            stream=False,
            extra_body={"keep_alive": "1h"}
        )
        return True
    except:
        return False
