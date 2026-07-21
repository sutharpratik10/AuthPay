export type ClientId = string;
export type SSEController = ReadableStreamDefaultController<any>;

export class SSEChannel {
  private clients: Map<ClientId, SSEController> = new Map();

  constructor(public readonly name: string) {}

  subscribe(clientId: ClientId, controller: SSEController) {
    this.clients.set(clientId, controller);
  }

  unsubscribe(clientId: ClientId) {
    this.clients.delete(clientId);
  }

  broadcast(data: object) {
    const serializedData = `data: ${JSON.stringify(data)}\n\n`;
    for (const [clientId, controller] of this.clients.entries()) {
      try {
        controller.enqueue(serializedData);
      } catch (error) {
        // Stream might be closed, unsubscribe automatically
        this.unsubscribe(clientId);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

class ChannelManager {
  private channels: Map<string, SSEChannel> = new Map();

  getChannel(name: string): SSEChannel {
    if (!this.channels.has(name)) {
      this.channels.set(name, new SSEChannel(name));
    }
    return this.channels.get(name)!;
  }
  
  deleteChannel(name: string) {
    this.channels.delete(name);
  }
}

export const sseManager = new ChannelManager();
