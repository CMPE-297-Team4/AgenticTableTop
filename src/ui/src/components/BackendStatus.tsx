import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const BackendStatus = () => {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkBackend = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${API_BASE_URL}/docs`, {
        signal: controller.signal,
        method: "HEAD",
      });

      clearTimeout(timeout);

      if (response.ok || response.status === 404) {
        // Even 404 means server is running
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch (error) {
      setStatus("disconnected");
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackend();
    // Check every 10 seconds
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  if (status === "connected") {
    return null; // Don't show anything when connected
  }

  return (
    <Alert 
      variant="destructive" 
      className="fixed bottom-4 right-4 w-96 z-50 border-2 border-destructive shadow-2xl"
    >
      <XCircle className="h-5 w-5" />
      <AlertTitle className="font-bold text-lg">Backend Server Not Running</AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">The backend server is not responding. Please:</p>
        <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
          <li>Open a terminal in the project directory</li>
          <li>Make sure you have API keys in <code className="bg-black/20 px-1 rounded">.env</code> file</li>
          <li>Run: <code className="bg-black/20 px-1 rounded">make start-backend</code></li>
          <li>Refresh this page</li>
        </ol>
        <p className="text-xs mt-2 text-muted-foreground">
          Last checked: {lastCheck.toLocaleTimeString()}
        </p>
        <button
          onClick={checkBackend}
          className="text-xs underline hover:no-underline mt-1"
        >
          Check again now
        </button>
      </AlertDescription>
    </Alert>
  );
};

export const BackendStatusInline = () => {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  const checkBackend = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_BASE_URL}/docs`, {
        signal: controller.signal,
        method: "HEAD",
      });

      clearTimeout(timeout);

      if (response.ok || response.status === 404) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch (error) {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 animate-pulse" />
        <span>Checking backend...</span>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <CheckCircle className="h-4 w-4" />
        <span>Backend online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <XCircle className="h-4 w-4" />
      <span>Backend offline</span>
    </div>
  );
};

