import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/utils';

interface NavigationItem {
    title: string;
    href: string;
    description?: string;
    isExternal?: boolean;
}

interface NavigationProps {
    items: NavigationItem[];
    className?: string;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'pills' | 'underline';
}

export function Navigation({
                               items,
                               className,
                               orientation = 'horizontal',
                               variant = 'default'
                           }: NavigationProps) {
    const pathname = usePathname();

    const baseClasses = cn(
        "flex",
        orientation === 'horizontal' ? "flex-row space-x-1" : "flex-col space-y-1",
        className
    );

    const getLinkClasses = (href: string) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

        const baseLink = "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

        switch (variant) {
            case 'pills':
                return cn(
                    baseLink,
                    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                );

            case 'underline':
                return cn(
                    baseLink,
                    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium border-b-2",
                    isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                );

            default:
                return cn(
                    baseLink,
                    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                );
        }
    };

    return (
        <nav className={baseClasses}>
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={getLinkClasses(item.href)}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                >
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}

// Breadcrumb Navigation Component
interface BreadcrumbItem {
    title: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
    separator?: React.ReactNode;
}

export function Breadcrumb({
                               items,
                               className,
                               separator = "/"
                           }: BreadcrumbProps) {
    return (
        <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <span className="mx-2 text-muted-foreground/50">{separator}</span>
                    )}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-foreground transition-colors"
                        >
                            {item.title}
                        </Link>
                    ) : (
                        <span className={index === items.length - 1 ? "text-foreground font-medium" : ""}>
              {item.title}
            </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}

// Tab Navigation Component
interface TabItem {
    value: string;
    label: string;
    count?: number;
    disabled?: boolean;
}

interface TabNavigationProps {
    items: TabItem[];
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
}

export function TabNavigation({
                                  items,
                                  value,
                                  onValueChange,
                                  className
                              }: TabNavigationProps) {
    return (
        <div className={cn("flex space-x-1 bg-muted p-1 rounded-lg", className)}>
            {items.map((item) => (
                <button
                    key={item.value}
                    onClick={() => !item.disabled && onValueChange(item.value)}
                    disabled={item.disabled}
                    className={cn(
                        "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        value === item.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        item.disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                        <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            value === item.value
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted-foreground/20 text-muted-foreground"
                        )}>
              {item.count}
            </span>
                    )}
                </button>
            ))}
        </div>
    );
}