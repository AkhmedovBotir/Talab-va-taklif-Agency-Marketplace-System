import { Platform } from 'react-native';

/** Barcha input placeholderlari — web da ochiq kulrang. */
export const INPUT_PLACEHOLDER_COLOR = Platform.select({
  web: '#9CA3AF',
  default: undefined,
});
