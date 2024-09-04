import React, {useEffect, useState} from "react";

/**
 * AnimationBackground component
 *
 * This component renders a background animation that cycles through three images.
 * The images fade in and out based on the `index` state, which is updated every 20 seconds.
 *
 */
export const AnimationBackground: React.FC = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Set an interval to update the index every 20 seconds
        const id = setInterval(() => {
            setIndex((r) => (r + 1) % 3);
        }, 20000);

        // Clear the interval when the component unmounts
        return () => clearInterval(id);
    }, [])

    return (
        <div className="anime-background">
            <div className="anime-background-img img1" style={{opacity: index === 0 ? 1 : 0}}></div>
            <div className="anime-background-img img2" style={{opacity: index === 1 ? 1 : 0}}></div>
            <div className="anime-background-img img3" style={{opacity: index === 2 ? 1 : 0}}></div>
        </div>
    )
}