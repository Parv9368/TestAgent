"""
Bedrock AgentCore Agent — Strands Framework
"""
import os
from strands import Agent, tool
from bedrock_agentcore import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@tool
def get_current_time() -> str:
    """Get the current UTC time."""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()

@tool
def search_knowledge(query: str) -> str:
    """Search knowledge base."""
    return f"Knowledge results for: {query}"

@app.entrypoint
async def invoke(payload, context):
    """Main agent entrypoint."""
    model_id = os.environ.get("BEDROCK_MODEL_ID")
    
    agent = Agent(
        model=model_id,
        tools=[get_current_time, search_knowledge],
        system_prompt="You are a helpful AI assistant."
    )

    prompt = payload.get("prompt", "Hello")
    response = await agent.invoke_async(prompt)

    return {
        "response": str(response.message),
        "model": model_id,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
