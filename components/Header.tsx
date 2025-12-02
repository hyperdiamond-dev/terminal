interface HeaderProps {
  currentPath: string;
  moduleName?: string | null;
}

export default function Header({ currentPath, moduleName }: HeaderProps) {
  return (
    <header class="fixed top-0 left-0 right-0 h-[60px] bg-terminal-black border-b-[3px] border-crt-green z-[1000] shadow-header-glow">
      <div class="max-w-[1200px] h-full mx-auto px-4 flex items-center justify-between">
        {/* Brand / Logo */}
        <a
          href="/"
          class="font-mono text-xl font-bold tracking-[0.1em] text-crt-green no-underline text-shadow-crt-glow transition-all duration-300 hover:text-shadow-crt-glow-strong hover:no-underline"
        >
          TERMINAL UTOPIA
        </a>
      </div>
    </header>
  );
}
