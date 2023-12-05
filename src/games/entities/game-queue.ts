import { Socket } from 'socket.io';
export class Node<T> {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
  data: T;
  next: Node<T>;
}

export class Queue<T> {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  head: Node<T>;
  tail: Node<T>;
  size: number;

  enqueue(data: T): void {
    const newNode = new Node<T>(data);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }

    this.size++;
  }

  dequeue(): T {
    if (!this.head) {
      return (null);
    }

    const removeNode = this.head;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }

    this.size--;

    return (removeNode.data);
  }

  isEmpty() {
    return (this.size === 0);
  }

  find(func: (v) => boolean) {
    let temp = this.head;
    while (temp !== null) {
      if (func(temp.data))
        return (temp.data);
      temp = temp.next;
    }
    return (null);
  }

  remove(func: (v) => boolean): boolean {
    let temp = this.head;
    let prev = null;
    while (temp !== null) {
      if (func(temp.data)) {
        if (this.size === 1) {
          this.head = temp.next;
          this.tail = prev;
        }
        else if (temp === this.head) {
          this.head = temp.next;
        }
        else if (temp === this.tail) {
          this.tail = prev;
          prev.next = temp.next;
        }
        else {
          prev.next = temp.next;
        }
        this.size--;
        return (true);
      }
      prev = temp;
      temp = temp.next;
    }
    return (false);
  }
}

export class GameQueue {
  constructor(client: Socket, rating: number, time: number) {
    this.client = client;
    this.rating = rating;
    this.time = time;
    this.matched = false;
  }
  client: Socket;
  rating: number;
  time: number;
  matched: boolean;
}