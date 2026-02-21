import React from 'react';
import lockerImg from '../assets/locker_minimalist.png';

import './LockerCard.css';

const LockerCard = ({ locker }) => {
    const isAvailable = locker.status === 'Available';

    return (
        <div className={`locker-card ${isAvailable ? 'available' : 'occupied'}`}>
            <div className="locker-image-container">
                <img src={lockerImg} alt={`Locker ${locker.number}`} className="locker-img" />
                <div className={`locker-tint ${isAvailable ? 'available' : 'occupied'}`}></div>
                <div className="locker-overlay">
                    <div className="locker-number">{locker.number}</div>

                    <div className={`key-indicator ${locker.hasKey ? 'has-key' : 'no-key'}`}>
                        {/* Simple Key SVG Icon */}
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M12.65 10C11.83 7.67 9.61 6 7 6a5 5 0 00-5 5c0 2.76 2.24 5 5 5 2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LockerCard;
