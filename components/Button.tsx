import { JSX } from "preact";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  const baseClasses =
    "px-4 py-2 border-2 border-accent rounded-none font-bold uppercase text-sm transition-colors font-mono";
  const stateClasses = props.disabled
    ? "opacity-50 cursor-not-allowed"
    : "hover:bg-accent hover:text-terminal-black";

  const buttonClasses = `${baseClasses} ${stateClasses} ${props.class || ""}`;

  return (
    <button
      {...props}
      class={buttonClasses}
      style={{
        backgroundColor: "rgba(51, 255, 51, 0.05)",
        color: "var(--color-accent)",
        ...(typeof props.style === "object" ? props.style : {}),
      }}
    />
  );
}
