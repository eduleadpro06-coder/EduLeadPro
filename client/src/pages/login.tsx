import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
} from "lucide-react";
import PublicLayout from "@/components/layout/public-layout";

const LoginStyles = `
  @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');

  .login-container h1 {
    font-weight: bold;
    margin: 0;
    color: #000;
  }

  .login-container p {
    font-size: 14px;
    font-weight: 100;
    line-height: 20px;
    letter-spacing: 0.5px;
    margin: 20px 0 30px;
  }

  .login-container span {
    font-size: 12px;
    color: #333;
  }

  .login-container a {
    color: #333;
    font-size: 14px;
    text-decoration: none;
    margin: 15px 0;
  }

  .login-container button {
    border-radius: 20px;
    border: 1px solid #643ae5;
    background-color: #643ae5;
    color: #FFFFFF;
    font-size: 12px;
    font-weight: bold;
    padding: 12px 45px;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: transform 80ms ease-in;
    cursor: pointer;
  }

  .login-container button:active {
    transform: scale(0.95);
  }

  .login-container button:focus {
    outline: none;
  }

  .login-container button.ghost {
    background-color: transparent;
    border-color: #FFFFFF;
  }

  .login-container form {
    background-color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 0 50px;
    height: 100%;
    text-align: center;
  }

  .login-container input {
    background-color: #eee;
    border: none;
    padding: 12px 15px;
    margin: 8px 0;
    width: 100%;
  }

  .login-container .container {
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
    position: relative;
    overflow: hidden;
    width: 768px;
    max-width: 100%;
    min-height: 480px;
  }

  .login-container .form-container {
    position: absolute;
    top: 0;
    height: 100%;
    transition: all 0.6s ease-in-out;
  }

  .login-container .sign-in-container {
    left: 0;
    width: 50%;
    z-index: 2;
  }

  .login-container .container.right-panel-active .sign-in-container {
    transform: translateX(100%);
  }

  .login-container .sign-up-container {
    left: 0;
    width: 50%;
    opacity: 0;
    z-index: 1;
  }

  .login-container .container.right-panel-active .sign-up-container {
    transform: translateX(100%);
    opacity: 1;
    z-index: 5;
    animation: show 0.6s;
  }

  @keyframes show {
    0%, 49.99% {
      opacity: 0;
      z-index: 1;
    }
    50%, 100% {
      opacity: 1;
      z-index: 5;
    }
  }

  .login-container .overlay-container {
    position: absolute;
    top: 0;
    left: 50%;
    width: 50%;
    height: 100%;
    overflow: hidden;
    transition: transform 0.6s ease-in-out;
    z-index: 100;
  }

  .login-container .container.right-panel-active .overlay-container{
    transform: translateX(-100%);
  }

  .login-container .overlay {
    background: #643ae5;
    background: -webkit-linear-gradient(to right, #643ae5, #5528d7);
    background: linear-gradient(to right, #643ae5, #5528d7);
    background-repeat: no-repeat;
    background-size: cover;
    background-position: 0 0;
    color: #FFFFFF;
    position: relative;
    left: -100%;
    height: 100%;
    width: 200%;
    transform: translateX(0);
    transition: transform 0.6s ease-in-out;
  }

  .login-container .container.right-panel-active .overlay {
    transform: translateX(50%);
  }

  .login-container .overlay-panel {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 0 40px;
    text-align: center;
    top: 0;
    height: 100%;
    width: 50%;
    transform: translateX(0);
    transition: transform 0.6s ease-in-out;
  }

  .login-container .overlay-left {
    transform: translateX(-20%);
  }

  .login-container .container.right-panel-active .overlay-left {
    transform: translateX(0);
  }

  .login-container .overlay-right {
    right: 0;
    transform: translateX(0);
  }

  .login-container .container.right-panel-active .overlay-right {
    transform: translateX(20%);
  }

  .login-container .social-container {
    margin: 20px 0;
  }

  .login-container .social-container a {
    border: 1px solid #DDDDDD;
    border-radius: 50%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    margin: 0 5px;
    height: 40px;
    width: 40px;
    color: #333;
    background-color: #eee;
  }
`;

export default function Login() {
  const [isRightPanelActive, setRightPanelActive] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const style = document.createElement('style');
    style.innerHTML = LoginStyles;
    document.head.appendChild(style);
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);

    return () => {
      document.documentElement.classList.remove('dark');
      document.head.removeChild(style);
      document.head.removeChild(link);
    };
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      if (!response.ok) {
        throw new Error("Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.name}!`,
        });
        setLocation("/dashboard");
      } else {
        throw new Error(data.message || "Login failed");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; email: string }) => {
      const response = await apiRequest("POST", "/api/auth/signup", userData);
      console.log("Signup response:", response);  
      if (!response.ok) {
        throw new Error("Signup failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        toast({
          title: "Signup successful",
          description: `Welcome to EduLead Pro, ${data.user.name}!`,
        });
        setLocation("/dashboard");
      } else {
        throw new Error(data.message || "Signup failed");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };
  
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ username, password, email });
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 login-container">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main gradient circles */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
          
          {/* Additional gradient elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900/10 dark:to-blue-900/10 rounded-full blur-3xl opacity-30 animate-pulse-slower" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-indigo-200 to-blue-200 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-full blur-3xl opacity-20 animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-slate-200 to-gray-200 dark:from-slate-900/10 dark:to-gray-900/10 rounded-full blur-3xl opacity-20 animate-pulse-slow" />
          
          {/* Grid pattern with enhanced opacity */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Animated dots pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#80808008_1px,transparent_1px)] bg-[size:24px_24px] animate-dots" />
          
          {/* Floating icons with enhanced positioning and animations */}
          <div className="absolute top-1/4 left-1/4 animate-float-slow">
            <GraduationCap className="w-12 h-12 text-purple-500/20 dark:text-purple-400/20" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-float">
            <BookOpen className="w-10 h-10 text-blue-500/20 dark:text-blue-400/20" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-float-slow">
            <Users className="w-11 h-11 text-purple-500/20 dark:text-purple-400/20" />
          </div>
          <div className="absolute bottom-1/3 right-1/3 animate-float">
            <Brain className="w-9 h-9 text-indigo-500/20 dark:text-indigo-400/20" />
          </div>
          <div className="absolute top-1/2 left-1/4 animate-float-slow">
            <Sparkles className="w-8 h-8 text-blue-500/20 dark:text-blue-400/20" />
          </div>
          <div className="absolute top-1/4 right-1/3 animate-float">
            <Target className="w-10 h-10 text-gray-500/20 dark:text-gray-400/20" />
          </div>
          <div className="absolute bottom-1/2 right-1/4 animate-float-slow">
            <Lightbulb className="w-9 h-9 text-purple-500/20 dark:text-purple-400/20" />
          </div>
          <div className="absolute top-1/3 left-1/3 animate-float">
            <Rocket className="w-10 h-10 text-blue-500/20 dark:text-blue-400/20" />
          </div>
          <div className="absolute bottom-1/3 left-1/4 animate-float-slow">
            <Globe className="w-11 h-11 text-purple-500/20 dark:text-purple-400/20" />
          </div>
          <div className="absolute top-1/4 left-1/2 animate-float">
            <Zap className="w-9 h-9 text-indigo-500/20 dark:text-indigo-400/20" />
          </div>
        </div>

        <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
          <div className="form-container sign-up-container">
            <form onSubmit={handleSignupSubmit}>
              <h1>Create Account</h1>
              <div className="social-container">
                <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
                <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
              </div>
              <span>or use your email for registration</span>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" disabled={signupMutation.isPending}>
                {signupMutation.isPending ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          </div>
          <div className="form-container sign-in-container">
            <form onSubmit={handleLoginSubmit}>
              <h1>Sign in</h1>
              <div className="social-container">
                <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
                <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
              </div>
              <span>or use your account</span>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <a href="#">Forgot your password?</a>
              <button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>To keep connected with us please login with your personal info</p>
                <button className="ghost" id="signIn" onClick={() => setRightPanelActive(false)}>Sign In</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Hello</h1>
                <p>Enter your details and start journey with us</p>
                <button className="ghost" id="signUp" onClick={() => setRightPanelActive(true)}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}