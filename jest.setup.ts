import '@testing-library/jest-native/extend-expect';

// react-native-safe-area-context requires a native module that is unavailable in Jest.
// The official mock stubs SafeAreaProvider and returns {top:0,...} from useSafeAreaInsets.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
