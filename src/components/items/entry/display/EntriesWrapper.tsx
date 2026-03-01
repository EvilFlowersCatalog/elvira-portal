import { twMerge } from "tailwind-merge";

export default function EntriesWrapper({ children, limitRows = false, className }: { className?: string, children: React.ReactNode, limitRows?: boolean }) {
return (
    <div
      className={twMerge(
        `grid w-full grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8 px-8 justify-items-center`,
        limitRows
          ? `
            lg:max-h-[calc(17rem*1)]
            md:max-h-[calc(17rem*2+32px)]
            max-h-[calc(17rem*3+64px)]
            overflow-y-hidden
          `
          : '',
        className
      )}
    >
      {children}
    </div>
  );
}