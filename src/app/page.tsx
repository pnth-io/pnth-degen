'use client';

import { TokenSectionSkeleton } from '@/components/skeleton';
import PulseHeader from '@/features/pulse/components/PulseHeader';
import TokenSection from '@/features/pulse/components/TokenSection';
import { PulseStreamProvider, usePulseStreamContext } from '@/features/pulse/context/PulseStreamContext';
import { usePulseDisplayStore } from '@/features/pulse/store/usePulseDisplayStore';

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

const PulsePageView = () => {
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
      {/* Header */}
      <div className="px-4 pt-3 pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-textPrimary">Pulse</h1>
          <PulseHeader />
        </div>
        
        {/* Border line */}
        <div className="border-b border-borderDefault -mx-4 mt-3" />
      </div>
      
      {/* Content */}
      <PulseView />
    </div>
  );
};

const HomePage = () => (
  <PulseStreamProvider>
    <PulsePageView />
  </PulseStreamProvider>
);

export default HomePage;
