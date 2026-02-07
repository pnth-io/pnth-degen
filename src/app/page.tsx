'use client';

import Garden from '@/features/garden/components/Garden';
import { PulseStreamProvider, usePulseStreamContext } from '@/features/pulse/context/PulseStreamContext';

const GardenPageView = () => {
  const { error } = usePulseStreamContext();

  if (error) {
    console.error('Garden error:', error);
    return (
      <div className="p-4 text-success">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <div className="bg-transparent h-full">
      <Garden />
    </div>
  );
};

const HomePage = () => (
  <PulseStreamProvider>
    <GardenPageView />
  </PulseStreamProvider>
);

export default HomePage;
