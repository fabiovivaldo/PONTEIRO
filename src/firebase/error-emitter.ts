
import { FirestorePermissionError } from './errors';

type ErrorCallback = (error: FirestorePermissionError) => void;

class ErrorEmitter {
  private listeners: { [event: string]: ErrorCallback[] } = {};

  on(event: 'permission-error', callback: ErrorCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: 'permission-error', callback: ErrorCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== callback);
  }

  emit(event: 'permission-error', error: FirestorePermissionError) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(error));
  }
}

export const errorEmitter = new ErrorEmitter();
