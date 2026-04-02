import os
from openai import AsyncOpenAI
from system_prompt import get_system_prompt

# Point the OpenAI client directly to your local Mac's Ollama instance!
client = AsyncOpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama" # required but ignored by Ollama
)

async def generate_chat_response(messages: list[dict], cart_items: list[str]) -> str:
    # Prepend the system prompt containing the user's live cart context
    system_message = {"role": "system", "content": get_system_prompt(cart_items)}
    full_messages = [system_message] + messages
    
    try:
        response = await client.chat.completions.create(
            model="llama3.2",
            messages=full_messages,
            max_tokens=700
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error communicating with Local AI: {str(e)}. Please ensure Ollama is running on your Mac!"
