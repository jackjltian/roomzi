
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'tenant' | 'landlord';
  phone?: string;
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  userRole: 'tenant' | 'landlord' | null;
  setUserRole: (role: 'tenant' | 'landlord') => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'tenant' | 'landlord' | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser, userRole, setUserRole }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
