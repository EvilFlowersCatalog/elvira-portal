import { twMerge } from "tailwind-merge"

export function H1({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <h1 data-guide="page-title" className={twMerge('w-fit max-w-full px-4 text-secondary dark:text-secondaryLight text-4xl font-extrabold text-left mb-4', className)}>{children}</h1>
    );
}