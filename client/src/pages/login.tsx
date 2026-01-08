import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getAuthRedirectUrl } from "@/lib/auth-utils";
import {
    GraduationCap,
    BookOpen,
    Users,
    Brain,
    Sparkles,
    Target,
    Lightbulb,
    Rocket,
    Globe,
    Zap,
    ArrowLeft,
    Mail,
    Lock,
    User,
    Building2
} from "lucide-react";
import PublicLayout from "@/components/layout/public-layout";
import { OTPInput } from "@/components/OTPInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Login() {
    const [view, setView] = useState<"login" | "signup">("login");
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const { signIn, signUp, resendConfirmation, signInWithGoogle, sendOTP, verifyOTP } = useAuth();

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [organizationName, setOrganizationName] = useState("");

    // Loading States
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingSignup, setLoadingSignup] = useState(false);

    // Confirmation State
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState("");

    // OTP flow states
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");
    const [otpUserId, setOtpUserId] = useState<number | undefined>();
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState("");

    useEffect(() => {
        // Handle URL hash parameters for email confirmation errors
        if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const error = hashParams.get('error');
            const errorDescription = hashParams.get('error_description');

            if (error) {
                let userMessage = 'Authentication error occurred.';
                if (error === 'access_denied' && errorDescription?.includes('expired')) {
                    userMessage = 'Your email confirmation link has expired. Please request a new one below.';
                } else if (error === 'access_denied') {
                    userMessage = 'Email confirmation failed. The link may be invalid or already used.';
                }

                toast({
                    title: "Email Confirmation Error",
                    description: userMessage,
                    variant: "destructive"
                });

                // Clear the hash to prevent repeated error messages
                window.history.replaceState(null, '', window.location.pathname);
            }
        }

        // Listen for successful email confirmation
        const handleEmailConfirmed = (event: CustomEvent) => {
            toast({
                title: "✅ Email confirmed!",
                description: event.detail.message,
                duration: 5000,
            });
            setAwaitingConfirmation(false);
            setConfirmationEmail("");
            setView("login");
        };

        window.addEventListener('emailConfirmed', handleEmailConfirmed as EventListener);

        return () => {
            window.removeEventListener('emailConfirmed', handleEmailConfirmed as EventListener);
        };
    }, [toast]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingLogin(true);
        const res = await signIn(email, password);
        setLoadingLogin(false);

        if (res.error) {
            if (res.needsConfirmation) {
                toast({ title: "Email not confirmed", description: "Please confirm your email. You can resend the verification link below.", variant: "destructive" });
            } else {
                toast({ title: "Login failed", description: res.error, variant: "destructive" });
            }
        } else if (res.requiresOtp) {
            // Credentials validated, now send OTP
            setOtpEmail(res.email || email);
            setOtpUserId(res.userId);

            // Automatically send OTP
            const otpRes = await sendOTP(res.email || email, res.userId);
            if (otpRes.error) {
                toast({ title: "Failed to send OTP", description: otpRes.error, variant: "destructive" });
            } else {
                toast({
                    title: "OTP Sent",
                    description: `A 6-digit code has been sent to ${res.email || email}. Please check your email.`,
                    duration: 5000
                });
                setShowOtpInput(true);
            }
        } else {
            // Old flow - direct login (backward compatibility)
            toast({ title: "Login successful", description: `Welcome back!` });
            setAwaitingConfirmation(false);
            setConfirmationEmail("");
            setLocation("/dashboard");
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingSignup(true);
        const res = await signUp(email, password, fullName.trim() || undefined, organizationName.trim() || undefined);
        setLoadingSignup(false);

        if (res.error) {
            toast({ title: "Signup failed", description: res.error, variant: "destructive" });
        } else if (res.pendingConfirmation) {
            toast({
                title: "📧 Check your email!",
                description: `We've sent a confirmation link to ${email}. Please click the link to activate your account.`,
                duration: 8000,
            });
            setAwaitingConfirmation(true);
            setConfirmationEmail(email);
            setPassword("");
            setOrganizationName("");
            setView("login");
        } else {
            toast({ title: "Account created!", description: "Welcome! You can now sign in." });
            setAwaitingConfirmation(false);
            setPassword("");
            setOrganizationName("");
            setView("login");
        }
    };

    const handleOtpComplete = async (otp: string) => {
        setOtpLoading(true);
        setOtpError("");

        const res = await verifyOTP(otpEmail, otp, otpUserId);
        setOtpLoading(false);

        if (res.error) {
            setOtpError(res.error);
            toast({ title: "OTP Verification Failed", description: res.error, variant: "destructive" });
        } else {
            toast({ title: "Login successful", description: "Welcome back!" });
            setShowOtpInput(false);
            setOtpError("");
            setLocation("/dashboard");
        }
    };

    const handleResendOtp = async () => {
        setOtpError("");
        const res = await sendOTP(otpEmail, otpUserId);

        if (res.error) {
            toast({ title: "Failed to resend OTP", description: res.error, variant: "destructive" });
        } else {
            toast({
                title: "OTP Resent",
                description: `A new 6-digit code has been sent to ${otpEmail}`,
                duration: 5000
            });
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getAuthRedirectUrl('/auth/callback'),
                queryParams: { access_type: 'offline', prompt: 'consent' },
            },
        });
        if (error) {
            toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast({ title: "Enter email", description: "Please enter your email address first.", variant: "destructive" });
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getAuthRedirectUrl("/login"),
        });
        if (error) {
            toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        } else {
            toast({
                title: "📧 Password reset email sent!",
                description: `We've sent a password reset link to ${email}.`,
                duration: 8000,
            });
        }
    };

    const handleResendVerification = async () => {
        if (!email) {
            toast({ title: "Enter email", description: "Please enter your email above first.", variant: "destructive" });
            return;
        }
        const { error } = await resendConfirmation(email);
        if (error) {
            toast({ title: "Could not resend", description: error, variant: "destructive" });
        } else {
            toast({
                title: "📧 New verification email sent!",
                description: `We've sent a fresh confirmation link to ${email}.`,
                duration: 8000,
            });
            setAwaitingConfirmation(true);
            setConfirmationEmail(email);
        }
    };

    const handleBackToLogin = () => {
        setShowOtpInput(false);
        setOtpError("");
        setPassword("");
    };

    return (
        <PublicLayout>
            <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950">

                {/* Left Panel - Visuals (Hidden on mobile) */}
                <div className="hidden lg:flex relative overflow-hidden bg-slate-900 items-center justify-center p-12">
                    {/* Enhanced Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Main gradient circles */}
                        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-full blur-3xl animate-pulse-slow" />
                        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse-slow" />

                        {/* Animated dots grid */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

                        {/* Floating Icons */}
                        <div className="absolute top-1/4 left-1/4 animate-float-slow">
                            <GraduationCap className="w-16 h-16 text-purple-400/40" />
                        </div>
                        <div className="absolute top-1/3 right-1/4 animate-float">
                            <BookOpen className="w-14 h-14 text-blue-400/40" />
                        </div>
                        <div className="absolute bottom-1/4 left-1/3 animate-float-slow">
                            <Users className="w-12 h-12 text-purple-400/40" />
                        </div>
                        <div className="absolute bottom-1/3 right-1/3 animate-float">
                            <Brain className="w-12 h-12 text-indigo-400/40" />
                        </div>
                        <div className="absolute top-1/2 left-1/4 animate-float-slow">
                            <Sparkles className="w-10 h-10 text-blue-400/40" />
                        </div>
                        <div className="absolute top-1/4 right-1/3 animate-float">
                            <Target className="w-12 h-12 text-gray-400/40" />
                        </div>
                        <div className="absolute bottom-1/2 right-1/4 animate-float-slow">
                            <Lightbulb className="w-12 h-12 text-purple-400/40" />
                        </div>
                    </div>

                    <div className="relative z-10 text-center max-w-lg text-white space-y-6">
                        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Welcome to Education Connect
                        </h1>
                        <p className="text-lg text-slate-300">
                            The most advanced AI-powered management platform for educational institutions.
                        </p>
                    </div>
                </div>

                {/* Right Panel - Auth Form */}
                <div className="flex items-center justify-center p-6 lg:p-12 relative bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900">

                    {/* Mobile Background Elements (So it's not plain on mobile) */}
                    <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-3xl opacity-30" />
                        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-3xl opacity-30" />
                    </div>

                    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 dark:border-slate-800">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                                {view === "login" ? "Welcome Back" : "Create Account"}
                            </CardTitle>
                            <CardDescription>
                                {view === "login"
                                    ? "Enter your credentials to access your dashboard"
                                    : "Join us and transform your institution today"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={view} onValueChange={(v) => setView(v as "login" | "signup")} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-8">
                                    <TabsTrigger value="login">Sign In</TabsTrigger>
                                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                                </TabsList>

                                <TabsContent value="login">
                                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                                        {/* Social Login */}
                                        <div className="grid grid-cols-1 gap-3">
                                            <Button variant="outline" type="button" onClick={handleGoogleLogin} className="w-full relative h-10">
                                                <img
                                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                                    alt="Google"
                                                    className="w-5 h-5 absolute left-4"
                                                />
                                                <span>Continue with Google</span>
                                            </Button>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                            </div>
                                        </div>

                                        {/* Email Pending Alert */}
                                        {awaitingConfirmation && confirmationEmail && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                                <span className="text-lg">📧</span>
                                                <div>
                                                    <p className="font-medium">Email confirmation pending</p>
                                                    <p className="text-xs mt-1">Check {confirmationEmail} or click 'Resend' below.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    className="pl-10"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        if (awaitingConfirmation && e.target.value !== confirmationEmail) {
                                                            setAwaitingConfirmation(false);
                                                            setConfirmationEmail("");
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password">Password</Label>
                                                <button
                                                    type="button"
                                                    onClick={handleForgotPassword}
                                                    className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 hover:underline"
                                                >
                                                    Forgot password?
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    className="pl-10"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300" disabled={loadingLogin}>
                                            {loadingLogin ? (
                                                <>
                                                    <span className="animate-spin mr-2">⏳</span> Signing in...
                                                </>
                                            ) : "Sign In"}
                                        </Button>

                                        {/* Resend Confirmation Link */}
                                        <div className="text-center mt-2">
                                            <button
                                                type="button"
                                                className="text-xs text-muted-foreground hover:text-foreground underline"
                                                onClick={handleResendVerification}
                                            >
                                                Didn't receive confirmation email? Resend
                                            </button>
                                        </div>
                                    </form>
                                </TabsContent>

                                <TabsContent value="signup">
                                    <form onSubmit={handleSignupSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="fullName"
                                                    placeholder="John Doe"
                                                    className="pl-10"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="orgName">Organization Name</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="orgName"
                                                    placeholder="My School or Institute"
                                                    className="pl-10"
                                                    value={organizationName}
                                                    onChange={(e) => setOrganizationName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="signup-email"
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    className="pl-10"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="signup-password"
                                                    type="password"
                                                    placeholder="Create a password"
                                                    className="pl-10"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300" disabled={loadingSignup}>
                                            {loadingSignup ? "Creating account..." : "Create Account"}
                                        </Button>
                                    </form>
                                </TabsContent>

                            </Tabs>
                        </CardContent>
                        <CardFooter className="justify-center text-xs text-muted-foreground">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </CardFooter>
                    </Card>
                </div>

                {/* OTP Verification Modal */}
                {showOtpInput && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
                            <CardHeader className="space-y-1">
                                <button
                                    onClick={handleBackToLogin}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to login
                                </button>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    Verify it's you
                                </CardTitle>
                                <CardDescription>
                                    We've sent a 6-digit code to <span className="font-semibold text-primary">{otpEmail}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="flex justify-center">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <Mail className="w-8 h-8 text-primary" />
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <OTPInput
                                        length={6}
                                        onComplete={handleOtpComplete}
                                        onResend={handleResendOtp}
                                        loading={otpLoading}
                                        error={otpError}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center">
                                <p className="text-sm text-muted-foreground text-center">
                                    Check your spam folder if you don't see the code.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                )}

            </div>
        </PublicLayout>
    );
}
