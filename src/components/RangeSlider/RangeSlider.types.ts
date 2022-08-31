import { StyledComponent } from "styled-components";
import { IBall, IStep, ITooltip, ITooltipMid, ITrack } from "./RangeSlider";

export interface Simple {
    min: number;
    max: number;
}

export interface Output {
    min: string;
    max: string;
    minIndex: number;
    maxIndex: number;
}

export interface RangeSliderProps {
    hasSteps?: boolean;
    tooltipVisibility?: "always" | "hover" | "never";
    tooltipPosition?: "under" | "over";
    value: Simple | (number | string)[];
    from?: number | string;
    to?: number | string;
    customTheme?: Partial<Theme>
    className?: string;
    formatter?: (value: number | string) => string;
    onChange: (value: Output) => void;
}

export interface Status {
    value: string;
    valueIndex: number;
}

export interface Theme {
    primaryColor: string;
    secondaryColor: string;
    highlightColor: string;
    sliderLength: number;
    ballSize: 25;
}

export interface ExposeElements {
    container: StyledComponent<"div", any, {}, never>;
    rail: StyledComponent<"div", any, {}, never>;
    step: StyledComponent<"div", any, IStep, never>;
    track: StyledComponent<"div", any, ITrack, never>;
    textHolder: StyledComponent<"p", any, {}, never>;
    textHolderMin: StyledComponent<"p", any, {}, never>;
    textHolderMid: StyledComponent<"p", any, {}, never>;
    textHolderMax: StyledComponent<"p", any, {}, never>;
    tooltip: StyledComponent<"div", any, ITooltip, never>;
    tooltipMin: StyledComponent<"div", any, ITooltip, never>;
    tooltipMid: StyledComponent<"div", any, ITooltip & ITooltipMid, never>;
    tooltipMax: StyledComponent<"div", any, ITooltip, never>;
    ball: StyledComponent<"div", any, IBall, never>;
    ballMin: StyledComponent<"div", any, IBall, never>;
    ballMax: StyledComponent<"div", any, IBall, never>;
}
