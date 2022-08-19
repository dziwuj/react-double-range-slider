export interface Simple {
    min: number;
    max: number;
}

export interface RangeSliderProps {
    hasSteps?: boolean;
    tooltipVisibility?: "always" | "hover" | "never";
    tooltipPosition?: "under" | "over";
    value: Simple | any[];
    onChange: (x: any) => void;
}

export interface Status {
    value: string;
    valueIndex: number;
}
