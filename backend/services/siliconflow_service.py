
import os
import json
import aiohttp
import traceback
from typing import Dict, List, Optional, Any

class SiliconFlowService:
    """Service for integrating with SiliconFlow LLM API"""
    
    def __init__(self):
        self.api_key = os.getenv("SILICONFLOW_API_KEY", "")
        self.api_base = os.getenv("SILICONFLOW_API_BASE", "https://api.siliconflow.cn/v1/chat/completions")
        self.model_name = os.getenv("SILICONFLOW_MODEL_NAME", "Pro/deepseek-ai/DeepSeek-V3")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", 0.1))
    
    async def generate_text(self, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Generate text using the SiliconFlow API
        
        Args:
            prompt: The user prompt to send to the model
            system_message: Optional system message for the chat
            
        Returns:
            Generated text response from the model
        """
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
                print(f"[SILICONFLOW] API Request:")
                print(f"[SILICONFLOW] URL: {url}")
                print(f"[SILICONFLOW] Model: {self.model_name}")
                print(f"[SILICONFLOW] API Key configured: {bool(self.api_key)}")
                print(f"[SILICONFLOW] Request payload: {json.dumps(payload, indent=2, default=str)}")
                
                async with session.post(url, headers=headers, json=payload) as response:
                    response_text = await response.text()
                    print(f"[SILICONFLOW] Response status: {response.status}")
                    print(f"[SILICONFLOW] Response headers: {dict(response.headers)}")
                    
                    if response.status == 200:
                        data = json.loads(response_text)
                        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        print(f"[SILICONFLOW] Response successfully received:")
                        print(f"[SILICONFLOW] Content length: {len(content)}")
                        print(f"[SILICONFLOW] Content preview: {content[:100]}...")
                        
                        # Additional response details
                        model_used = data.get("model", "unknown")
                        usage = data.get("usage", {})
                        print(f"[SILICONFLOW] Model used: {model_used}")
                        print(f"[SILICONFLOW] Token usage: {usage}")
                        
                        return content
                    else:
                        print(f"[SILICONFLOW] API error ({response.status}): {response_text}")
                        raise Exception(f"SiliconFlow API error ({response.status}): {response_text}")
                        
        except Exception as e:
            print(f"[SILICONFLOW] Error using SiliconFlow API: {str(e)}")
            print(f"[SILICONFLOW] Exception traceback: {traceback.format_exc()}")
            raise
