import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Intro from "./pages/Intro";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <a
                href="/"
                className="flex items-center gap-2 font-extrabold tracking-tight"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                  CP
                </span>
                <span className="text-xl">CivicPulse</span>
              </a>
              <nav className="hidden items-center gap-6 md:flex">
                <a
                  href="#report"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Report
                </a>
                <a
                  href="#admin"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Admin
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Intro />} />
              <Route path="/report" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="border-t bg-white/60">
            <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground">
              Built for responsive, real-time civic reporting
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
