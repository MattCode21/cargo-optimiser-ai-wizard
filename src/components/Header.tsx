import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-border flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <img 
          src="/lovable-uploads/d15cd5ce-84b0-47a5-8ee9-ab96fde40395.png" 
          alt="J&J Sourcing Logo" 
          className="h-10 w-10 object-contain"
        />
        <h1 className="text-2xl font-bold text-foreground">Loading Optimizer</h1>
      </div>
      <ThemeToggle />
    </header>
  )
}