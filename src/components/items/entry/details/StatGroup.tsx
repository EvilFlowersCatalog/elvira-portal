import { ReactNode } from "react";

type StatGroupProps = {
    children: ReactNode;
};

type StatItemProps = {
    value: ReactNode;
    label: ReactNode;
};

export function StatGroup({ children }: StatGroupProps) {
    return (
        <div className="flex flex-wrap gap-10 w-full text-left my-10">
            {children}
        </div>
    );
}

export function StatItem({ value, label }: StatItemProps) {
    return (
        <div className="flex flex-col">
            <span className="text-primary dark:text-primaryLight text-2xl font-semibold">
                {value}
            </span>
            <span className="text-gray dark:text-white text-light text-small">
                {label}
            </span>
        </div>
    );
}
