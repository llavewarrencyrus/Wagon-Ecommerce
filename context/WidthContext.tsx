import React, { createContext, useContext, useState } from "react";
import { WidthProp } from "@/types/types";

const WidthContext = createContext<WidthProp>({
  width: 412,
  setWidth: () => {},
});

export const WidthProvider = ({ children }: { children: React.ReactNode }) => {
  const [width, setWidth] = useState(412);

  return <WidthContext.Provider value={{ width, setWidth }}>{children}</WidthContext.Provider>;
};

export const useWidth = () => useContext(WidthContext).width;
export const useSetWidth = () => useContext(WidthContext).setWidth;
