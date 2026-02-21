import React, { useState } from 'react';
import { useLockers } from '../context/LockerContext';
import './AdminPanel.css';

const AdminPanel = () => {
    const { lockers, updateLocker, getStats } = useLockers();
    const [selectedLockerId, setSelectedLockerId] = useState(null);

    const stats = getStats();
    const selectedLocker = lockers.find(l => l.id === selectedLockerId);

    const handleUpdate = (field, value) => {
        if (!selectedLockerId) return;
        updateLocker(selectedLockerId, { [field]: value });
    };

    return (
        <div className="admin-panel container">
            <h1 className="title">Locker Admin Dashboard</h1>

            <div className="store-stats">
                <div className="stat-card">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="stat-card occupied">
                    <span className="stat-value">{stats.occupied}</span>
                    <span className="stat-label">Occupied</span>
                </div>
                <div className="stat-card available">
                    <span className="stat-value">{stats.available}</span>
                    <span className="stat-label">Available</span>
                </div>
            </div>

            <div className="admin-content">
                <div className="locker-list">
                    <h3>Select Locker</h3>
                    <div className="list-grid">
                        {lockers.map(locker => (
                            <button
                                key={locker.id}
                                className={`list-item ${selectedLockerId === locker.id ? 'active' : ''} ${locker.status.toLowerCase()}`}
                                onClick={() => setSelectedLockerId(locker.id)}
                            >
                                {locker.number}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="edit-panel">
                    {selectedLocker ? (
                        <div className="edit-form card">
                            <h2>Editing Locker {selectedLocker.number}</h2>

                            <div className="form-group">
                                <label>Occupant Name</label>
                                <input
                                    type="text"
                                    value={selectedLocker.name}
                                    onChange={(e) => handleUpdate('name', e.target.value)}
                                    placeholder="Enter Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Collaborator Type</label>
                                <select
                                    value={selectedLocker.type}
                                    onChange={(e) => handleUpdate('type', e.target.value)}
                                >
                                    <option value="Line">Line Collaborator</option>
                                    <option value="Leader">Area Leader</option>
                                    <option value="External">External</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <div className="radio-group">
                                    <label className={`radio-label available ${selectedLocker.status === 'Available' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={selectedLocker.status === 'Available'}
                                            onChange={() => handleUpdate('status', 'Available')}
                                        />
                                        Available
                                    </label>
                                    <label className={`radio-label occupied ${selectedLocker.status === 'Occupied' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={selectedLocker.status === 'Occupied'}
                                            onChange={() => handleUpdate('status', 'Occupied')}
                                        />
                                        Occupied
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Key Status</label>
                                <div className="toggle-switch">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={selectedLocker.hasKey}
                                            onChange={(e) => handleUpdate('hasKey', e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span>{selectedLocker.hasKey ? 'Has Key' : 'No Key'}</span>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="no-selection card">
                            <p>Select a locker to edit details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
