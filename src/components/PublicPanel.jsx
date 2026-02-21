import React from 'react';
import { useLockers } from '../context/LockerContext';
import LockerCard from './LockerCard';
import './PublicPanel.css';

const PublicPanel = () => {
    const { lockers } = useLockers();

    return (
        <div className="public-panel">
            <div className="locker-grid">
                {lockers.map(locker => (
                    <LockerCard key={locker.id} locker={locker} />
                ))}
            </div>
        </div>
    );
};

export default PublicPanel;
