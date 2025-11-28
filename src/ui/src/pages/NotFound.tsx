import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { FantasyButton } from "@/components/FantasyButton";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4 relative overflow-hidden fantasy-bg">
      {/* Fantasy Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      <div className="absolute inset-0 magical-shine"></div>
      
      {/* Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <FantasyButton
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="font-fantasy-body"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </FantasyButton>
      </div>
      
      <div className="text-center relative z-10">
        <h1 className="mb-4 text-6xl font-fantasy-title bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">404</h1>
        <p className="mb-6 text-xl text-foreground font-fantasy-body">Oops! Page not found</p>
        <FantasyButton onClick={() => navigate("/")} variant="default">
          <Home className="mr-2 h-4 w-4" />
          Home
        </FantasyButton>
      </div>
    </div>
  );
};

export default NotFound;
