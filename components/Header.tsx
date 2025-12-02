interface HeaderProps {
  currentPath: string;
  moduleName?: string | null;
}

export default function Header(
  { currentPath: _currentPath, moduleName: _moduleName }: HeaderProps,
) {
  return (
    <header class="fixed top-0 left-0 right-0 h-[60px] bg-decay-void border-b-[2px] border-analog-red z-[1000] shadow-decay-edge">
      <div class="max-w-[1200px] h-full mx-auto px-4 flex items-center justify-between">
        {/* Brand / Logo */}
        <a
          href="/"
          class="font-mono text-xl font-bold tracking-[0.1em] text-vhs-white no-underline text-shadow-vhs-red transition-all duration-300 hover:text-analog-red hover:no-underline"
        >
          TERMINAL UTOPIA
        </a>
      </div>
    </header>
  );
}
