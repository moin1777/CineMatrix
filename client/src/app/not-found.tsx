import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary btn-md gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link href="/movies" className="btn-secondary btn-md gap-2">
            <Search className="w-4 h-4" />
            Browse Movies
          </Link>
        </div>
      </div>
    </div>
  );
}
