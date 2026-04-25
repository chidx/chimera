import json
import os
from typing import TypedDict

import httpx
from dotenv import load_dotenv
from openai import OpenAI
from langgraph.graph import END, StateGraph

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://host.docker.internal:3001")

HTTPX_HEADERS = {"ngrok-skip-browser-warning": "true"}
HTTPX_TIMEOUT = 30

client = OpenAI(timeout=60)
MODEL = os.getenv("OPENAI_MODEL", "gpt-5-nano")


class AgentState(TypedDict):
    token_id: int
    agent_wallet: str
    capability_labels: list
    capability_descriptions: list
    mission_id: str
    mission_params: dict
    next_agent_token_id: int
    on_chain_data: dict
    analysis: str
    decision: dict
    message_to_next: dict
    tx_hash: str
    task_complete: bool


def resolve(state: AgentState) -> dict:
    resp = httpx.get(f"{BACKEND_URL}/api/agents/{state['token_id']}/identity", headers=HTTPX_HEADERS, timeout=HTTPX_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    return {
        "agent_wallet": data["agentWallet"],
        "capability_labels": data["capabilityLabels"],
        "capability_descriptions": data["capabilityDescriptions"],
    }


def sense(state: AgentState) -> dict:
    resp = httpx.get(f"{BACKEND_URL}/api/missions/{state['mission_id']}/context", headers=HTTPX_HEADERS, timeout=HTTPX_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    return {"on_chain_data": data}


def reason(state: AgentState) -> dict:
    labels = state["capability_labels"]
    descs = state["capability_descriptions"]

    capabilities_text = "\n".join(
        f"- {label}: {desc}" for label, desc in zip(labels, descs)
    )
    system_prompt = (
        "You are an autonomous on-chain agent with the following capabilities:\n"
        + capabilities_text
        + "\n\nAlways respond in valid JSON with: action_required (bool), action_type (str), "
        "action_payload (object), message_to_next_agent (object|null), reasoning (str)"
    )

    user_message = json.dumps(
        {
            "mission_params": state["mission_params"],
            "on_chain_data": state["on_chain_data"],
        }
    )

    response = client.chat.completions.create(
        model=MODEL,
        max_completion_tokens=1024,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )

    return {"analysis": response.choices[0].message.content}


def decide(state: AgentState) -> dict:
    try:
        decision = json.loads(state["analysis"])
    except json.JSONDecodeError:
        decision = {"action_required": False, "reasoning": "Parse error"}
    return {"decision": decision}


def act(state: AgentState) -> dict:
    decision = state["decision"]

    if not decision.get("action_required"):
        return {"task_complete": False}

    tx_hash = ""
    message_to_next = {}

    if decision.get("action_type") == "submit_tx":
        resp = httpx.post(
            f"{BACKEND_URL}/api/agents/{state['token_id']}/sign-and-send",
            headers=HTTPX_HEADERS,
            timeout=HTTPX_TIMEOUT,
            json={
                "agentWallet": state["agent_wallet"],
                "actionPayload": decision.get("action_payload", {}),
            },
        )
        resp.raise_for_status()
        tx_hash = resp.json().get("txHash", "")

    if decision.get("message_to_next_agent") and state.get("next_agent_token_id", 0) > 0:
        message_to_next = {
            "to_token_id": state["next_agent_token_id"],
            "payload": decision["message_to_next_agent"],
        }

    return {
        "tx_hash": tx_hash,
        "message_to_next": message_to_next,
        "task_complete": True,
    }


def route_after_act(state: AgentState) -> str:
    return END if state["task_complete"] else "sense"


workflow = StateGraph(AgentState)
workflow.add_node("resolve", resolve)
workflow.add_node("sense", sense)
workflow.add_node("reason", reason)
workflow.add_node("decide", decide)
workflow.add_node("act", act)

workflow.set_entry_point("resolve")
workflow.add_edge("resolve", "sense")
workflow.add_edge("sense", "reason")
workflow.add_edge("reason", "decide")
workflow.add_edge("decide", "act")
workflow.add_conditional_edges("act", route_after_act)

agent_runner = workflow.compile()


if __name__ == "__main__":
    with open("/tmp/job_input.json") as f:
        job_input = json.load(f)

    initial_state: AgentState = {
        "token_id": job_input["tokenId"],
        "mission_id": job_input["missionId"],
        "mission_params": job_input["missionParams"],
        "next_agent_token_id": job_input.get("nextAgentTokenId", 0),
        "agent_wallet": "",
        "capability_labels": [],
        "capability_descriptions": [],
        "on_chain_data": {},
        "analysis": "",
        "decision": {},
        "message_to_next": {},
        "tx_hash": "",
        "task_complete": False,
    }

    result = agent_runner.invoke(initial_state)

    job_output = {
        "decision": result["decision"],
        "txHash": result["tx_hash"],
        "messageToNext": result["message_to_next"],
        "success": result["task_complete"],
    }

    with open("/tmp/job_output.json", "w") as f:
        json.dump(job_output, f)
