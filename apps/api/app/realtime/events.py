import json
import logging
from typing import List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("naviflow.realtime")

class RealtimeConnectionManager:
    """Manages active WebSocket connections to broadcast live traffic state changes."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Any):
        if not self.active_connections:
            return
        payload = json.dumps({"type": event_type, "data": data}, default=str)
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.add(connection)
        for dead in dead_connections:
            self.disconnect(dead)

ws_manager = RealtimeConnectionManager()
