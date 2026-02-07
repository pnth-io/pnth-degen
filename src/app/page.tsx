'use client';

import { TokenSectionSkeleton } from '@/components/skeleton';
import TokenSection from '@/features/pulse/components/TokenSection';
import { PulseStreamProvider, usePulseStreamContext } from '@/features/pulse/context/PulseStreamContext';
import { usePulseDisplayStore } from '@/features/pulse/store/usePulseDisplayStore';

const PulseView = () => {
  const { compactTables } = usePulseDisplayStore();
  const { loading } = usePulseStreamContext();

  return (
    <div
      className={`px-4 md:grid md:grid-cols-3 md:grid-rows-[1fr] p-0 flex-1 pt-2 pb-2 min-h-0 ${
        compactTables ? 'gap-3 p-2' : 'gap-0'
      }`}
    >
      {loading ? (
        <>
          {/* NEW PAIRS SECTION SKELETON */}
          <div
            className={`overflow-hidden h-full ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-t border-x-[1px] border-b'
            }`}
          >
            <TokenSectionSkeleton title="New Pairs" />
          </div>

          {/* FINAL STRETCH SECTION SKELETON */}
          <div
            className={`overflow-hidden h-full ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-t border-r border-b'
            }`}
          >
            <TokenSectionSkeleton title="Final Stretch" />
          </div>

          {/* MIGRATED SECTION SKELETON */}
          <div
            className={`overflow-hidden h-full ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-t border-r border-b'
            }`}
          >
            <TokenSectionSkeleton title="Migrated" />
          </div>
        </>
      ) : (
        <>
          {/* NEW PAIRS SECTION */}
          <div
            className={`overflow-hidden h-full ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-t border-x-[1px] border-b'
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
            className={`overflow-hidden h-full ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-t border-r border-b'
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
            className={`overflow-hidden h-full ${
              compactTables
                ? 'pnth-card'
                : 'pnth-table-container border-t border-r border-b'
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
    <div className="bg-transparent flex flex-col flex-1 h-full">
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
