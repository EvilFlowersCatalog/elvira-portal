import { twMerge } from "tailwind-merge"

export function H1({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <h1 className={twMerge('px-4 text-secondary dark:text-secondaryLight text-4xl font-extrabold text-left mb-4', className)}>{children}</h1>
    );
}