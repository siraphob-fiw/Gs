'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-textMuted mb-4">Something went wrong!</h2>
            <p className="text-textMuted mb-8">
              An error occurred while processing your request. Please try again later.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
