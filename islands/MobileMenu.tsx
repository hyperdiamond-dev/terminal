import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface MobileMenuProps {
  currentPath: string;
  moduleName?: string | null;
}

export default function MobileMenu(
  { currentPath, moduleName }: MobileMenuProps,
) {
  const isOpen = useSignal(false);
  const isHome = currentPath === "/";
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const wasOpened = useRef(false);

  // Close menu when route changes
  useEffect(() => {
    isOpen.value = false;
  }, [currentPath]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen.value) {
        isOpen.value = false;
      }
    };

    if (typeof globalThis !== "undefined") {
      globalThis.addEventListener("keydown", handleEscape);
      return () => globalThis.removeEventListener("keydown", handleEscape);
    }
  }, []);

  // Prevent body scroll when menu is open; move focus into the menu on
  // open and back to the toggle on close
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isOpen.value) {
        wasOpened.current = true;
        document.body.style.overflow = "hidden";
        navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
      } else {
        document.body.style.overflow = "";
        if (wasOpened.current) {
          toggleRef.current?.focus();
        }
      }
    }
  }, [isOpen.value]);

  const toggleMenu = () => {
    isOpen.value = !isOpen.value;
  };

  const closeMenu = () => {
    isOpen.value = false;
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        ref={toggleRef}
        class="site-header__menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isOpen.value}
        aria-controls="mobile-menu"
      >
        <span class="site-header__hamburger"></span>
        <span class="site-header__hamburger"></span>
        <span class="site-header__hamburger"></span>
      </button>

      {/* Mobile Menu Overlay */}
      <div
        class={`mobile-menu-overlay ${
          isOpen.value ? "mobile-menu-overlay--visible" : ""
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <nav
        id="mobile-menu"
        ref={navRef}
        class={`mobile-menu ${isOpen.value ? "mobile-menu--open" : ""}`}
        aria-label="Mobile navigation"
      >
        <div class="mobile-menu__nav">
          {!isHome && (
            <a
              href="/"
              class={`mobile-menu__link ${
                isHome ? "mobile-menu__link--active" : ""
              }`}
              onClick={closeMenu}
            >
              Home
            </a>
          )}

          {moduleName && (
            <>
              <div class="mobile-menu__divider" aria-hidden="true"></div>
              <div class="mobile-menu__module">
                Current: {moduleName}
              </div>
            </>
          )}

          {!moduleName && !isHome && (
            <>
              <div class="mobile-menu__divider" aria-hidden="true"></div>
              <div class="mobile-menu__module">
                Current: HOME
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
