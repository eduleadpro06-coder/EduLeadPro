import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';

interface OTPInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    onResend: () => void;
    loading?: boolean;
    error?: string;
}

export function OTPInput({
    length = 6,
    onComplete,
    onResend,
    loading = false,
    error
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Auto-focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        // Countdown timer for resend
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are entered
        if (newOtp.every(digit => digit !== '') && !loading) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();

        // Only accept if it's all digits and matches expected length
        if (/^\d+$/.test(pastedData) && pastedData.length === length) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[length - 1]?.focus();

            if (!loading) {
                onComplete(pastedData);
            }
        }
    };

    const handleResend = () => {
        if (!canResend || loading) return;

        setOtp(new Array(length).fill(''));
        setResendTimer(60);
        setCanResend(false);
        inputRefs.current[0]?.focus();
        onResend();
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={loading}
                        className={`
              w-12 h-14 text-center text-2xl font-semibold
              border-2 rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error
                                ? 'border-red-500 bg-red-50'
                                : digit
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-300 bg-white'
                            }
            `}
                    />
                ))}
            </div>

            {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="flex flex-col items-center gap-2 text-sm">
                {!canResend ? (
                    <p className="text-gray-600">
                        Resend OTP in <span className="font-semibold text-purple-600">{resendTimer}s</span>
                    </p>
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleResend}
                        disabled={loading}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                        Resend OTP
                    </Button>
                )}
            </div>
        </div>
    );
}
