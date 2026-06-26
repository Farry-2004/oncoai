import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.broadcast_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.broadcast_connections.add(websocket)
        logger.info(f"WebSocket connected: user {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        self.active_connections.get(user_id, set()).discard(websocket)
        self.broadcast_connections.discard(websocket)
        if user_id in self.active_connections and not self.active_connections[user_id]:
            del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected: user {user_id}")

    async def send_to_user(self, user_id: int, message: dict):
        for ws in list(self.active_connections.get(user_id, set())):
            try:
                await ws.send_json(message)
            except Exception:
                self.active_connections.get(user_id, set()).discard(ws)
                self.broadcast_connections.discard(ws)

    async def broadcast(self, message: dict, exclude_user: int = None):
        for ws in list(self.broadcast_connections):
            try:
                await ws.send_json(message)
            except Exception:
                self.broadcast_connections.discard(ws)

    @property
    def connection_count(self) -> int:
        return len(self.broadcast_connections)


manager = ConnectionManager()
