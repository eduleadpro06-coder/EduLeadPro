import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";

const PIN_STORAGE_KEY = "dashboard_pin";
const PIN_LENGTH = 4;

// Simple hash for PIN (not cryptographic, just obfuscation for localStorage)
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `pin_${Math.abs(hash).toString(36)}`;
}

interface DashboardPinGuardProps {
  children: React.ReactNode;
}

export default function DashboardPinGuard({ children }: DashboardPinGuardProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if PIN exists — if not, prompt to create one
  useEffect(() => {
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedPin) {
      setIsSettingPin(true);
    }
  }, []);

  // Focus first input on mount
  useEffect(() => {
    if (!isUnlocked) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isUnlocked, isSettingPin]);

  const handlePinChange = useCallback((index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return; // digits only

    const digit = value.slice(-1); // take last character
    const setter = isConfirm ? setConfirmPin : setPin;
    const refs = isConfirm ? confirmInputRefs : inputRefs;

    setter(prev => {
      const newPin = [...prev];
      newPin[index] = digit;
      return newPin;
    });

    // Auto-advance to next input
    if (digit && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent, isConfirm = false) => {
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const currentPin = isConfirm ? confirmPin : pin;

    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }, [pin, confirmPin]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Handle PIN verification
  const verifyPin = useCallback(() => {
    const enteredPin = pin.join("");
    if (enteredPin.length !== PIN_LENGTH) return;

    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (storedHash === hashPin(enteredPin)) {
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Incorrect PIN. Try again.");
      triggerShake();
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [pin]);

  // Handle PIN creation
  const handleSetPin = useCallback(() => {
    const newPin = pin.join("");
    if (newPin.length !== PIN_LENGTH) return;

    if (step === "enter") {
      setStep("confirm");
      setConfirmPin(["", "", "", ""]);
      setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
      return;
    }

    const confirmation = confirmPin.join("");
    if (newPin === confirmation) {
      localStorage.setItem(PIN_STORAGE_KEY, hashPin(newPin));
      setIsUnlocked(true);
      setIsSettingPin(false);
      setError("");
    } else {
      setError("PINs don't match. Try again.");
      triggerShake();
      setConfirmPin(["", "", "", ""]);
      setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
    }
  }, [pin, confirmPin, step]);

  // Auto-submit when all digits entered
  useEffect(() => {
    const enteredPin = pin.join("");
    if (enteredPin.length === PIN_LENGTH && !isSettingPin) {
      verifyPin();
    }
  }, [pin, isSettingPin, verifyPin]);

  useEffect(() => {
    const enteredConfirm = confirmPin.join("");
    if (enteredConfirm.length === PIN_LENGTH && step === "confirm") {
      handleSetPin();
    }
  }, [confirmPin, step, handleSetPin]);

  // Auto-advance to confirm step
  useEffect(() => {
    const enteredPin = pin.join("");
    if (enteredPin.length === PIN_LENGTH && isSettingPin && step === "enter") {
      handleSetPin();
    }
  }, [pin, isSettingPin, step, handleSetPin]);

  const renderPinInputs = (values: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>, isConfirm = false) => (
    <div className="flex gap-3 justify-center">
      {values.map((digit, index) => (
        <div key={index} className="relative">
          <Input
            ref={el => { refs.current[index] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handlePinChange(index, e.target.value, isConfirm)}
            onKeyDown={e => handleKeyDown(index, e, isConfirm)}
            className={`
              w-14 h-14 text-center text-2xl font-bold rounded-xl
              border-2 transition-all duration-200
              focus:border-[#643ae5] focus:ring-4 focus:ring-[#643ae5]/20
              ${digit ? "border-[#643ae5] bg-[#643ae5]/5" : "border-gray-200 bg-white"}
              ${shake ? "animate-shake" : ""}
            `}
          />
          {/* Dot indicator below */}
          <div className={`
            w-2 h-2 rounded-full mx-auto mt-2 transition-all duration-200
            ${digit ? "bg-[#643ae5] scale-100" : "bg-gray-200 scale-75"}
          `} />
        </div>
      ))}
    </div>
  );

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred dashboard content */}
      <div
        className="filter blur-lg pointer-events-none select-none opacity-60"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Inline PIN Overlay — only covers dashboard area, not sidebar */}
      <div className="absolute inset-0 flex items-start justify-center pt-24 z-10">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#643ae5] to-[#8b5cf6] flex items-center justify-center mb-4 shadow-lg shadow-[#643ae5]/30">
              {isSettingPin ? (
                <KeyRound className="h-8 w-8 text-white" />
              ) : (
                <Lock className="h-8 w-8 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {isSettingPin
                ? (step === "confirm" ? "Confirm Your PIN" : "Create Dashboard PIN")
                : "Enter Dashboard PIN"
              }
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isSettingPin
                ? (step === "confirm"
                  ? "Re-enter your 4-digit PIN to confirm"
                  : "Set a 4-digit PIN to protect your dashboard data")
                : "Enter your 4-digit PIN to view dashboard"
              }
            </p>
          </div>

          <div className="py-4">
            {/* PIN Input */}
            {isSettingPin && step === "confirm" ? (
              renderPinInputs(confirmPin, confirmInputRefs, true)
            ) : (
              renderPinInputs(pin, inputRefs)
            )}

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm text-center mt-4 font-medium">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <Button
              onClick={isSettingPin ? handleSetPin : verifyPin}
              className="w-full mt-6 h-12 bg-gradient-to-r from-[#643ae5] to-[#8b5cf6] hover:from-[#552dbf] hover:to-[#7c3aed] text-white font-semibold rounded-xl shadow-lg shadow-[#643ae5]/25 transition-all active:scale-[0.98]"
              disabled={
                isSettingPin
                  ? (step === "confirm" ? confirmPin.join("").length !== PIN_LENGTH : pin.join("").length !== PIN_LENGTH)
                  : pin.join("").length !== PIN_LENGTH
              }
            >
              <ShieldCheck className="h-5 w-5 mr-2" />
              {isSettingPin
                ? (step === "confirm" ? "Confirm & Set PIN" : "Next")
                : "Unlock Dashboard"
              }
            </Button>

          </div>
        </div>
      </div>

      {/* Shake animation CSS */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
