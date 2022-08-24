export interface Simple {
    min: number;
    max: number;
}

export interface RangeSliderProps {
    hasSteps?: boolean;
    tooltipVisibility?: "always" | "hover" | "never";
    tooltipPosition?: "under" | "over";
    value: Simple | (number | string)[];
    from?: number | string;
    to?: number | string;
    formatter?: (value: number | string) => string;
    onChange: (value: { min: string; max: string; minIndex: number; maxIndex: number }) => void;
}

export interface Status {
    value: string;
    valueIndex: number;
}
