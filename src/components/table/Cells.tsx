import { twMerge } from "tailwind-merge";

export function SubText({ text, subtext }: { text: string, subtext: string }){
    return <>
        <h3 className='text-[16px] dark:text-white'>{text}</h3>
        <p className='text-sm text-gray/70 dark:text-white/50'>{subtext}</p>
    </>
}

export function BubbleText({text, className}: { text: string, className?: string }) {
    return <span className={twMerge('px-2 py-1 bg-primary rounded-lg text-sm text-white cursor-pointer', className)}>{text}</span>;
}

export function ActionButton({ icon, onClick }: { icon: JSX.Element, onClick: () => void }) {
    return (
        <button
            className='p-2 rounded-full hover:bg-gray/10 dark:hover:bg-black/70 transition-colors'
            onClick={onClick}
        >
            {icon}
        </button>
    );
}