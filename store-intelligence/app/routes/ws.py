"""WebSocket endpoint for live dashboard push updates."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..services.ws_manager import manager

router = APIRouter()


@router.websocket("/ws/live")
async def live(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        await ws.send_json({"channel": "system", "message": "connected"})
        while True:
            await ws.receive_text()  # keep-alive / client pings
    except WebSocketDisconnect:
        manager.disconnect(ws)
