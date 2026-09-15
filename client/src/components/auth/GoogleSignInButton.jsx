import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export const isGoogleSignInEnabled = () => Boolean(clientId);

export default function GoogleSignInButton({ onCredential, disabled }) {
  if (!clientId) return null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500 dark:bg-slate-950">Or</span>
        </div>
      </div>
      <div className={disabled ? "pointer-events-none opacity-60" : ""}>
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              onCredential(response.credential);
            } else {
              toast.error("Google did not return a sign-in token");
            }
          }}
          onError={() => toast.error("Google sign-in was cancelled or failed")}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="100%"
        />
      </div>
    </div>
  );
}
