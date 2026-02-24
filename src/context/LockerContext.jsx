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
      const maxNumber = lockers.length > 0 ? Math.max(...lockers.map(l => l.number)) : 0;
      const newNumber = maxNumber + 1;

      const { data, error } = await supabase
        .from('lockers')
        .insert([{
          number: newNumber,
          status: 'Available',
          name: '',
          type: 'Line',
          has_key: false,
        }])
        .select()
        .single();

      if (error) throw error;

      // Realtime will handle the UI update via subscription
    } catch (error) {
      console.error('Error adding locker:', error.message);
      fetchLockers();
    }
  };

  const removeLocker = async (id) => {
    try {
      const { error } = await supabase
        .from('lockers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Realtime will handle the UI update via subscription
    } catch (error) {
      console.error('Error removing locker:', error.message);
      fetchLockers();
    }
  };

  const getStats = () => {
    const total = lockers.length;
    const occupied = lockers.filter(l => l.status === 'Occupied').length;
    const available = total - occupied;
    return { total, occupied, available };
  };

  return (
    <LockerContext.Provider value={{ lockers, updateLocker, addLocker, removeLocker, getStats, loading }}>
      {!loading ? children : <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Cargando lockers...</div>}
    </LockerContext.Provider>
  );
};
