import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sword, Shield, Scroll, UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { login: authLogin, register: authRegister } = useAuth();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    if (isRegister) {
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        await authRegister(username, email, password);
      } else {
        await authLogin(username, password);
      }
      navigate('/campaign');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4 relative overflow-hidden fantasy-bg">
      {/* Fantasy Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      
      {/* Magical Particles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent/30 rounded-full floating-particle"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/40 rounded-full floating-particle" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-accent/20 rounded-full floating-particle" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-primary/30 rounded-full floating-particle" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-accent/25 rounded-full floating-particle" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/6 left-1/2 w-1 h-1 bg-primary/35 rounded-full floating-particle" style={{animationDelay: '5s'}}></div>
        <div className="absolute bottom-1/6 right-1/6 w-1.5 h-1.5 bg-accent/15 rounded-full floating-particle" style={{animationDelay: '6s'}}></div>
      </div>
      
      {/* Magical Shine Effect */}
      <div className="absolute inset-0 magical-shine"></div>
      
      <Card className="w-full max-w-md p-8 space-y-6 invisible-boundary magical-glow relative z-10 backdrop-blur-sm bg-card/95">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-2">
            <Sword className="h-8 w-8 text-primary" />
            <Shield className="h-8 w-8 text-accent" />
            <Scroll className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent leading-tight text-no-clip">
            AgenticTableTop
          </h1>
          <p className="text-lg text-muted-foreground">
            Enter the Realm of Adventure
          </p>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={!isRegister ? "default" : "outline"}
            onClick={() => setIsRegister(false)}
            className="flex-1"
            disabled={loading}
          >
            Login
          </Button>
          <Button
            variant={isRegister ? "default" : "outline"}
            onClick={() => setIsRegister(true)}
            className="flex-1"
            disabled={loading}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username" className="text-card-foreground font-semibold">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground font-semibold">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-card-foreground font-semibold">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-card/50 border-border text-card-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || !username.trim() || !password.trim() || (isRegister && (!email.trim() || !confirmPassword.trim()))}
            className="w-full h-12 text-lg magical-glow hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isRegister ? 'Creating Account...' : 'Entering Realm...'}
              </>
            ) : (
              <>
                {isRegister ? (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Create Account
                  </>
                ) : (
                  <>
                    <Sword className="mr-2 h-5 w-5" />
                    Begin Adventure
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
