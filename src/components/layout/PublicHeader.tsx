import { Button } from "@/components/ui/button";
import { FileText, Plus, List, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";

export function PublicHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Zyon Shipping
            </span>
          </a>
        </div>
        <nav className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {user && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/pda/new")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Criar PDA</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/pda")}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Minhas PDAs</span>
              </Button>
            </div>
          )}
          {!user && (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/auth/signup")}
              >
                Cadastrar
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
