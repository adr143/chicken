// src/components/Navbar.js

import React from "react";
import { Link } from "react-router-dom"; // Use Link for navigation

function Navbar() {
    return (
        <nav className="sticky md:fixed top-0 bg-gray-800 p-4 z-1000 w-screen">
            <ul className="flex justify-around space-x-8">
                <li>
                    <Link to="/" className="text-3xl font-bold text-white drop-shadow-lg drop-shadow-red-400 mb-6">
                        <div className="h-12">
                            <img className="h-full" src="logo.png" alt="logo" />
                        </div>
                    </Link>
                </li>
                <li className="flex justify-around items-center space-x-8">
                    <Link to="/" className="text-white text-lg hover:text-yellow-500">Dashboard</Link>
                    <Link to="/records" className="text-white text-lg hover:text-yellow-500">Diagnosis Records</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;