import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { AddressProps } from '@/types/types';

interface AddressContextProps {
  addresses: AddressProps[];
  setAddresses: React.Dispatch<React.SetStateAction<AddressProps[]>>;
}

const AddressContext = createContext<AddressContextProps | undefined>(undefined);

export const AddressProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [addresses, setAddresses] = useState<AddressProps[]>([]);

  return (
    <AddressContext.Provider value={{ addresses, setAddresses }}>
      {children}
    </AddressContext.Provider>
  );
};

// Custom hook to use address context
export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};
