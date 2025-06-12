import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatHeader() {
  return (
    <div className={cn(
      "border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "flex items-center justify-between"
    )}>
      <div className="flex items-center space-x-3">
        {/* Avatar del doctor - Coherente con los avatares de mensajes */}
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
          <Bot className="h-5 w-5 text-secondary-foreground" />
        </div>
        
        <div>
          {/* Título - Estilo similar al nombre del remitente en mensajes */}
          <h2 className="text-lg font-semibold text-foreground">
            Dr. Lucas
          </h2>
          
          {/* Estado - Estilo similar al timestamp de mensajes */}
          <p className="text-xs text-muted-foreground flex items-center">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            En línea • Asistente médico
          </p>
        </div>
      </div>
      
      {/* Botones adicionales - Opcional */}
      <div className="flex items-center space-x-2">
        <button className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
}