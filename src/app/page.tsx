'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TokenSectionSkeleton } from '@/components/skeleton';
import PulseHeader from '@/features/pulse/components/PulseHeader';
import TokenSection from '@/features/pulse/components/TokenSection';
import { PulseStreamProvider, usePulseStreamContext } from '@/features/pulse/context/PulseStreamContext';
import { usePulseDisplayStore } from '@/features/pulse/store/usePulseDisplayStore';

// Dynamically import TokenMap to avoid SSR issues
const TokenMap = dynamic(() => import('@/components/TokenMap'), { 
  ssr: false,
  loading: () => (
    <div className="pnth-card w-full h-[calc(100vh-280px)] min-h-[500px] bg-bgPrimary flex items-center justify-center">
      <div className="text-center text-textTertiary">
        <div className="w-8 h-8 border-2 border-success/30 border-t-success rounded-full animate-spin mx-auto mb-2" />
        <div className="text-sm">Loading map...</div>
      </div>
    </div>
  ),
});

type TabType = 'pulse' | 'map';

const TabButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`pnth-tab ${active ? 'pnth-tab-active' : 'pnth-tab-inactive'}`}
  >
    {children}
  </button>
);

const PulseView = () => {
  const { compactTables } = usePulseDisplayStore();
  const { loading } = usePulseStreamContext();

  return (
    <div
      className={`px-4 md:grid md:grid-cols-3 p-0 min-h-[calc(100vh-200px)] py-2 ${
        compactTables ? 'gap-3 p-2' : 'gap-0'
      }`}
    >
      {loading ? (
        <>
          {/* NEW PAIRS SECTION SKELETON */}
          <div
            className={`overflow-hidden ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-x-[1px] border-b'
            }`}
          >
            <TokenSectionSkeleton title="New Pairs" />
          </div>

          {/* FINAL STRETCH SECTION SKELETON */}
          <div
            className={`overflow-hidden ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-r border-b'
            }`}
          >
            <TokenSectionSkeleton title="Final Stretch" />
          </div>

          {/* MIGRATED SECTION SKELETON */}
          <div
            className={`overflow-hidden ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-r border-b'
            }`}
          >
            <TokenSectionSkeleton title="Migrated" />
          </div>
        </>
      ) : (
        <>
          {/* NEW PAIRS SECTION */}
          <div
            className={`overflow-hidden ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-x-[1px] border-b'
            }`}
          >
            <TokenSection
              title="New Pairs"
              viewName="new"
              shouldBonded={true}
              showExpand={false}
            />
          </div>

          {/* FINAL STRETCH SECTION */}
          <div
            className={`overflow-hidden ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-r border-b'
            }`}
          >
            <TokenSection
              title="Final Stretch"
              viewName="bonding"
              shouldBonded={true}
              showExpand={false}
            />
          </div>

          {/* MIGRATED SECTION */}
          <div
            className={`overflow-hidden ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-r border-b'
            }`}
          >
            <TokenSection
              title="Migrated"
              viewName="bonded"
              showExpand={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

const MapView = () => {
  return (
    <div className="px-4 py-2">
      <TokenMap />
    </div>
  );
};

const PulsePageView = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pulse');
  const { error } = usePulseStreamContext();

  if (error) {
    console.error('Pulse V2 error:', error);
    return (
      <div className="p-4 text-success">
        Error loading pulse data: {error}
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      {/* Header with Tabs */}
      <div className="px-4 pt-3 pb-0">
        <div className="flex items-center justify-between">
          {/* Left side: Tabs */}
          <div className="flex items-center gap-1">
            <TabButton 
              active={activeTab === 'pulse'} 
              onClick={() => setActiveTab('pulse')}
            >
              Pulse
            </TabButton>
            <TabButton 
              active={activeTab === 'map'} 
              onClick={() => setActiveTab('map')}
            >
              Map
            </TabButton>
          </div>
          
          {/* Right side: PulseHeader controls (only show on Pulse tab) */}
          {activeTab === 'pulse' && <PulseHeader />}
        </div>
        
        {/* Tab border line */}
        <div className="border-b border-borderDefault -mx-4" />
      </div>
      
      {/* Tab Content */}
      {activeTab === 'pulse' ? <PulseView /> : <MapView />}
    </div>
  );
};

const HomePage = () => (
  <PulseStreamProvider>
    <PulsePageView />
  </PulseStreamProvider>
);

export default HomePage;
