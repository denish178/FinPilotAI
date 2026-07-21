import { Plane } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-primary-700 to-primary-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2">
            <Plane size={24} />
          </div>
          <span className="text-xl font-bold">FinPilot AI</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Take control of your finances with AI-powered insights
          </h1>
          <p className="mt-4 max-w-md text-primary-100">
            Track expenses, manage budgets, achieve goals, and get personalized
            financial advice — all in one place.
          </p>
        </div>
        <p className="text-sm text-primary-200">© 2026 FinPilot AI</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-primary-600 p-2 text-white">
                <Plane size={20} />
              </div>
              <span className="text-xl font-bold">FinPilot AI</span>
            </div>
          </div>
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
