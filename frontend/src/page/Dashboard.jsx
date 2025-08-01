import { useEffect, useState, useRef } from "react";

export default function Dashboard({ api_url, socket }) {
    const [videoSrc, setVideoSrc] = useState("");
    const canvasRef = useRef(null);
    const [audioLabel, setAudioLabel] = useState("");
    const [coryzaCount, setCoryzaCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [position, setPosition] = useState(0);
    const [yPos, setYPos] = useState(0);
    const [scaling, setScaling] = useState(1);
    const [baseSpeed] = useState(3);
    const [baseSize] = useState(2);
    const speedRef = useRef(Math.abs(Math.random() * baseSpeed) + 4); // Initial random speed
    const directionRef = useRef(1); // 1 = right, -1 = left

     // State to hold the sensor data
     const [sensorData, setSensorData] = useState({
        lightIntensity: "Loading...",
        temperature: "Loading...",
        humidity: "Loading...",
        pressure: "Loading...",
    });


    useEffect(() => {
        setYPos((Math.floor(Math.random() * (window.innerHeight * 0.8)) + (window.innerHeight * 0.1)));

        const interval = setInterval(() => {
            setPosition((prevPosition) => {
                const nextPosition = prevPosition + speedRef.current * directionRef.current;

                // Check if we need to reverse
                if (nextPosition >= window.innerWidth + 96 * scaling) {
                    directionRef.current = -1;
                    speedRef.current = Math.abs(Math.random() * baseSpeed) + 4;
                    setScaling((Math.random() * baseSize) + 0.5);
                    setYPos((Math.floor(Math.random() * (window.innerHeight * 0.8)) + (window.innerHeight * 0.1)));
                } else if (nextPosition <= -96 * scaling) {
                    directionRef.current = 1;
                    speedRef.current = Math.abs(Math.random() * baseSpeed) + 4;
                    setScaling((Math.random() * baseSize) + 0.5);
                    setYPos((Math.floor(Math.random() * (window.innerHeight * 0.8)) + (window.innerHeight * 0.1)));
                }

                return nextPosition;
            });
        }, 16);

        return () => clearInterval(interval);
    }, []); // Only run on mount

    useEffect(() => {
        socket.on("video_stream", (data) => {
            setVideoSrc(`data:image/jpeg;base64,${data.image}`);
            setCoryzaCount(data.coryza_detected || 0);  // 👈 Get Coryza count
            setTotalCount(data.total_detected || 0);  // 👈 Get Coryza count
        });
    
        socket.on("audio_classification", (data) => {
            drawWaveform(data.waveform);
            setAudioLabel(data.label);  // 👈 Set audio classification label
        });

        socket.on("sensor_data", (data) => {
            setSensorData({
                lightIntensity: data.lux || "Not available",
                temperature: data.temperature_aht20 || "Not available",
                humidity: data.humidity_aht20 || "Not available",
                pressure: data.pressure_bmp280 || "Not available",
            });
        })
    
        return () => {
            socket.off("video_stream");
            socket.off("audio_classification");
            socket.off("sensor_data");
        };
    }, []);

    const drawWaveform = (waveform) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();

        const mid = canvas.height / 2;
        const scaleX = canvas.width / waveform.length;
        const scaleY = mid / Math.max(...waveform.map(Math.abs));

        ctx.moveTo(0, mid);
        waveform.forEach((sample, i) => {
            const y = mid - sample * scaleY;
            ctx.lineTo(i * scaleX, y);
        });

        ctx.strokeStyle = "#06b6d4"; // Tailwind's cyan-500
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const handleRecord = async () => {
        console.log("Sending record request...");
        try {
            const response = await fetch(`${api_url}/record`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}), // Optional: Add body if needed
            });
    
            const data = await response.json();
    
            if (response.ok) {
                alert(`✅ Diagnosis Recorded:\n${JSON.stringify(data.data, null, 2)}`);
            } else {
                alert(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error recording diagnosis:", error);
            alert("❌ Could not reach backend.");
        }
    };
    
    

    return (
        <div className="relative h-screen flex justify-center items-center bg-yellow-200 p-6 overflow-x-clip">
            {/* Dynamically move image */}
            <img
                className="absolute"
                src="https://www.animatedimages.org/data/media/532/animated-chicken-image-0079.gif"
                alt="Moving chicken"
                style={{
                    top: `${yPos}px`, // Set the random Y position
                    right: `${position}px`, // Set the dynamic position for X
                    transition: "right 0.016s ease-in-out", // Smooth transition
                    transform: `scaleX(${directionRef.current*scaling}) scaleY(${scaling})`,
                }}
            />

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 drop-shadow-lg drop-shadow-red-400/50">
                    {/* Live Video Feed */}
                    <div className="bg-white rounded-2xl shadow p-4">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">Live Video Feed</h2>
                        {videoSrc ? (
                        <img
                            src={videoSrc}
                            alt="Live Stream"
                            className="w-full rounded-md border border-gray-300"
                        />
                        ) : (
                        <div
                            className="w-full h-[280px] rounded-md border border-gray-300 bg-black flex items-center justify-center text-white text-sm"
                        >
                            No video feed
                        </div>
                        )}
                    </div>

                    {/* Audio Waveform */}
                    <div className="bg-white rounded-2xl shadow p-4">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">Audio Waveform</h2>
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={100}
                            className="w-full border border-gray-300 rounded-md"
                        ></canvas>
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">
                            Audio Prediction: <span className="text-blue-600">{audioLabel}</span>
                        </h2>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-700 mb-2">Status:</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <th className="p-2">Light Intensity</th>
                                        <td className="p-2">{sensorData.lightIntensity} lux</td>
                                    </tr>
                                    <tr>
                                        <th className="p-2">Temperature</th>
                                        <td className="p-2">{sensorData.temperature} &deg;C</td>
                                    </tr>
                                    <tr>
                                        <th className="p-2">Humidity</th>
                                        <td className="p-2">{sensorData.humidity}%</td>
                                    </tr>
                                    <tr>
                                        <th className="p-2">Atmospheric Pressure</th>
                                        <td className="p-2">{sensorData.pressure} hPa</td>
                                    </tr>
                                </tbody>
                            </table>
                            <h2 className="text-lg font-semibold text-gray-700 mt-2">
                                Coryza Detections: <span className="text-red-600">{coryzaCount}</span>
                            </h2>
                            <h2 className="text-lg font-semibold text-gray-700 mt-2">
                                Total Chicken: <span className="text-red-600">{totalCount}</span>
                            </h2>
                            <button
                                onClick={handleRecord}
                                className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
                            >
                                Record Diagnosis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}