export type Unsubscribe = () => void;

export interface ChatEvent {
  username: string;
  message: string;
  timestamp: Date;
}

export interface GiftEvent {
  username: string;
  giftName: string;
  amount: number;
  value: number;
  timestamp: Date;
}

export interface PlatformAdapter {
  connect(): Promise<void>;
  listenChat(handler: (event: ChatEvent) => void): Unsubscribe;
  listenGift(handler: (event: GiftEvent) => void): Unsubscribe;
  disconnect(): Promise<void>;
}