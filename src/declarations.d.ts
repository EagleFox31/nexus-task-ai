declare module 'lucide-react';
declare module 'firebase/compat/app' {
  export interface User {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  }
  export namespace firestore {
    type Timestamp = any;
    interface DocumentReference<T = any> {}
    interface DocumentData {}
    type WriteBatch = any;
  }
  const firebase: any;
  export default firebase;
}
declare module 'firebase/compat/auth';
declare module 'firebase/compat/firestore';

declare namespace firebase {
  interface User {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  }
  namespace firestore {
    type Timestamp = any;
    interface DocumentReference<T = any> {}
    interface DocumentData {}
    type WriteBatch = any;
  }
}
