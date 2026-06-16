// 全局客户端连接存储（在所有 SSE 路由处理器之间共享）
// 使用 Node.js 全局对象确保在模块热重载时不会丢失

declare global {
  var broadcastConnectedClients: Map<string, any>;
  var broadcastUserConnections: Map<string, Set<string>>;
}

if (!global.broadcastConnectedClients) {
  global.broadcastConnectedClients = new Map();
}
if (!global.broadcastUserConnections) {
  global.broadcastUserConnections = new Map();
}

export const connectedClients = global.broadcastConnectedClients;
export const userConnections = global.broadcastUserConnections;

export function addClient(clientId: string, client: any) {
  connectedClients.set(clientId, client);
  
  const userId = client.userId;
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(clientId);
  
  
}

export function removeClient(clientId: string) {
  const client = connectedClients.get(clientId);
  if (client) {
    connectedClients.delete(clientId);
    const userClientIds = userConnections.get(client.userId);
    if (userClientIds) {
      userClientIds.delete(clientId);
      if (userClientIds.size === 0) {
        userConnections.delete(client.userId);
      }
    }
    
  }
}

export function getConnectedClientsCount(): number {
  return connectedClients.size;
}

export function getAllClients(): Map<string, any> {
  return connectedClients;
}
