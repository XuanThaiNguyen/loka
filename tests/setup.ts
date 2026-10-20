jest.mock('react-native-reanimated', () => ({ __esModule: true, default: { View: jest.requireActual('react-native').View }, FadeInLeft: { duration: () => undefined }, FadeInRight: { duration: () => undefined } }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('@expo/ui/community/datetime-picker', () => ({ DateTimePicker: 'DateTimePicker' }));
