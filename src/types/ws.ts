export enum WsEvent {
  CREATE_DIRECT_MESSAGE = "create-direct-message",
  CREATE_GROUP_MESSAGE = "create-group-message",
  DELETE_DIRECT_MESSAGE = "delete-direct-message",
  DELETE_GROUP_MESSAGE = "delete-group-message",
  SEND_IMAGES = "send-images",

  REQUEST_CALL = "request-call",
  ACCEPT_REQUEST_CALL = "accept-request-call",
  CANCEL_CALL = "cancel-call",
  READY_CALL = "ready-call",

  NOTIFICATION_NEW_FRIEND_REQUEST = "notification-new-friend-request",
}

export interface WsResponse {
  status: "success" | "error"
  data?: unknown
  error?: string
}
