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

      // Transform keys if necessary (snake_case from DB to camelCase for frontend if needed)
      // Our DB schema uses snake_case for `has_key` but frontend uses `hasKey`.
      // Let's map it.
      const formattedData = data.map(l => ({
        ...l,
        hasKey: l.has_key // map has_key to hasKey
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
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'lockers',
        },
        (payload) => {
          console.log('Realtime change received!', payload);
          // Handle different event types
          if (payload.eventType === 'UPDATE') {
            setLockers(prevLockers => prevLockers.map(locker =>
              locker.id === payload.new.id ? { ...payload.new, hasKey: payload.new.has_key } : locker
            ));
          } else if (payload.eventType === 'INSERT') {
            setLockers(prevLockers => [...prevLockers, { ...payload.new, hasKey: payload.new.has_key }].sort((a, b) => a.number - b.number));
          }
          else if (payload.eventType === 'DELETE') {
            setLockers(prevLockers =>
              prevLockers.filter(locker => locker.id !== payload.old.id)
            );

          }



          // Re-fetch strictly to ensure consistency if complex logic
          // fetchLockers(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateLocker = async (id, updates) => {
    try {
      // Optimistic update (optional, but good for UX)
      setLockers(prev => prev.map(locker =>
        locker.id === id ? { ...locker, ...updates } : locker
      ));

      // Prepare payload for DB
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
      // Revert on error would go here
      fetchLockers(); // Re-sync to be safe
    }
  };

  const getStats = () => {
    const total = lockers.length;
    const occupied = lockers.filter(l => l.status === 'Occupied').length;
    const available = total - occupied;
    return { total, occupied, available };
  };

  return (
    <LockerContext.Provider value={{ lockers, updateLocker, getStats, loading }}>
      {!loading ? children : <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Lockers...</div>}
    </LockerContext.Provider>
  );
};
