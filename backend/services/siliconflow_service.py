
import os
import json
import aiohttp
import traceback
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

class SiliconFlowService:
    """Service for integrating with SiliconFlow LLM API"""
    
    def __init__(self):
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        self.api_base = os.getenv("SILICONFLOW_API_BASE", "https://api.siliconflow.cn/v1/chat/completions")
        self.model_name = os.getenv("SILICONFLOW_MODEL_NAME", "Pro/deepseek-ai/DeepSeek-V3")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", 0.1))
        
        # Check if debug mode is enabled from .env first
        self.debug_mode = os.getenv("DEBUG", "False").lower() == "true"
    
    def log_debug(self, message: str, data=None):
        """Log debug messages only if in debug mode"""
        if self.debug_mode:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if data:
                if isinstance(data, dict) or isinstance(data, list):
                    try:
                        # Pretty print JSON with indentation
                        pretty_data = json.dumps(data, indent=2, default=str)
                        print(f"[SILICONFLOW_DEBUG {timestamp}] {message}:\n{pretty_data}")
                    except:
                        print(f"[SILICONFLOW_DEBUG {timestamp}] {message}: {data}")
                else:
                    print(f"[SILICONFLOW_DEBUG {timestamp}] {message}: {data}")
            else:
                print(f"[SILICONFLOW_DEBUG {timestamp}] {message}")
    
    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Generate text using the SiliconFlow API
        
        Args:
            prompt: The user prompt to send to the model
            system_message: Optional system message for the chat
            
        Returns:
            Generated text response from the model
        """
        start_time = time.time()
        self.log_debug(f"Starting API request with prompt length: {len(prompt)}")
        
        if not self.api_key:
            print("[SILICONFLOW] Error: API key is not configured")
            raise ValueError("SiliconFlow API key is not configured")
            
        try:
            # Use the API base directly since it already includes the endpoint path
            url = self.api_base
            
            # Check if we need to append the path if using the domain only
            if not url.endswith("/completions") and not url.endswith("/chat/completions"):
                url = f"{url}/chat/completions"
            
            messages = []
            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })
                
            messages.append({
                "role": "user",
                "content": prompt
            })
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": self.model_name,
                    "messages": messages,
                    "temperature": self.temperature,
                }
                
                # Debug info
                print(f"[SILICONFLOW] API Request to model: {self.model_name}")
                if self.debug_mode:
                    masked_api_key = f"{self.api_key[:5]}...{self.api_key[-4:]}" if len(self.api_key) > 10 else "****"
                    self.log_debug("Full request URL", url)
                    self.log_debug("API Key configured", bool(self.api_key))
                    self.log_debug("Authorization header", f"Bearer {masked_api_key}")
                    self.log_debug("Request payload", {
                        "model": payload["model"],
                        "temperature": payload["temperature"],
                        "messages_count": len(payload["messages"]),
                    })
                    self.log_debug("Request messages", messages)
                
                self.log_debug("Starting request to SiliconFlow API", {"url": url})
                request_start = time.time()
                
                async with session.post(url, headers=headers, json=payload) as response:
                    request_duration = time.time() - request_start
                    self.log_debug(f"Request completed in {request_duration:.2f}s")
                    
                    response_text = await response.text()
                    print(f"[SILICONFLOW] Response status: {response.status}")
                    
                    if self.debug_mode:
                        self.log_debug("Response headers", dict(response.headers))
                        if len(response_text) > 5000:
                            self.log_debug("Full response text (truncated)", response_text[:5000] + "...")
                        else:
                            self.log_debug("Full response text", response_text)
                    
                    if response.status == 200:
                        data = json.loads(response_text)
                        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        print(f"[SILICONFLOW] Response successfully received")
                        
                        if self.debug_mode:
                            self.log_debug("Content length", len(content))
                            self.log_debug("Content preview", content[:300] + ("..." if len(content) > 300 else ""))
                            self.log_debug("Model used", data.get("model", "unknown"))
                            self.log_debug("Token usage", data.get("usage", {}))
                        
                        total_duration = time.time() - start_time
                        self.log_debug(f"Total API call completed in {total_duration:.2f}s")
                        return content
                    else:
                        error_msg = f"SiliconFlow API error ({response.status}): {response_text}"
                        print(f"[SILICONFLOW] {error_msg}")
                        if self.debug_mode:
                            self.log_debug("Error details", {
                                "status_code": response.status,
                                "response_text": response_text,
                                "headers": dict(response.headers)
                            })
                        raise Exception(error_msg)
                        
        except Exception as e:
            error_msg = f"Error using SiliconFlow API: {str(e)}"
            print(f"[SILICONFLOW] {error_msg}")
            if self.debug_mode:
                self.log_debug("Exception details", {
                    "error_type": type(e).__name__,
                    "error_message": str(e)
                })
                self.log_debug("Exception traceback", traceback.format_exc())
            raise
