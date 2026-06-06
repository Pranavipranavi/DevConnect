import React from 'react';
import { RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container-shell grid min-h-[60vh] place-items-center py-12">
          <div className="surface max-w-lg p-6 text-center">
            <p className="text-sm font-bold uppercase text-primary">Something broke</p>
            <h1 className="mt-2 text-2xl font-black">This view could not render.</h1>
            <p className="mt-3 text-sm text-muted-light dark:text-muted-dark">{this.state.error.message}</p>
            <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" /> Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
