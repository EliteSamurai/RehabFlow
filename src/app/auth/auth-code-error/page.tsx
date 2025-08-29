import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There was an error confirming your email address.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600">This could happen if:</p>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>The confirmation link has expired</li>
                <li>The link has already been used</li>
                <li>There was a network error</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/signup">Try Signing Up Again</Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact support at{" "}
                <a
                  href="mailto:support@rehabflow.com"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  support@rehabflow.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
