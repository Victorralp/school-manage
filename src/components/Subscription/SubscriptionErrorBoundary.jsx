import ErrorBoundary from '../ErrorBoundary';
import Card from '../Card';
import Button from '../Button';

const SubscriptionErrorFallback = () => {
  return (
    <Card>
      <div className="text-center py-8">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Subscription Error
        </h3>
        
        <p className="text-gray-600 mb-6">
          We encountered an error loading your subscription information. Please try refreshing the page.
        </p>

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </Card>
  );
};

const SubscriptionErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary fallback={<SubscriptionErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
};

export default SubscriptionErrorBoundary;
