import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import Button from "../components/ui/Button";
import { ROUTES } from "../constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-8xl font-bold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to={ROUTES.DASHBOARD} className="mt-8">
        <Button><Home size={16} /> Back to Dashboard</Button>
      </Link>
    </div>
  );
}
