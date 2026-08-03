import json
import time
from typing import AsyncGenerator, Dict, List, Optional
import httpx
from loguru import logger

from app.core.config import settings


class GroqAIService:
    """
    Production-ready AI Service communicating directly with Groq API
    using model 'openai/gpt-oss-120b'.
    """

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    @classmethod
    def get_api_key(cls) -> str:
        api_key = settings.GROQ_API_KEY
        if not api_key:
            # Fallback check env var directly if needed
            import os
            api_key = os.environ.get("GROQ_API_KEY", "")
        return api_key.strip() if api_key else ""

    @classmethod
    def build_headers(cls) -> Dict[str, str]:
        api_key = cls.get_api_key()
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY is not configured in backend environment variables. "
                "Please add GROQ_API_KEY to backend/.env."
            )
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    @classmethod
    async def generate_completion(
        cls,
        messages: List[Dict[str, str]],
        model: str = "openai/gpt-oss-120b",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        system_prompt: Optional[str] = None,
    ) -> Dict:
        """
        Executes non-streaming completion request against Groq API.
        Returns dictionary containing assistant_message, token usage, and latency.
        """
        headers = cls.build_headers()
        
        # Prepare message payload
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        payload = {
            "model": model or "openai/gpt-oss-120b",
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        start_time = time.time()
        max_retries = 3
        backoff = 1.0

        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
            for attempt in range(max_retries):
                try:
                    logger.info(f"Sending non-stream request to Groq API (model: {payload['model']})")
                    response = await client.post(cls.GROQ_API_URL, headers=headers, json=payload)

                    if response.status_code == 200:
                        data = response.json()
                        latency_ms = int((time.time() - start_time) * 1000)
                        
                        assistant_content = ""
                        choices = data.get("choices", [])
                        if choices:
                            assistant_content = choices[0].get("message", {}).get("content", "")
                        
                        usage_raw = data.get("usage", {})
                        usage = {
                            "prompt_tokens": usage_raw.get("prompt_tokens", 0),
                            "completion_tokens": usage_raw.get("completion_tokens", 0),
                            "total_tokens": usage_raw.get("total_tokens", 0),
                        }

                        return {
                            "assistant_message": assistant_content,
                            "usage": usage,
                            "latency_ms": latency_ms,
                            "raw_response": data,
                        }

                    elif response.status_code == 429:
                        logger.warning(f"Groq Rate Limit hit (429), retrying in {backoff}s...")
                        if attempt == max_retries - 1:
                            raise HTTPException_Friendly("Rate limit exceeded. Please wait a moment and try again.", status_code=429)
                    elif response.status_code == 401:
                        raise HTTPException_Friendly("Invalid GROQ_API_KEY configuration.", status_code=401)
                    elif response.status_code == 400:
                        err_json = response.json()
                        err_msg = err_json.get("error", {}).get("message", "Invalid request parameters.")
                        raise HTTPException_Friendly(f"Groq API Error: {err_msg}", status_code=400)
                    else:
                        logger.error(f"Groq API returned status {response.status_code}: {response.text}")
                        if attempt == max_retries - 1:
                            raise HTTPException_Friendly(f"Groq service error (Status {response.status_code}).", status_code=502)

                except httpx.TimeoutException:
                    logger.warning(f"Timeout calling Groq API (Attempt {attempt+1}/{max_retries})")
                    if attempt == max_retries - 1:
                        raise HTTPException_Friendly("Groq API request timed out. Please try again.", status_code=504)
                except httpx.RequestError as exc:
                    logger.error(f"Network error calling Groq API: {exc}")
                    if attempt == max_retries - 1:
                        raise HTTPException_Friendly("Network error connecting to Groq AI service.", status_code=503)

                await asyncio_sleep(backoff)
                backoff *= 2.0

        raise HTTPException_Friendly("Failed to obtain completion from Groq API.", status_code=500)

    @classmethod
    async def stream_completion(
        cls,
        messages: List[Dict[str, str]],
        model: str = "openai/gpt-oss-120b",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[Dict, None]:
        """
        Executes streaming completion request against Groq API.
        Yields chunk dicts with content tokens or final usage data.
        """
        headers = cls.build_headers()

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        payload = {
            "model": model or "openai/gpt-oss-120b",
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            "stream_options": {"include_usage": True},
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(90.0, connect=10.0)) as client:
            try:
                async with client.stream("POST", cls.GROQ_API_URL, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Groq Stream Error HTTP {response.status_code}: {error_text.decode('utf-8')}")
                        if response.status_code == 401:
                            yield {"type": "error", "message": "Invalid GROQ_API_KEY configuration."}
                        elif response.status_code == 429:
                            yield {"type": "error", "message": "Rate limit exceeded. Please try again later."}
                        else:
                            yield {"type": "error", "message": f"Groq API error (status {response.status_code})."}
                        return

                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data:"):
                            continue

                        data_str = line[5:].strip()
                        if data_str == "[DONE]":
                            yield {"type": "done"}
                            break

                        try:
                            chunk_data = json.loads(data_str)
                            
                            # Check for text token delta
                            choices = chunk_data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content_chunk = delta.get("content", "")
                                if content_chunk:
                                    yield {"type": "content", "content": content_chunk}

                            # Check for usage data in stream_options chunk
                            if "usage" in chunk_data and chunk_data["usage"]:
                                usage_raw = chunk_data["usage"]
                                yield {
                                    "type": "usage",
                                    "usage": {
                                        "prompt_tokens": usage_raw.get("prompt_tokens", 0),
                                        "completion_tokens": usage_raw.get("completion_tokens", 0),
                                        "total_tokens": usage_raw.get("total_tokens", 0),
                                    },
                                }

                        except json.JSONDecodeError:
                            continue

            except httpx.TimeoutException:
                yield {"type": "error", "message": "Groq API stream request timed out."}
            except Exception as exc:
                logger.error(f"Stream error in GroqAIService: {exc}")
                yield {"type": "error", "message": f"Streaming error: {str(exc)}"}


class HTTPException_Friendly(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


import asyncio
async def asyncio_sleep(seconds: float):
    await asyncio.sleep(seconds)
