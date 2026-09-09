import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "sun" | "ink" | "ghost";
  size?: "md" | "sm";
  full?: boolean;
};

const VARIANT = {
  sun: "bg-gradient-to-b from-sun to-sun-hot text-ink shadow-sun",
  ink: "bg-structure-2 text-bg",
  ghost: "bg-transparent text-structure-2 border-[1.5px] border-hair",
};
const SIZE = { md: "h-12 px-5 text-[16px] rounded-ctl", sm: "h-9 px-3.5 text-[14px] rounded-[10px]" };

export function Button({ variant = "ghost", size = "md", full = false, className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold leading-6 transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}
