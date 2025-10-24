import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sword, Shield, Scroll } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate login process - accept any non-empty credentials for demo
    setTimeout(() => {
      setLoading(false);
      
      // For demo purposes, accept any username/password combination
      if (username.trim() && password.trim()) {
        // Store user session
        sessionStorage.setItem('user', username);
        sessionStorage.setItem('isAuthenticated', 'true');
        navigate('/campaign');
      } else {
        setError('Please enter both username and password');
      }
    }, 1000);
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

        {/* Login Form */}
        <div className="space-y-4">
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
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
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
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
              {error}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full h-12 text-lg magical-glow hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entering Realm...
              </>
            ) : (
              <>
                <Sword className="mr-2 h-5 w-5" />
                Begin Adventure
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Demo Mode: Enter any username and password to continue</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;