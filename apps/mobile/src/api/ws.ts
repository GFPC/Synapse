import { SynapseNode, NodeRelation } from '../types';

export type WSEventType =
  | 'node_created'
  | 'node_updated'
  | 'node_deleted'
  | 'node_locked'
  | 'node_unlocked'
  | 'relation_created'
  | 'relation_deleted'
  | 'comment_added';

export interface WSEvent {
  type: WSEventType;
  project_id?: string;
  data: any;
}

type EventHandler = (event: WSEvent) => void;

class SynapseWebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private projectId: string | null = null;
  private listeners: Set<EventHandler> = new Set();
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private isIntentionalClose = false;

  public connect(token: string, projectId: string) {
    this.token = token;
    this.projectId = projectId;
    this.isIntentionalClose = false;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.joinProject(projectId);
      return;
    }

    const wsUrl = `ws://87.58.204.138/ws?token=${encodeURIComponent(token)}${
      projectId ? `&project_id=${encodeURIComponent(projectId)}` : ''
    }`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.projectId) {
          this.joinProject(this.projectId);
        }
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.listeners.forEach((handler) => handler(payload));
        } catch {
          // Ignore invalid message
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.isIntentionalClose) {
          this.reconnectTimeout = setTimeout(() => {
            if (this.token && this.projectId) {
              this.connect(this.token, this.projectId);
            }
          }, 3000);
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      console.warn('WS connection error:', e);
    }
  }

  public joinProject(projectId: string) {
    this.projectId = projectId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'join_project',
          project_id: projectId,
        })
      );
    }
  }

  public subscribe(handler: EventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public disconnect() {
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const synapseWS = new SynapseWebSocketClient();
