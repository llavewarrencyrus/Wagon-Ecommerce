// NetworkContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkContextProps {
  isConnected: boolean | null;
  refreshNetworkStatus: () => void;
}

const NetworkContext = createContext<NetworkContextProps>({
  isConnected: null,
  refreshNetworkStatus: () => {},
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  const refreshNetworkStatus = () => {
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, refreshNetworkStatus }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
