'use client';

export function FundCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-32" />
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-3 bg-gray-100 rounded w-12 mb-1" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FundDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-96 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border p-6 h-64" />
    </div>
  );
}
