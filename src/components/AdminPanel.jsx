import React, { useState, useMemo } from 'react';
import { useLockers } from '../context/LockerContext';
import './AdminPanel.css';

/**
 * Calcula el número óptimo de columnas para la grilla de lockers
 * para adaptarse mejor a la pantalla.
 * Prefiere divisores "naturales" (10, 9, 8, 7, 6, 5) hasta encontrar
 * uno con el menor remManente de celdas vacías.
 */
const calcColumnas = (total) => {
    if (total <= 0) return 1;
    // Intentamos columnas de mayor a menor para un layout más ancho
    const candidatos = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    for (const cols of candidatos) {
        if (total % cols === 0) return cols;
    }
    // Si no hay divisor perfecto, elegimos el que deja menos celdas vacías
    let mejorCols = 10;
    let menorResto = Infinity;
    for (const cols of candidatos) {
        const filas = Math.ceil(total / cols);
        const resto = filas * cols - total;
        if (resto < menorResto) {
            menorResto = resto;
            mejorCols = cols;
        }
    }
    return mejorCols;
};

const AdminPanel = () => {
    const { lockers, updateLocker, addLocker, removeLocker, getStats } = useLockers();
    const [selectedLockerId, setSelectedLockerId] = useState(null);
    const [showManagement, setShowManagement] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [addingLocker, setAddingLocker] = useState(false);

    const stats = getStats();
    const selectedLocker = lockers.find(l => l.id === selectedLockerId);

    const columnas = useMemo(() => calcColumnas(lockers.length), [lockers.length]);

    const handleUpdate = (field, value) => {
        if (!selectedLockerId) return;
        updateLocker(selectedLockerId, { [field]: value });
    };

    const handleAddLocker = async () => {
        setAddingLocker(true);
        await addLocker();
        setAddingLocker(false);
    };

    const handleRemoveLocker = async (id) => {
        if (removingId) return;
        setRemovingId(id);
        if (selectedLockerId === id) setSelectedLockerId(null);
        await removeLocker(id);
        setRemovingId(null);
    };

    return (
        <div className="admin-panel container">
            <h1 className="title">Panel de Administración</h1>

            {/* ── Estadísticas ── */}
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
            </div>

            {/* ── Botón de Gestión ── */}
            <div className="management-toggle">
                <button
                    className={`manage-btn ${showManagement ? 'active' : ''}`}
                    onClick={() => setShowManagement(prev => !prev)}
                >
                    ⚙ Gestionar Lockers
                </button>
            </div>

            {/* ── Panel de Gestión (agregar / eliminar) ── */}
            {showManagement && (
                <div className="management-panel card">
                    <div className="management-header">
                        <h3>Gestión de Lockers</h3>
                        <span className="locker-count-badge">{lockers.length} lockers</span>
                    </div>
                    <p className="management-hint">
                        Agrega o elimina lockers. La grilla se ajusta automáticamente.
                        Al eliminar, haz clic en el número del locker que deseas quitar.
                    </p>
                    <div className="management-actions">
                        <button
                            className="action-btn add-btn"
                            onClick={handleAddLocker}
                            disabled={addingLocker}
                        >
                            {addingLocker ? '...' : '+ Agregar Locker'}
                        </button>
                        <span className="action-hint">← Haz clic en un locker abajo para eliminarlo</span>
                    </div>
                    <div
                        className="manage-grid"
                        style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}
                    >
                        {lockers.map(locker => (
                            <button
                                key={locker.id}
                                className={`manage-item ${locker.status.toLowerCase()} ${removingId === locker.id ? 'removing' : ''}`}
                                onClick={() => handleRemoveLocker(locker.id)}
                                title={`Eliminar locker ${locker.number}`}
                            >
                                <span className="manage-number">{locker.number}</span>
                                <span className="remove-x">✕</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Contenido principal: selección + edición ── */}
            <div className="admin-content">
                {/* Lista de lockers */}
                <div className="locker-list card">
                    <h3>Seleccionar Locker</h3>
                    <div
                        className="list-grid"
                        style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}
                    >
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

                {/* Panel de edición */}
                <div className="edit-panel">
                    {selectedLocker ? (
                        <div className="edit-form card">
                            <h2>Editando Locker {selectedLocker.number}</h2>

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
                    ) : (
                        <div className="no-selection card">
                            <p>Selecciona un locker para editar sus detalles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
