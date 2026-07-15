import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onStop?: () => void;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  error: string | null;
}

// Browser-compatible SpeechRecognition constructor
function getRecognition(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition })
      .webkitSpeechRecognition ||
    null
  );
}

export function useSpeechRecognition(
  opts: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(
    null,
  );
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const isSupported = getRecognition() !== null;

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);

    try {
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        optsRef.current.onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const isFinal = result.isFinal;
          optsRef.current.onResult?.(transcript, isFinal);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const msg = event.error === "no-speech"
          ? "No speech detected. Try again."
          : event.error === "aborted"
            ? ""
            : `Speech error: ${event.error}`;
        if (msg) setError(msg);
        optsRef.current.onError?.(msg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        optsRef.current.onStop?.();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError("Could not start speech recognition.");
      console.error("Speech recognition error:", err);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isSupported, isListening, start, stop, error };
}
