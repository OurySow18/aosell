import { Component, type ReactNode } from 'react';

type MapErrorBoundaryProps = {
  children: ReactNode;
};

type MapErrorBoundaryState = {
  hasError: boolean;
};

// react-native-maps needs a native module compiled into the dev client binary.
// After adding the dependency, existing installs crash on render until the
// client is rebuilt (EAS build / expo run). This boundary swallows that crash
// so the rest of the screen (the real order status) keeps working in the
// meantime, instead of taking down the whole app.
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
