import { EventEmitter } from 'events';

import type { ChatEvent, GiftEvent, PlatformAdapter, Unsubscribe } from '../adapter';

const CHAT_EVENT = 'chat';
const GIFT_EVENT = 'gift';

const demoUsers = ['alice', 'bob', 'charlie', 'diana'];
const chatMessages = [
  'Hello everyone!',
  'Thanks for joining the stream!',
  'Remember to follow the channel.',
  'What do you think about the new product?',
];
const gifts = [
  { name: 'Rose', value: 1 },
  { name: 'Diamond', value: 10 },
  { name: 'Legend', value: 50 },
];

const randomItem = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export class TikTokDummyAdapter implements PlatformAdapter {
  private readonly emitter = new EventEmitter();
  private chatInterval?: NodeJS.Timeout;
  private giftInterval?: NodeJS.Timeout;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.connected = true;
    this.startChatSimulation();
    this.startGiftSimulation();
  }

  listenChat(handler: (event: ChatEvent) => void): Unsubscribe {
    this.emitter.on(CHAT_EVENT, handler);
    return () => this.emitter.off(CHAT_EVENT, handler);
  }

  listenGift(handler: (event: GiftEvent) => void): Unsubscribe {
    this.emitter.on(GIFT_EVENT, handler);
    return () => this.emitter.off(GIFT_EVENT, handler);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.connected = false;
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = undefined;
    }
    if (this.giftInterval) {
      clearInterval(this.giftInterval);
      this.giftInterval = undefined;
    }
    this.emitter.removeAllListeners();
  }

  private startChatSimulation(): void {
    this.chatInterval = setInterval(() => {
      const event: ChatEvent = {
        username: randomItem(demoUsers),
        message: randomItem(chatMessages),
        timestamp: new Date(),
      };
      this.emitter.emit(CHAT_EVENT, event);
    }, 3_000);
  }

  private startGiftSimulation(): void {
    this.giftInterval = setInterval(() => {
      const gift = randomItem(gifts);
      const event: GiftEvent = {
        username: randomItem(demoUsers),
        giftName: gift.name,
        amount: Math.ceil(Math.random() * 5),
        value: gift.value,
        timestamp: new Date(),
      };
      this.emitter.emit(GIFT_EVENT, event);
    }, 5_000);
  }
}

export const createTikTokDummyAdapter = (): TikTokDummyAdapter => new TikTokDummyAdapter();