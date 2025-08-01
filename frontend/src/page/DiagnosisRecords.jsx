import { useEffect, useState } from "react";
import axios from "axios";

const DiagnosisRecords = ({ api_url, socket }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coryzaCount, setCoryzaCount] = useState(0);  // Coryza count from socket
    const [totalCount, setTotalCount] = useState(0);  // Total chicken count from socket

    // Fetch records on component mount
    useEffect(() => {
        axios
            .get(`${api_url}/diagnosis`)
            .then((response) => {
                setRecords(response.data.data);  // Set the records data to state
                setLoading(false);  // Set loading to false after data is loaded
            })
            .catch((error) => {
                console.error(error); // Log error to the console for debugging
                setError("Error fetching records");
                setLoading(false);
            });

        // Socket connection to listen for new diagnosis information
        socket.on("diagnosis_update", (data) => {
            setCoryzaCount(data.coryza_detected || 0);
            setTotalCount(data.total_detected || 0);
        });

        return () => {
            socket.off("diagnosis_update"); // Cleanup the socket event
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-yellow-200 md:mt-20 p-6 overflow-x-clip">
            <div className="max-w-7xl mx-auto">
                {/* Diagnosis Records Section */}
                <div className="bg-white rounded-2xl shadow p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Diagnosis Records</h2>

                    {loading ? (
                        <p>Loading records...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left">ID</th>
                                    <th className="px-4 py-2 text-left">Date</th>
                                    <th className="px-4 py-2 text-left">Time</th>
                                    <th className="px-4 py-2 text-left">Number of Chickens</th>
                                    <th className="px-4 py-2 text-left">Number Infected</th>
                                    <th className="px-4 py-2 text-left">Diagnosis Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-4 py-2">{record.id}</td>
                                        <td className="px-4 py-2">{record.date}</td>
                                        <td className="px-4 py-2">{record.time}</td>
                                        <td className="px-4 py-2">{record.num_chickens}</td>
                                        <td className="px-4 py-2">{record.num_infected}</td>
                                        <td className="px-4 py-2">{record.diagnosis_result}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Real-time Status Section */}
                <div className="bg-white rounded-2xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-2 text-gray-700">Real-Time Diagnosis Stats</h2>

                    <div className="text-lg text-gray-700">
                        <p>Coryza Detections: <span className="text-red-600">{coryzaCount}</span></p>
                        <p>Total Chicken: <span className="text-red-600">{totalCount}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiagnosisRecords;