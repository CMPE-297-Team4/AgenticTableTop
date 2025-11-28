import { useNavigate } from "react-router-dom";
import { FantasyButton } from "@/components/FantasyButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  LogOut,
  Home,
  Scroll,
  Users,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface AppNavBarProps {
  showUserMenu?: boolean;
  campaigns?: any[];
  characters?: any[];
  onNavigateToCampaign?: (campaignId: string) => void;
  onNavigateToCharacter?: (characterId: string) => void;
  className?: string;
}

export const AppNavBar = ({
  showUserMenu = true,
  campaigns = [],
  characters = [],
  onNavigateToCampaign,
  onNavigateToCharacter,
  className = "",
}: AppNavBarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <nav className={`w-full px-4 py-3 relative z-20 backdrop-blur-sm bg-background/80 border-b border-border/30 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-fantasy-title bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent leading-tight whitespace-nowrap text-mystical">
          Dungeons & Dragons AI
        </h1>
        <div className="flex items-center gap-2">
          {showUserMenu && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <FantasyButton variant="ghost" size="sm" className="font-fantasy-body">
                  <User className="h-4 w-4 mr-2" />
                  <span>{user.username}</span>
                </FantasyButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Campaigns Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Scroll className="mr-2 h-4 w-4" />
                    <span>Campaigns</span>
                    {campaigns.length > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {campaigns.length}
                      </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    {campaigns.length > 0 ? (
                      <>
                        {campaigns.slice(0, 5).map((campaign) => (
                          <DropdownMenuItem
                            key={campaign.id}
                            onClick={() => onNavigateToCampaign?.(campaign.id)}
                          >
                            {campaign.title || campaign.name}
                          </DropdownMenuItem>
                        ))}
                        {campaigns.length > 5 && (
                          <DropdownMenuItem onClick={() => navigate("/campaigns")}>
                            View all ({campaigns.length})
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <DropdownMenuItem disabled>No campaigns yet</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/create-campaign")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Campaign
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Characters Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Characters</span>
                    {characters.length > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {characters.length}
                      </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    {characters.length > 0 ? (
                      <>
                        {characters.slice(0, 5).map((character) => (
                          <DropdownMenuItem
                            key={character.id}
                            onClick={() => onNavigateToCharacter?.(character.id)}
                          >
                            {character.name}
                          </DropdownMenuItem>
                        ))}
                        {characters.length > 5 && (
                          <DropdownMenuItem onClick={() => navigate("/characters")}>
                            View all ({characters.length})
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <DropdownMenuItem disabled>No characters yet</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/character-create")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Character
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ThemeToggle />
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
      </div>
    </nav>
  );
};

