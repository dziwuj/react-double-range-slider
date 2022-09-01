import React, { useState, useEffect, useRef } from "react";
import { RangeSliderProps, Status, Output } from "./RangeSlider.types";

import "./RangeSlider.scss";

const range = (start: number, end: number, step: number) => {
    return Array.from(Array.from(Array(Math.ceil((end - start) / step)).keys()), (x) => start + x * step);
};

const RangeSlider: React.FC<RangeSliderProps> = ({ hasSteps, tooltipVisibility, tooltipPosition, value, onChange, from, to, formatter }) => {
    const values = value instanceof Array ? value : Array.from(range(value.min, value.max + 1, 1));
    const start = from ? (values.indexOf(from) === -1 ? 0 : values.indexOf(from)) : 0;
    const end = to ? (values.indexOf(to) === -1 ? values.length - 1 : values.indexOf(to)) : values.length - 1;
    const format = formatter ? formatter : (x: string | number) => `${x}`;

    const [min, setMin] = useState<Status>({
        value: format(values[start]),
        valueIndex: start,
    });
    const [max, setMax] = useState<Status>({
        value: format(values[end]),
        valueIndex: end,
    });
    if (!tooltipVisibility) tooltipVisibility = "always";
    const [minLeft, setMinLeft] = useState<number | null>(null);
    const [maxLeft, setMaxLeft] = useState<number | null>(null);
    const [track, setTrack] = useState<{ width: number; left: number } | null>(null);
    const [minVisibility, setMinVisibility] = useState<"visible" | "hidden">(tooltipVisibility === "always" ? "visible" : "hidden");
    const [midVisibility, setMidVisibility] = useState<"visible" | "hidden">("hidden");
    const [maxVisibility, setMaxVisibility] = useState<"visible" | "hidden">(tooltipVisibility === "always" ? "visible" : "hidden");
    const [midTooltipLeft, setMidTooltipLeft] = useState<number | null>(null);
    const [merged, setMerged] = useState<boolean>(false);
    const [currentMousePosition, setCurrentMousePosition] = useState<number>(0);
    const [moving, setMoving] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const minTooltipRef = useRef<HTMLDivElement>(null);
    const midTooltipRef = useRef<HTMLDivElement>(null);
    const maxTooltipRef = useRef<HTMLDivElement>(null);
    const railRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const minRef = useRef<HTMLDivElement>(null);
    const maxRef = useRef<HTMLDivElement>(null);
    const [minLimit, setMinLimit] = useState<number | null>(null);
    const [maxLimit, setMaxLimit] = useState<number | null>(null);
    const [lastMoved, setLastMoved] = useState<HTMLDivElement | null>(null);
    const [startX, setStartX] = useState<number | null>(null);
    const [ballSize, setBallSize] = useState<number | null>(null);
    const [currLeft, setCurrLeft] = useState<number | null>(null);
    const [update, setUpdate] = useState<{ value: HTMLDivElement | null; action: string }>({ value: null, action: "" });
    const firstRender = useRef<boolean>(true);
    const [multiplier, setMultiplier] = useState<number>(0);
    const outputRef = React.useRef<Output | null>(null);

    function init() {
        if (railRef.current && maxRef.current) {
            setMaxLeft(railRef.current.clientWidth - maxRef.current.clientWidth / 2);
            setBallSize(maxRef.current.clientWidth);
        }
        if (minRef.current) {
            setMinLimit(minRef.current.clientWidth / -2);
            setMinLeft((railRef.current!.clientWidth / (values.length - 1)) * start - minRef.current.clientWidth / 2);
        }

        if (maxRef.current && trackRef.current) {
            setMaxLimit(trackRef.current.clientWidth - maxRef.current.clientWidth / 2);
            setMaxLeft((railRef.current!.clientWidth / (values.length - 1)) * end - maxRef.current.clientWidth / 2);
        }

        const trackWidth = (railRef.current!.clientWidth / (values.length - 1)) * end - (railRef.current!.clientWidth / (values.length - 1)) * start;
        const trackLeft = (railRef.current!.clientWidth / (values.length - 1)) * start;

        if (trackRef.current)
            setTrack({
                width: trackWidth,
                left: trackLeft,
            });

        if (midTooltipRef.current)
            setMidTooltipLeft(((trackLeft + trackWidth / 2 - midTooltipRef.current.clientWidth / 2) / railRef.current!.clientWidth) * 100);

        const transformValue = window.getComputedStyle(minTooltipRef.current!).transform;
        const w = parseInt(window.getComputedStyle(minTooltipRef.current!).width);
        var matrix = new WebKitCSSMatrix(transformValue);
        const percentValue = (Math.round(matrix.m41 * 10) / 20 / w) * 100;

        const transformValue2 = window.getComputedStyle(maxTooltipRef.current!).transform;
        const w2 = parseInt(window.getComputedStyle(maxTooltipRef.current!).width);
        const matrix2 = new WebKitCSSMatrix(transformValue2);
        const percentValue2 = (Math.round(matrix2.m41 * 10) / 20 / w2) * 100;

        setMultiplier(
            isFinite(1 / (Math.floor((percentValue - percentValue2) / 10) / 10 + 1)) ? 1 / (Math.floor((percentValue - percentValue2) / 10) / 10 + 1) : 0
        );

        if (minTooltipRef.current && maxTooltipRef.current && trackRef.current)
            setMerged(minTooltipRef.current.clientWidth / 2 + maxTooltipRef.current.clientWidth / 2 > trackWidth * multiplier);
    }

    function cancel() {
        outputRef.current && onChange(outputRef.current);
        setStartX(null);
        setMoving(false);
        if (tooltipVisibility === "hover") {
            setMinVisibility("hidden");
            setMaxVisibility("hidden");
            setMidVisibility("hidden");
        }
    }

    function updateSize() {
        init();
    }

    useEffect(() => {
        document.addEventListener("mousemove", (e) => {
            setCurrentMousePosition(e.clientX);
        });
        window.addEventListener("resize", updateSize);

        init();
        setUpdate({ value: null, action: "" });
        return () => {
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    // useEffect(() => {

    // }, [minTooltipLeft, maxTooltipLeft]);

    useEffect(() => {
        if (firstRender.current) return;
        if (minLeft !== null && maxLeft !== null && ballSize) setTrack({ left: minLeft + ballSize / 2, width: maxLeft - minLeft });
        if (ballSize)
            if (track && midTooltipRef.current && containerRef.current) {
                let midLeft = track.left + track.width / 2 - midTooltipRef.current.clientWidth / 2;

                if (midLeft <= Number(window.getComputedStyle(containerRef.current).marginLeft.replace("px", "")) * -1 - ballSize / 2) {
                    midLeft = Number(window.getComputedStyle(containerRef.current).marginLeft.replace("px", "")) * -1 - ballSize / 2;
                    midTooltipRef.current.style.setProperty("--after-left", `0`);
                    midTooltipRef.current.style.setProperty("--after-margin-left", `${track.left + track.width / 2 + ballSize}px`);
                } else if (
                    midLeft + midTooltipRef.current.clientWidth >=
                    containerRef.current.clientWidth + Number(window.getComputedStyle(containerRef.current).marginRight.replace("px", "")) + ballSize
                ) {
                    midLeft =
                        containerRef.current.clientWidth +
                        Number(window.getComputedStyle(containerRef.current).marginRight.replace("px", "")) -
                        midTooltipRef.current.clientWidth +
                        ballSize;
                    midTooltipRef.current.style.setProperty("--after-left", `0`);
                    midTooltipRef.current.style.setProperty("--after-margin-left", `${track.left + track.width / 2 - midLeft - ballSize / 2}px`);
                } else {
                    midLeft = track.left + track.width / 2 - midTooltipRef.current.clientWidth / 2;
                    midTooltipRef.current.style.setProperty("--after-left", `50%`);
                    midTooltipRef.current.style.setProperty("--after-margin-left", `-10px`);
                }
                setMidTooltipLeft((midLeft / railRef.current!.clientWidth) * 100);
            }

        if (update.value) {
            updateValue(update.value);
        }

        if (minTooltipRef.current && maxTooltipRef.current && trackRef.current)
            setMerged(minTooltipRef.current.clientWidth / 2 + maxTooltipRef.current.clientWidth / 2 > trackRef.current.clientWidth * multiplier);
    }, [update]);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        outputRef.current = { min: min.value, max: max.value, minIndex: min.valueIndex, maxIndex: max.valueIndex };
        if (update.action === "jumpTo") onChange(outputRef.current);
    }, [min.value, max.value]);

    useEffect(() => {
        if (tooltipVisibility === "hover") {
            if (merged && moving) {
                setMidVisibility("visible");
                setMinVisibility("hidden");
                setMaxVisibility("hidden");
            } else if (lastMoved === minRef.current && moving) {
                setMinVisibility("visible");
                setMidVisibility("hidden");
                setMaxVisibility("hidden");
            } else if (lastMoved === maxRef.current && moving) {
                setMaxVisibility("visible");
                setMidVisibility("hidden");
                setMinVisibility("hidden");
            } else {
                setMinVisibility("hidden");
                setMaxVisibility("hidden");
                setMidVisibility("hidden");
            }
        } else if (tooltipVisibility === "always") {
            if (merged) {
                setMidVisibility("visible");
                setMinVisibility("hidden");
                setMaxVisibility("hidden");
            } else {
                setMidVisibility("hidden");
                setMinVisibility("visible");
                setMaxVisibility("visible");
            }
        }
    }, [merged]);

    useEffect(() => {
        if (!moving) return;
        if (startX && lastMoved && minLimit && maxLimit && ballSize && currLeft !== null && railRef.current && minLeft !== null && maxLeft !== null) {
            const delta = currentMousePosition - startX;
            const newPosition = (currLeft ? currLeft : 0) + delta;
            const step = Math.round(newPosition / (railRef.current!.clientWidth / (values.length - 1)));
            const newStepPosition = (railRef.current!.clientWidth / (values.length - 1)) * step - ballSize / 2;

            if (hasSteps) {
                if (newStepPosition >= minLimit && newStepPosition <= maxLimit) {
                    if (lastMoved === minRef.current && newStepPosition > maxLeft) return;
                    if (lastMoved === maxRef.current && newStepPosition < minLeft) return;

                    if (lastMoved === minRef.current) setMinLeft(newStepPosition);
                    if (lastMoved === maxRef.current) setMaxLeft(newStepPosition);
                }
            } else {
                if (newPosition >= minLimit && newPosition <= maxLimit) {
                    if (lastMoved === minRef.current && newPosition >= maxLeft) return;
                    if (lastMoved === maxRef.current && newPosition <= minLeft) return;

                    if (lastMoved === minRef.current) setMinLeft(newPosition);
                    if (lastMoved === maxRef.current) setMaxLeft(newPosition);
                }
            }

            setUpdate({ value: lastMoved, action: "move" });
        }
    }, [currentMousePosition]);

    const jumpTo = (e: React.MouseEvent<HTMLDivElement>) => {
        if (minRef.current && maxRef.current && ballSize && minLimit && maxLimit && minLeft !== null && maxLeft !== null) {
            const closer =
                Math.abs(e.clientX - minRef.current.getBoundingClientRect().left) > Math.abs(e.clientX - maxRef.current.getBoundingClientRect().left)
                    ? maxRef.current
                    : minRef.current;
            setCurrLeft(closer.offsetLeft);

            const newPosition = closer.offsetLeft + (e.clientX - closer.getBoundingClientRect().left) - ballSize / 2;
            const step = Math.round(newPosition / (railRef.current!.clientWidth / (values.length - 1)));
            const newStepPosition = (railRef.current!.clientWidth / (values.length - 1)) * step - ballSize / 2;

            if (hasSteps) {
                if (newStepPosition >= minLimit && newStepPosition <= maxLimit) {
                    if (closer === minRef.current && newStepPosition > maxLeft) return;
                    if (closer === maxRef.current && newStepPosition < minLeft) return;

                    if (closer === minRef.current) setMinLeft(newStepPosition);
                    if (closer === maxRef.current) setMaxLeft(newStepPosition);
                }
            } else {
                if (newPosition >= minLimit && newPosition <= maxLimit) {
                    if (closer === minRef.current && newPosition >= maxLeft) return;
                    if (closer === maxRef.current && newPosition <= minLeft) return;

                    if (closer === minRef.current) setMinLeft(newPosition);
                    if (closer === maxRef.current) setMaxLeft(newPosition);
                }
            }
            setUpdate({ value: closer, action: "jumpTo" });
        }
    };

    const updateValue = (closer: HTMLDivElement) => {
        if (railRef.current && trackRef.current && closer && ballSize) {
            const marks = railRef.current.clientWidth / values.length;
            let left = Number(window.getComputedStyle(closer).left.replace("px", ""));
            left = left > railRef.current.clientWidth ? railRef.current.clientWidth + ballSize / 2 : left + ballSize / 2;
            left = left <= 0 ? 0 : left;
            let index = Math.floor(left / marks);
            index >= values.length ? (index = values.length - 1) : index;

            const stringValue = typeof values[index] === "string" ? values[index] : values[index].toString();

            if (closer === minRef.current) setMin({ value: format(stringValue), valueIndex: index });
            if (closer === maxRef.current) setMax({ value: format(stringValue), valueIndex: index });
        }
        setUpdate({ ...update, value: null });
    };

    return (
        <div className="double-range-slider-container" ref={containerRef}>
            <div className="double-range-slider-rail" ref={railRef} onClick={jumpTo}>
                {hasSteps &&
                    values.map((value, index) => {
                        return (
                            railRef.current &&
                            index > 0 &&
                            index < values.length - 1 && (
                                <div
                                    key={index}
                                    className="double-range-slider-step"
                                    style={{ left: `${(railRef.current.clientWidth / (values.length - 1)) * index - 2.5}px` }}
                                ></div>
                            )
                        );
                    })}
            </div>
            <div
                className="double-range-slider-track"
                ref={trackRef}
                style={track ? { left: `${(track.left / railRef.current?.clientWidth!) * 100}%`, width: `${track.width}px` } : undefined}
                onMouseOver={() => {
                    if (tooltipVisibility === "hover" && merged) {
                        setMidVisibility("visible");
                        setMinVisibility("hidden");
                        setMaxVisibility("hidden");
                    } else if (tooltipVisibility === "hover") {
                        setMidVisibility("hidden");
                        setMinVisibility("hidden");
                        setMaxVisibility("hidden");
                    }
                }}
                onMouseOut={() => {
                    if (tooltipVisibility === "hover" && merged) {
                        setMidVisibility("hidden");
                        setMinVisibility("hidden");
                        setMaxVisibility("hidden");
                    } else if (tooltipVisibility === "hover") {
                        setMidVisibility("hidden");
                        setMinVisibility("hidden");
                        setMaxVisibility("hidden");
                    }
                }}
                onClick={jumpTo}
            ></div>
            <div
                className={`double-range-slider-min double-range-slider-ball${lastMoved === minRef.current ? " double-range-slider-active" : ""}`}
                style={{ left: `${(minLeft! / railRef.current?.clientWidth!) * 100}%` }}
                ref={minRef}
                onMouseOver={() => {
                    if (tooltipVisibility === "hover" && !merged) {
                        setMinVisibility("visible");
                        setMidVisibility("hidden");
                    } else if (tooltipVisibility === "hover" && merged) {
                        setMinVisibility("hidden");
                        setMidVisibility("visible");
                    }
                }}
                onMouseOut={() => {
                    if (tooltipVisibility === "hover" && !merged) {
                        setMinVisibility("hidden");
                        setMidVisibility("hidden");
                    } else if (tooltipVisibility === "hover" && merged) {
                        setMinVisibility("hidden");
                        setMidVisibility("hidden");
                    }
                }}
                onMouseDown={(e) => {
                    setStartX(currentMousePosition);
                    setLastMoved(minRef.current);
                    setCurrLeft(minLeft);
                    setMoving(true);
                    document.addEventListener("mouseup", cancel, { once: true });
                }}
            >
                <div
                    className={`double-range-slider-tooltip ${tooltipPosition ? `double-range-slider-${tooltipPosition}` : "double-range-slider-over"}`}
                    style={{ visibility: minVisibility }}
                    ref={minTooltipRef}
                >
                    <p className="double-range-slider-min-text-holder double-range-slider-text-holder">{min.value}</p>
                </div>
            </div>
            <div
                className={`double-range-slider-mid double-range-slider-tooltip ${
                    tooltipPosition ? `double-range-slider-${tooltipPosition}` : "double-range-slider-over"
                }`}
                ref={midTooltipRef}
                style={{ visibility: midVisibility, left: `${midTooltipLeft}%` }}
            >
                <p className="double-range-slider-mid-text-holder double-range-slider-text-holder">
                    {min.value === max.value ? `${min.value}` : `${min.value} - ${max.value}`}
                </p>
            </div>
            <div
                className={`double-range-slider-max double-range-slider-ball${lastMoved === maxRef.current ? " double-range-slider-active" : ""}`}
                style={{ left: `${(maxLeft! / railRef.current?.clientWidth!) * 100}%` }}
                ref={maxRef}
                onMouseOver={() => {
                    if (tooltipVisibility === "hover" && !merged) {
                        setMaxVisibility("visible");
                        setMidVisibility("hidden");
                    } else if (tooltipVisibility === "hover" && merged) {
                        setMaxVisibility("hidden");
                        setMidVisibility("visible");
                    }
                }}
                onMouseOut={() => {
                    if (tooltipVisibility === "hover" && !merged) {
                        setMaxVisibility("hidden");
                        setMidVisibility("hidden");
                    } else if (tooltipVisibility === "hover" && merged) {
                        setMaxVisibility("hidden");
                        setMidVisibility("hidden");
                    }
                }}
                onMouseDown={(e) => {
                    setStartX(currentMousePosition);
                    setLastMoved(maxRef.current);
                    setCurrLeft(maxLeft);
                    setMoving(true);
                    document.addEventListener("mouseup", cancel, { once: true });
                }}
            >
                <div
                    className={`double-range-slider-tooltip ${tooltipPosition ? `double-range-slider-${tooltipPosition}` : "double-range-slider-over"}`}
                    style={{ visibility: maxVisibility }}
                    ref={maxTooltipRef}
                >
                    <p className="double-range-slider-max-text-holder double-range-slider-text-holder">{max.value}</p>
                </div>
            </div>
        </div>
    );
};
export default RangeSlider;
