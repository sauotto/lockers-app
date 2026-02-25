import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const LockerContext = createContext();

export const useLockers = () => useContext(LockerContext);

export const LockerProvider = ({ children }) => {
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial Fetch
  useEffect(() => {
    fetchLockers();
  }, []);

  const fetchLockers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lockers')
        .select('*')
        .order('number', { ascending: true });

      if (error) throw error;

      const formattedData = data.map(l => ({
        ...l,
        hasKey: l.has_key
      }));
      setLockers(formattedData);
    } catch (error) {
      console.error('Error fetching lockers:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('lockers_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lockers',
        },
        (payload) => {
          console.log('Realtime change received!', payload);
          if (payload.eventType === 'UPDATE') {
            setLockers(prevLockers => prevLockers.map(locker =>
              locker.id === payload.new.id ? { ...payload.new, hasKey: payload.new.has_key } : locker
            ));
          } else if (payload.eventType === 'INSERT') {
            setLockers(prevLockers => [...prevLockers, { ...payload.new, hasKey: payload.new.has_key }].sort((a, b) => a.number - b.number));
          } else if (payload.eventType === 'DELETE') {
            setLockers(prevLockers =>
              prevLockers.filter(locker => locker.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateLocker = async (id, updates) => {
    try {
      setLockers(prev => prev.map(locker =>
        locker.id === id ? { ...locker, ...updates } : locker
      ));

      const dbUpdates = { ...updates };
      if ('hasKey' in updates) {
        dbUpdates.has_key = updates.hasKey;
        delete dbUpdates.hasKey;
      }

      const { error } = await supabase
        .from('lockers')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

    } catch (error) {
      console.error('Error updating locker:', error.message);
      fetchLockers();
    }
  };

  const addLocker = async () => {
    try {
      // Consultar el máximo number directamente desde la DB para evitar duplicados
      const { data: maxData, error: maxError } = await supabase
        .from('lockers')
        .select('number')
        .order('number', { ascending: false })
        .limit(1)
        .single();

      const nextNumber = maxError ? (lockers.length + 1) : (maxData.number + 1);

      const { error } = await supabase
        .from('lockers')
        .insert([{
          number: nextNumber,
          status: 'Available',
          name: '',
          type: 'Line',
          has_key: false,
        }]);

      if (error) throw error;

      // Realtime handles UI update; fallback re-fetch just in case
      await fetchLockers();
    } catch (error) {
      console.error('Error adding locker:', error.message);
      await fetchLockers();
    }
  };

  const removeLocker = async (id) => {
    try {
      console.log('Removing locker with id:', id);

      // Optimistic removal
      setLockers(prev => prev.filter(l => l.id !== id));

      const { data, error, count } = await supabase
        .from('lockers')
        .delete()
        .eq('id', id)
        .select();

      console.log('Delete result:', { data, error, count });

      if (error) throw error;

      // If delete returned no rows, RLS might be blocking it
      if (!data || data.length === 0) {
        console.warn('Delete returned no rows — RLS might be blocking. Re-fetching...');
      }

      await fetchLockers();
    } catch (error) {
      console.error('Error removing locker:', error.message);
      await fetchLockers();
    }
  };

  const getStats = () => {
    const total = lockers.length;
    const occupied = lockers.filter(l => l.status === 'Occupied').length;
    const available = total - occupied;

    // KPIs por tipo de colaborador (solo los ocupados)
    const occupiedLockers = lockers.filter(l => l.status === 'Occupied');
    const byLine = occupiedLockers.filter(l => l.type === 'Line').length;
    const byLeader = occupiedLockers.filter(l => l.type === 'Leader').length;
    const byExternal = occupiedLockers.filter(l => l.type === 'External').length;

    const pctLine = occupied > 0 ? Math.round((byLine / occupied) * 100) : 0;
    const pctLeader = occupied > 0 ? Math.round((byLeader / occupied) * 100) : 0;
    const pctExternal = occupied > 0 ? Math.round((byExternal / occupied) * 100) : 0;

    return {
      total, occupied, available,
      byLine, byLeader, byExternal,
      pctLine, pctLeader, pctExternal,
    };
  };

  return (
    <LockerContext.Provider value={{ lockers, updateLocker, addLocker, removeLocker, getStats, loading }}>
      {!loading ? children : <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Cargando lockers...</div>}
    </LockerContext.Provider>
  );
};
