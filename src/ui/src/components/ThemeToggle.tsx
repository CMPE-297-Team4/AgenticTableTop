/**
 * Theme Toggle Component
 * 
 * Allows users to switch between dark and light fantasy themes
 */

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("fantasy-theme") as "dark" | "light" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    // Ensure dark class is applied by default if no theme is set
    if (!savedTheme && !document.documentElement.classList.contains("light") && !document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.add("dark");
    }
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: "dark" | "light") => {
    const root = document.documentElement;
    
    if (newTheme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    
    localStorage.setItem("fantasy-theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
    
    toast({
      title: "Theme Changed",
      description: `Switched to ${newTheme === "dark" ? "Dark" : "Light"} fantasy theme`,
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative hover:bg-accent/20 backdrop-blur-sm bg-background/30 border border-border/30 hover:border-accent/50 transition-all"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-accent transition-transform hover:rotate-12" />
      ) : (
        <Moon className="h-5 w-5 text-primary transition-transform hover:rotate-12" />
      )}
    </Button>
  );
};

