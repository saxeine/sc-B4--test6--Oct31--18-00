// UTF-8: ✓ Global error trapping & Firebase Auth safety for iframe environments
if (typeof window !== "undefined") {
  // Capture-phase error interceptor to prevent internal Firebase Auth assertion failures
  // from crashing the host iframe when popups are blocked or cancelled by user.
  window.addEventListener(
    "error",
    (event: ErrorEvent) => {
      const msg = event?.message || event?.error?.message || "";
      if (
        msg.includes("INTERNAL ASSERTION FAILED") ||
        msg.includes("Pending promise was never set") ||
        msg.includes("auth/cancelled-popup-request") ||
        msg.includes("auth/popup-blocked") ||
        msg.includes("popup-closed-by-user") ||
        msg.includes("WebSocket") ||
        msg.includes("createWebSocketModuleRunnerTransport") ||
        msg.includes("@vite/client") ||
        msg === "Script error."
      ) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const msg = reason?.message || String(reason || "");
      const code = reason?.code || "";
      if (
        msg.includes("INTERNAL ASSERTION FAILED") ||
        msg.includes("Pending promise was never set") ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        msg.includes("cancelled-popup-request") ||
        msg.includes("popup-blocked") ||
        msg.includes("WebSocket") ||
        msg.includes("createWebSocketModuleRunnerTransport") ||
        msg.includes("@vite/client")
      ) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  // Filter internal auth popup errors and WebSocket errors from breaking error monitoring
  const originalConsoleError = console.error;
  const safeStringifyArg = (arg: unknown): string => {
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}`;
    }
    if (typeof arg === "string") return arg;
    if (arg === null || arg === undefined) return "";
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  };
  console.error = function (...args: any[]) {
    const text = args.map(safeStringifyArg).join(" ");
    if (
      text.includes("auth/cancelled-popup-request") ||
      text.includes("auth/popup-blocked") ||
      text.includes("auth/popup-closed-by-user") ||
      text.includes("cancelled-popup-request") ||
      text.includes("popup-blocked") ||
      text.includes("popup-closed-by-user") ||
      text.includes("INTERNAL ASSERTION FAILED: Pending promise was never set") ||
      text.includes("Pending promise was never set") ||
      text.includes("@firebase/auth") ||
      text.includes("WebSocket") ||
      text.includes("createWebSocketModuleRunnerTransport") ||
      text.includes("@vite/client")
    ) {
      console.warn("Dev Notice:", ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

import { StrictMode, Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  ButtonCustomizationProvider,
  ensureButtonCustomizationDefaults,
} from "./context/ButtonCustomizationContext";
import { UIConfigProvider } from "./context/UIConfigProvider";
import { hydrateRemoteStore } from "./services/remoteKeyValueStore";
import { uiText } from "./hooks/useUIConfig";
import { SystemView } from "./components/system/SystemView";
import { StudioDeepLinkBridge } from "./components/system/StudioDeepLinkBridge";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React component error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-lg shadow-2xl space-y-4">
            <h1 className="text-xl font-bold text-rose-400">{uiText("main.h1.application_recovered", "Application Recovered")}</h1>
            <p className="text-sm text-slate-400">
              {uiText("main.p.an_unhandled_ui_error_occurred_you_can_reloa", "An unhandled UI error occurred. You can reload or reset the view:")}
            </p>
            <div className="bg-slate-950 p-3 rounded text-left font-mono text-xs text-rose-300 overflow-x-auto max-h-40 border border-slate-800/80">
              {this.state.error?.message ||
                uiText("main.div.script_or_rendering_error", "Script or rendering error")}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              {uiText("main.button.reload_application", "Reload Application")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/** `/system` is a first-class maintenance route; everything else is the studio. */
const isSystemRoute =
  typeof window !== "undefined" &&
  window.location.pathname.replace(/\/+$/, "") === "/system";

function renderApplication() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        {/* UIConfigProvider owns the database-backed copy & layout registry that
            the Button & Layout Optimizer Studio edits. It must sit above every
            consumer so a committed change re-renders the whole tree. */}
        <UIConfigProvider>
          <ButtonCustomizationProvider>
            {isSystemRoute ? (
              <SystemView />
            ) : (
              <>
                <StudioDeepLinkBridge />
                <App />
              </>
            )}
          </ButtonCustomizationProvider>
        </UIConfigProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

/**
 * Boot sequence
 * -------------
 * The configuration mirror is hydrated straight from the database *before* the
 * first paint, so a page reload renders database state rather than a browser
 * cache. `hydrateRemoteStore()` self-limits (6s) and resolves even when the
 * database is unreachable, in which case the registry fallbacks are rendered
 * and the studio shows an "offline" sync indicator.
 */
hydrateRemoteStore()
  .catch((err) => {
    console.warn("Configuration hydration issue — rendering with registry defaults:", err);
  })
  .finally(() => {
    try {
      ensureButtonCustomizationDefaults();
    } catch (e) {
      console.warn("Default initialization warning:", e);
    }
    renderApplication();
  });
