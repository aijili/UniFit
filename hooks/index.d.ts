declare module '../hooks/useAuth' {
  import { User } from 'firebase/auth';
  
  export const useAuth: () => {
    user: User | null;
    loading: boolean;
  };
}