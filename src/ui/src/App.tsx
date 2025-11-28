import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Login from "./pages/Login";
import GameLobby from "./pages/GameLobby";
import CampaignLibrary from "./pages/CampaignLibrary";
import CharacterCreate from "./pages/CharacterCreate";
import Characters from "./pages/Characters";
import Sessions from "./pages/Sessions";
import GameSession from "./pages/GameSession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GameLobby />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/lobby" 
              element={
                <ProtectedRoute>
                  <GameLobby />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaign" 
              element={<Navigate to="/" replace />}
            />
            <Route 
              path="/create-campaign" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/game" 
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library" 
              element={
                <ProtectedRoute>
                  <CampaignLibrary />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/character-create" 
              element={
                <ProtectedRoute>
                  <CharacterCreate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/characters" 
              element={
                <ProtectedRoute>
                  <Characters />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sessions" 
              element={
                <ProtectedRoute>
                  <Sessions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/game-session/:sessionId" 
              element={
                <ProtectedRoute>
                  <GameSession />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
