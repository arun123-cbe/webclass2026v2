import React, { useEffect, useRef, useState } from "react";

interface JitsiEmbedProps {
  roomUrl: string;
  displayName?: string;
}

export default function JitsiEmbed({ roomUrl, displayName }: JitsiEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let api: any = null;
    const scriptId = "jitsi-external-api-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initJitsi = () => {
      if (!containerRef.current) return;
      try {
        setLoading(true);
        // Clear previous instances
        containerRef.current.innerHTML = "";

        let domain = "meet.jit.si";
        let roomName = "csdg-digital-growth-cohort";

        if (roomUrl) {
          try {
            // If it is a full URL
            if (roomUrl.startsWith("http")) {
              const urlObj = new URL(roomUrl);
              domain = urlObj.host;
              roomName = urlObj.pathname.substring(1);
            } else {
              // Just a room name
              roomName = roomUrl;
            }
          } catch (e) {
            console.error("Invalid Jitsi URL format, fallback to default", e);
          }
        }

        // Clean room name from any unwanted trailing slashes or hash params
        roomName = roomName.split("#")[0].split("?")[0];

        const options = {
          roomName: roomName || "csdg-digital-growth-cohort",
          width: "100%",
          height: "100%",
          parentNode: containerRef.current,
          userInfo: {
            displayName: displayName || "Student"
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            MOBILE_APP_PROMO: false
          }
        };

        // @ts-ignore
        if (window.JitsiMeetExternalAPI) {
          // @ts-ignore
          api = new window.JitsiMeetExternalAPI(domain, options);
          
          api.addEventListener("videoConferenceJoined", () => {
            setLoading(false);
          });
          
          // Timeout fallback to hide loader in 4s
          setTimeout(() => setLoading(false), 4000);
        } else {
          setError("Jitsi Meet library is not initialized on the page.");
        }
      } catch (err: any) {
        console.error("Error setting up Jitsi Meet:", err);
        setError(err.message || "Failed to initialize interactive video room.");
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => {
        initJitsi();
      };
      script.onerror = () => {
        setError("Unable to load meeting stream script from meet.jit.si. Please check your internet connection.");
      };
      document.body.appendChild(script);
    } else {
      // @ts-ignore
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
      } else {
        script.onload = () => {
          initJitsi();
        };
      }
    }

    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [roomUrl, displayName]);

  return (
    <div className="relative w-full h-full flex flex-col items-stretch min-h-[400px]">
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-10 gap-3 rounded-2xl">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold font-mono text-indigo-300 uppercase tracking-widest">Launching Secure Live Stream...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center z-10 gap-4 rounded-2xl border border-rose-950">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-sm text-white">Stream Loading Error</h5>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">{error}</p>
          </div>
          <a
            href={roomUrl.startsWith("http") ? roomUrl : `https://meet.jit.si/${roomUrl}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            Open Stream in New Tab
          </a>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full flex-1 rounded-2xl overflow-hidden bg-slate-950" />
    </div>
  );
}
