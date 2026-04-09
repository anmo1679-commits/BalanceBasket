import os
from openai import AsyncOpenAI
from system_prompt import get_system_prompt

# Point the OpenAI client directly to your local Mac's Ollama instance!
client = AsyncOpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama" # required but ignored by Ollama
)

async def generate_chat_response(messages: list[dict], cart_items: list[str], diet: str = "None"):
    # Prepend the system prompt containing the user's live cart context
    sys_content = get_system_prompt(cart_items)
    if diet and diet != "None":
        sys_content += f"\n\nCRITICAL CONSTRAINT: The user follows a strict {diet} diet. You MUST ONLY recommend {diet}-friendly recipes and foods. If their cart contains non-{diet} items, you MUST warn them!"
    
    system_message = {"role": "system", "content": sys_content}
    full_messages = [system_message] + messages
    
    try:
        response = await client.chat.completions.create(
            model="llama3.2",
            messages=full_messages,
            max_tokens=700,
            stream=True
        )
        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"Error communicating with Local AI: {str(e)}. Please ensure Ollama is running on your Mac!"
