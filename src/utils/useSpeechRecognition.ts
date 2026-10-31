import { useState, useEffect, useRef, useCallback } from "react";

export interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const callbackRef = useRef(options.onResult);
  callbackRef.current = options.onResult;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = options.continuous ?? false;
        recognition.interimResults = options.interimResults ?? true;
        recognition.lang = options.lang || "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              final += item[0].transcript;
            } else {
              currentInterim += item[0].transcript;
            }
          }

          if (final) {
            setTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
            if (callbackRef.current) {
              callbackRef.current(final.trim());
            }
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error !== "no-speech") {
            setError(event.error || "Speech recognition error");
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
        };

        recognitionRef.current = recognition;
      } catch (err: any) {
        console.warn("Failed to initialize SpeechRecognition:", err);
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [options.continuous, options.interimResults, options.lang]);

  const startListening = useCallback(
    (customCallback?: (text: string) => void) => {
      if (!isSupported || !recognitionRef.current) {
        setError("Speech recognition is not supported in this browser.");
        return;
      }
      try {
        if (customCallback) {
          callbackRef.current = customCallback;
        }
        setError(null);
        setInterimTranscript("");
        recognitionRef.current.start();
      } catch (err: any) {
        // If already started, ignore or restart
        if (err.name === "InvalidStateError") {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
              } catch {}
            }, 100);
          } catch {}
        } else {
          setError(err.message || "Failed to start microphone.");
        }
      }
    },
    [isSupported]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimTranscript("");
  }, [isListening]);

  const toggleListening = useCallback(
    (customCallback?: (text: string) => void) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(customCallback);
      }
    },
    [isListening, startListening, stopListening]
  );

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript: () => setTranscript(""),
  };
}
