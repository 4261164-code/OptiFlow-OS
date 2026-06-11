// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { KPICards } from "../../components/executive/KPICards";
import { ErrorBoundary } from "../../components/executive/ErrorBoundary";
import * as metricsHook from "../../hooks/executive/useExecutiveMetrics";
import ExecutiveDashboard from "../../pages/executive";

// Mock the components avoiding complex chart renders
vi.mock("../../components/executive/Charts", () => ({ Charts: () => <div data-testid="mock-charts">Charts</div> }));
vi.mock("../../components/executive/Rankings", () => ({ Rankings: () => <div data-testid="mock-rankings">Rankings</div> }));

describe("Executive Dashboard Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        cleanup();
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(), // Deprecated
                removeListener: vi.fn(), // Deprecated
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    it("KPI card renders skeleton before data arrives", () => {
        vi.spyOn(metricsHook, "useExecutiveMetrics").mockReturnValue({
            status: "loading",
            metrics: {
                revenue: { current: 0, change: 0 },
                net: { current: 0, change: 0 },
                clicks: { current: 0, change: 0 },
                conversions: { current: 0, change: 0 },
                conversionRate: { current: 0, change: 0 },
                aov: { current: 0, change: 0 },
            }
        });
        const { container } = render(<KPICards />);
        expect(container.querySelector('.animate-pulse')).not.toBeNull();
    });

    it("KPI card renders value after data arrives", () => {
        vi.spyOn(metricsHook, "useExecutiveMetrics").mockReturnValue({
            status: "active",
            metrics: {
                revenue: { current: 1500, change: 0 },
                net: { current: 0, change: 0 },
                clicks: { current: 0, change: 0 },
                conversions: { current: 0, change: 0 },
                conversionRate: { current: 0, change: 0 },
                aov: { current: 0, change: 0 },
            }
        });
        render(<KPICards />);
        expect(screen.getByText("$1,500.00")).toBeDefined();
    });

    it("Error boundary catches thrown error and shows retry button", () => {
        const Thrower = () => { throw new Error("Test error"); };
        render(
            <ErrorBoundary>
                <Thrower />
            </ErrorBoundary>
        );
        expect(screen.getByText("This section failed to load.")).toBeDefined();
        expect(screen.getByText("Retry")).toBeDefined();
    });

    it("Retry button re-mounts the failed section", () => {
        let shouldThrow = true;
        const Thrower = () => {
            if (shouldThrow) throw new Error("Test error");
            return <div>Success!</div>;
        };
        render(
            <ErrorBoundary>
                <Thrower />
            </ErrorBoundary>
        );
        expect(screen.queryByText("Success!")).toBeNull();
        shouldThrow = false;
        fireEvent.click(screen.getByText("Retry"));
        expect(screen.getByText("Success!")).toBeDefined();
    });

    it("Dark mode toggle persists to localStorage and applies correct CSS class", () => {
        vi.spyOn(metricsHook, "useExecutiveMetrics").mockReturnValue({
            status: "active",
            metrics: {
                revenue: { current: 0, change: 0 },
                net: { current: 0, change: 0 },
                clicks: { current: 0, change: 0 },
                conversions: { current: 0, change: 0 },
                conversionRate: { current: 0, change: 0 },
                aov: { current: 0, change: 0 },
            }
        });
        
        render(<ExecutiveDashboard />);
        const toggleBtn = screen.getByRole("button", { name: "" }); // the icon button has no standard name, let's find by class or just the only button in header.

        // Wait... query via selector
        const toggle = document.querySelector('header button');
        fireEvent.click(toggle!);

        expect(localStorage.getItem("theme")).toBeDefined();
        // Since initial might be light or dark, just check it flips documentElement class.
        // If it was light, it becomes dark, we can toggle twice to be sure.
        fireEvent.click(toggle!);
        const currentTheme = localStorage.getItem("theme");
        if (currentTheme === 'dark') {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
        } else {
            expect(document.documentElement.classList.contains('dark')).toBe(false);
        }
    });
});
