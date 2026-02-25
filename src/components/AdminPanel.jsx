import React, { useState } from 'react';
import { useLockers } from '../context/LockerContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './AdminPanel.css';

const COLUMNAS = 7;

const AdminPanel = () => {
    const { lockers, updateLocker, addLocker, removeLocker, getStats } = useLockers();
    const [selectedLockerId, setSelectedLockerId] = useState(null);
    const [working, setWorking] = useState(false);
    const navigate = useNavigate();

    const stats = getStats();
    const selectedLocker = lockers.find(l => l.id === selectedLockerId);

    const handleUpdate = (field, value) => {
        if (!selectedLockerId) return;
        updateLocker(selectedLockerId, { [field]: value });
    };

    const handleAdd = async () => {
        if (working) return;
        setWorking(true);
        await addLocker();
        setWorking(false);
    };

    const handleRemove = async () => {
        if (working || lockers.length === 0) return;
        setWorking(true);
        const lastLocker = lockers[lockers.length - 1];
        if (selectedLockerId === lastLocker.id) setSelectedLockerId(null);
        await removeLocker(lastLocker.id);
        setWorking(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const closeModal = () => setSelectedLockerId(null);

    return (
        <div className="admin-panel container">
            {/* ── Header ── */}
            <div className="admin-header">
                <h1 className="title">Panel de Administración</h1>
                <button className="logout-btn" onClick={handleLogout} title="Cerrar Sesión">
                    Salir ↗
                </button>
            </div>

            {/* ── Estadísticas + Gestión ── */}
            <div className="store-stats">
                <div className="stat-card">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="stat-card occupied">
                    <span className="stat-value">{stats.occupied}</span>
                    <span className="stat-label">Ocupados</span>
                </div>
                <div className="stat-card available">
                    <span className="stat-value">{stats.available}</span>
                    <span className="stat-label">Disponibles</span>
                </div>

                <div className="locker-controls">
                    <button
                        className="control-btn remove-btn"
                        onClick={handleRemove}
                        disabled={working || lockers.length === 0}
                        title="Eliminar último locker"
                    >
                        −
                    </button>
                    <span className="locker-count">{lockers.length}</span>
                    <button
                        className="control-btn add-btn"
                        onClick={handleAdd}
                        disabled={working}
                        title="Agregar locker"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* ── KPIs por tipo de colab ── */}
            <div className="kpi-row">
                <div className="kpi-card kpi-line">
                    <span className="kpi-value">{stats.byLine}</span>
                    <span className="kpi-pct">{stats.pctLine}%</span>
                    <span className="kpi-label">Col. de Línea</span>
                </div>
                <div className="kpi-card kpi-leader">
                    <span className="kpi-value">{stats.byLeader}</span>
                    <span className="kpi-pct">{stats.pctLeader}%</span>
                    <span className="kpi-label">Líder de Área</span>
                </div>
                <div className="kpi-card kpi-external">
                    <span className="kpi-value">{stats.byExternal}</span>
                    <span className="kpi-pct">{stats.pctExternal}%</span>
                    <span className="kpi-label">Externo</span>
                </div>
            </div>

            {/* ── Grid de lockers ── */}
            <div className="locker-list card">
                <h3>Toca un locker para editarlo</h3>
                <div
                    className="list-grid"
                    style={{ gridTemplateColumns: `repeat(${COLUMNAS}, 1fr)` }}
                >
                    {lockers.map(locker => (
                        <button
                            key={locker.id}
                            className={`list-item ${locker.status.toLowerCase()}`}
                            onClick={() => setSelectedLockerId(locker.id)}
                        >
                            {locker.number}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Modal de edición ── */}
            {selectedLocker && (
                <div className="edit-overlay" onClick={closeModal}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Locker {selectedLocker.number}</h2>
                            <button className="close-modal-btn" onClick={closeModal}>
                                ← Regresar
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre del Ocupante</label>
                                <input
                                    type="text"
                                    value={selectedLocker.name}
                                    onChange={(e) => handleUpdate('name', e.target.value)}
                                    placeholder="Ingresa el nombre"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo de Colaborador</label>
                                <select
                                    value={selectedLocker.type}
                                    onChange={(e) => handleUpdate('type', e.target.value)}
                                >
                                    <option value="Line">Colaborador de Línea</option>
                                    <option value="Leader">Líder de Área</option>
                                    <option value="External">Externo</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Estado</label>
                                <div className="radio-group">
                                    <label className={`radio-label available ${selectedLocker.status === 'Available' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={selectedLocker.status === 'Available'}
                                            onChange={() => handleUpdate('status', 'Available')}
                                        />
                                        Disponible
                                    </label>
                                    <label className={`radio-label occupied ${selectedLocker.status === 'Occupied' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={selectedLocker.status === 'Occupied'}
                                            onChange={() => handleUpdate('status', 'Occupied')}
                                        />
                                        Ocupado
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Estado de Llave</label>
                                <div className="toggle-switch">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={selectedLocker.hasKey}
                                            onChange={(e) => handleUpdate('hasKey', e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span>{selectedLocker.hasKey ? 'Tiene Llave' : 'Sin Llave'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
