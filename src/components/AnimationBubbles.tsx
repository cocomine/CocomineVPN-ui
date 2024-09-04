import React, {CSSProperties, useMemo} from "react";

/**
 * Bubbles background animation
 * @constructor
 */
export const AnimationBubbles: React.FC = () => {
    const count = 20;

    return (
        <div className="bubbles">
            {Array.from(Array(count).keys()).map((_, i) => <Bubble key={i} delay={i}/>)}
        </div>
    )
}

/**
 * Bubble background animation element
 * @param delay Spawn delay time
 * @constructor
 */
const Bubble: React.FC<{ delay: number }> = ({delay}) => {
    const defaultStyle = useMemo(() => ({
        "--bubble-left-offset": `${(Math.random() * 100).toFixed(0)}%`,
        "--bubble-size": `${(Math.random() * 150 + 10).toFixed(0)}px`,
        "--bubble-float-duration": `${(Math.random() * 10 + 10).toFixed(0)}s`,
        "--bubble-float-delay": `${delay}s`,
        "--bubble-sway-type": Math.random() > 0.5 ? "sway-left-to-right" : "sway-right-to-left",
        "--bubble-sway-duration": `${(Math.random() * 6 + 4).toFixed(0)}s`,
        "--bubble-sway-delay": `${(Math.random() * 5).toFixed(0)}s`,
    } as CSSProperties), [delay]);

    return (
        <div className="bubble" style={defaultStyle}></div>
    )
}