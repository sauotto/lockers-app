import React from 'react';
import { useLockers } from '../context/LockerContext';
import { useNavigate } from 'react-router-dom';
import LockerCard from './LockerCard';
import './PublicPanel.css';

const PublicPanel = () => {
    const { lockers } = useLockers();
    const navigate = useNavigate();

    return (
        <div className="public-panel">
            <button
                className="admin-access-btn"
                onClick={() => navigate('/login')}
                title="Acceso Administrador"
            >
                🔒
            </button>
            <div className="locker-grid">
                {lockers.map(locker => (
                    <LockerCard key={locker.id} locker={locker} />
                ))}
            </div>
        </div>
    );
};

export default PublicPanel;
