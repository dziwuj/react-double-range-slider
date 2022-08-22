import React, { useState, useEffect, useRef } from "react";
import "./RangeSlider.scss";

import { RangeSliderProps, Status } from "./RangeSlider.types";

const range = (start: number, end: number, step: number) => {
    return Array.from(Array.from(Array(Math.ceil((end - start) / step)).keys()), (x) => start + x * step);
};

const checkCollision = (el1: HTMLElement, el2: HTMLElement) => {
    var aRect = el1.getBoundingClientRect();
    var bRect = el2.getBoundingClientRect();

    return !(
        aRect.top + aRect.height < bRect.top ||
        aRect.top > bRect.top + bRect.height ||
        aRect.left + aRect.width < bRect.left ||
        aRect.left > bRect.left + bRect.width
    );
};

const RangeSlider: React.FC<RangeSliderProps> = ({ hasSteps, tooltipVisibility, tooltipPosition, value, onChange }) => {
    const values = value instanceof Array ? value : Array.from(range(value.min, value.max + 1, 1));
    const [min, setMin] = useState<Status>({ value: values.at(0) instanceof Array ? values.at(0) : values.at(0).toString(), valueIndex: 0 });
    const [max, setMax] = useState<Status>({
        value: values.at(values.length - 1) instanceof String ? values.at(values.length - 1) : values.at(values.length - 1).toString(),
        valueIndex: values.length - 1,
    });
    if (!tooltipVisibility) tooltipVisibility = "always";
    const [minLeft, setMinLeft] = useState<number | null>(null);
    const [maxLeft, setMaxLeft] = useState<number | null>(null);
    const [track, setTrack] = useState<{ width: number; left: number } | null>(null);
    const [minVisibility, setMinVisibility] = useState<"visible" | "hidden">(tooltipVisibility === "always" ? "visible" : "hidden");
    const [midVisibility, setMidVisibility] = useState<"visible" | "hidden">("hidden");
    const [maxVisibility, setMaxVisibility] = useState<"visible" | "hidden">(tooltipVisibility === "always" ? "visible" : "hidden");
    const [minTooltipLeft, setMinTooltipLeft] = useState<number | null>(null);
    const [maxTooltipLeft, setMaxTooltipLeft] = useState<number | null>(null);
    const [midTooltipLeft, setMidTooltipLeft] = useState<number | null>(null);
    const [merged, setMerged] = useState<boolean>(false);
    const [currentMousePosition, setCurrentMousePosition] = useState<number>(0);
    const [moving, setMoving] = useState<boolean>(false);
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
    const [update, setUpdate] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        document.addEventListener("mousemove", (e) => {
            setCurrentMousePosition(e.clientX);
        });
        document.addEventListener("mouseup", (e) => {
            setStartX(null);
            setMoving(false);
            if (tooltipVisibility === "hover") {
                setMinVisibility("hidden");
                setMaxVisibility("hidden");
                setMidVisibility("hidden");
            }
        });
        if (railRef.current && maxRef.current) {
            setMaxLeft(railRef.current.clientWidth - maxRef.current.clientWidth / 2);
            setBallSize(maxRef.current.clientWidth);
        }
        if (minRef.current) {
            setMinLimit(minRef.current.clientWidth / -2);
            setMinLeft(minRef.current.clientWidth / -2);
        }

        if (maxRef.current && trackRef.current) {
            setMaxLimit(trackRef.current.clientWidth - maxRef.current.clientWidth / 2);
            setMaxLeft(trackRef.current.clientWidth - maxRef.current.clientWidth / 2);
        }

        if (trackRef.current) setTrack({ width: trackRef.current.clientWidth, left: trackRef.current.offsetLeft });

        if (minTooltipRef.current && maxTooltipRef.current) {
            setMinTooltipLeft(minTooltipRef.current.clientWidth / 2);
            setMaxTooltipLeft(maxTooltipRef.current.clientWidth / 2);
        }
    }, []);

    useEffect(() => {
        if (minTooltipRef.current && maxTooltipRef.current)
            setMerged(
                checkCollision(
                    minTooltipRef.current,
                    maxTooltipRef.current || (min.valueIndex === max.valueIndex && min.valueIndex !== null && max.valueIndex !== null)
                )
            );
    }, [minTooltipLeft, maxTooltipLeft]);

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
        if (minLeft !== null && maxLeft !== null && ballSize) setTrack({ left: minLeft + ballSize / 2, width: maxLeft - minLeft });
        if (track && midTooltipRef.current) setMidTooltipLeft(track.left + track.width / 2 - midTooltipRef.current.clientWidth / 2);

        if (update) {
            updateValue(update);
        }
    }, [update]);

    useEffect(() => {
        onChange({ min: min.value, max: max.value });
    }, [min.value, max.value]);

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

            setUpdate(lastMoved);
        }
    }, [currentMousePosition]);

    const jumpTo = (e: any) => {
        e.preventDefault();
        if (minRef.current && maxRef.current && ballSize && minLimit && maxLimit && minLeft !== null && maxLeft !== null) {
            const closer =
                Math.abs(e.clientX - minRef.current.getBoundingClientRect().left) > Math.abs(e.clientX - maxRef.current.getBoundingClientRect().left)
                    ? maxRef.current
                    : minRef.current;
            setCurrLeft(closer.offsetLeft);

            console.log(closer);
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
            setUpdate(closer);
        }
    };

    const updateValue = (closer: HTMLDivElement) => {
        if (railRef.current && trackRef.current && closer && ballSize) {
            const marks = railRef.current.clientWidth / values.length;
            let left = Number(closer.style.left.replace("px", ""));
            left = left > railRef.current.clientWidth ? railRef.current.clientWidth : left;
            left = left <= 0 ? 0 : left;
            let index = Math.floor((left + ballSize / 2) / marks);
            index >= values.length ? (index = values.length - 1) : index;
            const stringValue = values.at(index) instanceof String ? values.at(index) : values.at(index).toString();

            if (closer === minRef.current) setMin({ value: stringValue, valueIndex: index });
            if (closer === maxRef.current) setMax({ value: stringValue, valueIndex: index });

            if (minTooltipRef.current && maxTooltipRef.current) {
                setMinTooltipLeft(minTooltipRef.current.clientWidth / 2);
                setMaxTooltipLeft(maxTooltipRef.current.clientWidth / 2);
                setMerged(
                    checkCollision(minTooltipRef.current, maxTooltipRef.current) ||
                        (min.valueIndex === max.valueIndex && min.valueIndex !== null && max.valueIndex !== null)
                );
            }
        }
        setUpdate(null);
    };

    return (
        <div className="slider-container">
            <div className="rail" ref={railRef} onClick={jumpTo}>
                {hasSteps &&
                    values.map((value, index) => {
                        return (
                            railRef.current &&
                            index > 0 &&
                            index < values.length - 1 && (
                                <div
                                    key={index}
                                    className="step"
                                    style={{ left: `${(railRef.current.clientWidth / (values.length - 1)) * index - 2.5}px` }}
                                ></div>
                            )
                        );
                    })}
            </div>
            <div
                className="track"
                ref={trackRef}
                style={track ? { left: `${track.left}px`, width: `${track.width}px` } : undefined}
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
                className={`min ball${lastMoved === minRef.current ? " active" : ""}`}
                style={{ left: `${minLeft}px` }}
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
                    e.preventDefault();
                    setStartX(currentMousePosition);
                    setLastMoved(minRef.current);
                    setCurrLeft(minLeft);
                    setMoving(true);
                }}
            >
                <div
                    className={`tooltip ${tooltipPosition ? tooltipPosition : "over"}`}
                    style={{ visibility: minVisibility, marginLeft: `-${minTooltipLeft}px` }}
                    ref={minTooltipRef}
                >
                    <p className="min-text-holder text-holder">{min.value}</p>
                </div>
            </div>
            <div
                className={`mid tooltip ${tooltipPosition ? tooltipPosition : "over"}`}
                ref={midTooltipRef}
                style={{ visibility: midVisibility, left: `${midTooltipLeft}px` }}
            >
                <p className="mid-text-holder text-holder">{min.value === max.value ? `${min.value}` : `${min.value} - ${max.value}`}</p>
            </div>
            <div
                className={`max ball${lastMoved === maxRef.current ? " active" : ""}`}
                style={{ left: `${maxLeft}px` }}
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
                    e.preventDefault();
                    setStartX(currentMousePosition);
                    setLastMoved(maxRef.current);
                    setCurrLeft(maxLeft);
                    setMoving(true);
                }}
            >
                <div
                    className={`tooltip ${tooltipPosition ? tooltipPosition : "over"}`}
                    style={{ visibility: maxVisibility, marginLeft: `-${maxTooltipLeft}px` }}
                    ref={maxTooltipRef}
                >
                    <p className="max-text-holder text-holder">{max.value}</p>
                </div>
            </div>
        </div>
    );
};

export default RangeSlider;
