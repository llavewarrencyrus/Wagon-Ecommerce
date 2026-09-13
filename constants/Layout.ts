/**
 * Layout constants — platform-aware.
 *
 * On web the app renders inside a 412dp Android simulator frame.
 * Using `Dimensions.get('window')` on web returns the browser viewport
 * width, which makes every width-relative component (cards, banners, etc.)
 * appear oversized inside the 412px phone frame.
 *
 * Import `SCREEN_WIDTH` (and `SCREEN_HEIGHT`) from here instead of using
 * `Dimensions.get('window')` directly.  All components will then size
 * correctly on both native and the web simulator.
 *
 * Usage:
 *   // Before
 *   import { Dimensions } from 'react-native';
 *   const { width } = Dimensions.get('window');
 *
 *   // After
 *   import { SCREEN_WIDTH as width } from '@/constants/Layout';
 */

import { Dimensions, Platform } from "react-native";

/** Width of the simulated Android phone frame used in the web portfolio view. */
const SIMULATOR_WIDTH = 412;
const SIMULATOR_HEIGHT = 915;

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

export const SCREEN_WIDTH: number = Platform.OS === "web" ? SIMULATOR_WIDTH : windowWidth;

export const SCREEN_HEIGHT: number = Platform.OS === "web" ? SIMULATOR_HEIGHT : windowHeight;
