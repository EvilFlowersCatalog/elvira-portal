import { twMerge } from "tailwind-merge";

export default function EntriesWrapper({ children, limitRows = false, className }: { className?: string, children: React.ReactNode, limitRows?: boolean }) {
    return (
       <div className={twMerge(`grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 px-8 justify-items-center
        ${limitRows ? 'sm:grid-rows-4 md:grid-rows-2 lg:grid-rows-1 overflow-y-hidden auto-rows-[0]' : ''}`, className)}>
            {children}
        </div>
    );
}