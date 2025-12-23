// Purpose: helper for availability stored locally
import { useEffect, useState } from 'react';
import { AvailabilityMap } from '../components/AvailabilityPicker';

export function useAvailability() {
  const [data, setData] = useState<AvailabilityMap>({});
  useEffect(() => {
    const raw = localStorage.getItem('wego_availability');
    if (raw) setData(JSON.parse(raw));
  }, []);
  const save = (v: AvailabilityMap) => {
    localStorage.setItem('wego_availability', JSON.stringify(v));
    setData(v);
  };
  return { data, save, setData };
}