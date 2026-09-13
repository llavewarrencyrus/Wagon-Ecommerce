import { Dimensions, Platform } from "react-native";
import { create } from "zustand";
import { WidthProp } from "@/types/types";

/** Width of the simulated Android phone frame used in the web portfolio view. */
const SIMULATOR_WIDTH = 412;

const { width: windowWidth } = Dimensions.get("window");

const useWidth = create<WidthProp>((set) => ({
  width: 412,
  setWidth: (width: number) => set({ width }),
}));

export const useDeviceWidth = () => {
  const width = useWidth((state) => state.width);
  const setWidth = useWidth((state) => state.setWidth);

  setWidth(Platform.OS === "web" ? SIMULATOR_WIDTH : windowWidth);

  return { width, setWidth };
};
