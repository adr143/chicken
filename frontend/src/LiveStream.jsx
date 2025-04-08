import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

export default function LiveStream() {
    const [videoSrc, setVideoSrc] = useState("");
    const canvasRef = useRef(null);

    useEffect(() => {
        socket.on("video_stream", (data) => {
            setVideoSrc(`data:image/jpeg;base64,${data.image}`);
        });

        socket.on("audio_waveform", (data) => {
            drawWaveform(data.waveform);
        });

        return () => {
            socket.off("video_stream");
            socket.off("audio_waveform");
        };
    }, []);

    const drawWaveform = (waveform) => {
        const canvas = canvasRef.current;
        if (!canvas) return; // Make sure canvas is available

        const ctx = canvas.getContext("2d");
        if (!ctx) return; // Ensure context is available

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the previous frame
        ctx.beginPath();

        const mid = canvas.height / 2; // Midpoint to draw waveform
        const scaleX = canvas.width / waveform.length; // Scale based on canvas width
        const scaleY = mid / Math.max(...waveform.map(Math.abs)); // Scale based on max value

        ctx.moveTo(0, mid); // Start drawing at the center of the canvas
        waveform.forEach((sample, i) => {
            const y = mid - sample * scaleY;
            ctx.lineTo(i * scaleX, y); // Draw waveform line
        });

        ctx.strokeStyle = "cyan"; // Set waveform color
        ctx.lineWidth = 2; // Line width for better visibility
        ctx.stroke(); // Apply stroke to canvas
    };

    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-xl font-bold mb-4">Live Stream</h1>
            <img
                src={videoSrc}
                alt="Live Stream"
                className="border rounded-md shadow-lg w-full max-w-lg"
            />
            <canvas
                ref={canvasRef}
                width={500}
                height={100}
                className="border mt-4"
            ></canvas>
        </div>
    );
}
