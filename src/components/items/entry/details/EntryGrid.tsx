import { ReactNode } from "react";

type InfoGridProps = {
    children: ReactNode;
};

type InfoItemProps = {
    label: ReactNode;
    children: ReactNode;
};

type InfoItemCustomProps = {
    label: ReactNode;
    children: ReactNode;
};

export function InfoGrid({ children }: InfoGridProps) {
    return <div className="grid grid-cols-2 gap-4 mt-10">{children}</div>;
}

export function InfoItem({ label, children }: InfoItemProps) {
    return (
        <div className="flex flex-col">
            <span className="text-darkGray dark:text-lightGray uppercase">
                {label}
            </span>
            <span className="text-secondary dark:text-secondaryLight font-extrabold">
                {children}
            </span>
        </div>
    );
}

export function InfoItemCustom({ label, children }: InfoItemCustomProps) {
    return (
        <div className="flex flex-col">
            <span className="text-darkGray dark:text-lightGray uppercase">
                {label}
            </span>
            <div>{children}</div>
        </div>
    );
}
