export interface Notification {
    id: string;
    type: 'borrow_request' | 'return_reminder';
    senderName: string;
    itemName: string;
    senderAvatarUrl?: string;
    timestamp: Date;
    status: 'pending' | 'accepted' | 'declined';
    recipientId: string;
  }
  
  export interface FirebaseError extends Error {
    code: string;
  }