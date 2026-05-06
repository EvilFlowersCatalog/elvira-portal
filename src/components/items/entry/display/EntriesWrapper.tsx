import { twMerge } from "tailwind-merge";

export default function EntriesWrapper({ children, limitRows = false, className }: { className?: string, children: React.ReactNode, limitRows?: boolean }) {
return (
    <div
      className={twMerge(
        `grid w-full grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 px-8`,
        limitRows
          ? `
            lg:max-h-[calc(300px*1)]
            md:max-h-[calc(300px*2)]
            max-h-[calc(300px*3)]
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