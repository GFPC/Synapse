import { WS_BASE_URL, apiClient } from './client';

export type WsEventType =
  | 'node_created'
  | 'node_updated'
  | 'node_deleted'
  | 'relation_created'
  | 'comment_added'
  | 'node_locked'
  | 'node_unlocked'
  | 'user_online'
  | 'quick_drop_created'
  | 'quick_drop_deleted'
  | 'quick_drop_pinned'
  | 'idea_created'
  | 'idea_updated'
  | 'idea_deleted';

export interface WsEvent<T = any> {
  type: WsEventType;
  data: T;
}

type WsListener = (event: WsEvent) => void;

class SynapseWsClient {
  private ws: WebSocket | null = null;
  private currentProjectId: string | null = null;
  private listeners: Set<WsListener> = new Set();
  private reconnectTimeout: any = null;
  private isIntentionalClose = false;
  private pingInterval: any = null;

  public connect(projectId?: string) {
    if (projectId) this.currentProjectId = projectId;
    const token = apiClient.getAccessToken();

    if (!token) {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.currentProjectId) {
        this.send({ type: 'join_project', project_id: this.currentProjectId });
      }
      return;
    }

    this.isIntentionalClose = false;
    const url = `${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}${
      this.currentProjectId ? `&project_id=${encodeURIComponent(this.currentProjectId)}` : ''
    }`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        if (this.currentProjectId) {
          this.send({ type: 'join_project', project_id: this.currentProjectId });
        }

        // Keepalive ping
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping' });
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WsEvent;
          this.notifyListeners(parsed);
        } catch {
          // ignore non-json messages
        }
      };

      this.ws.onclose = () => {
        clearInterval(this.pingInterval);
        if (!this.isIntentionalClose) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch {
      // ignore connection error
    }
  }

  public joinProject(projectId: string) {
    this.currentProjectId = projectId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'join_project', project_id: projectId });
    } else {
      this.connect(projectId);
    }
  }

  public send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public subscribe(listener: WsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: WsEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('WS Listener Error:', err);
      }
    });
  }

  public disconnect() {
    this.isIntentionalClose = true;
    clearInterval(this.pingInterval);
    clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const synapseWs = new SynapseWsClient();
