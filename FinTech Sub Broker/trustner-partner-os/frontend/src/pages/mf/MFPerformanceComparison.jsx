import React, { useEffect, useState } from 'react';
import { ExternalLink, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';

const MFPerformanceComparison = () => {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('return5Y');
  const [sortOrder, setSortOrder] = useState('desc');

  const categories = ['All', 'Equity', 'Debt', 'Hybrid', 'ELSS', 'Index', 'Money Market'];

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/funds/performance', {
        params: {
          limit: 100,
        },
      });
      setFunds(res.data.funds || []);
    } catch (err) {
      setError('Failed to load fund performance data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedFunds = funds
    .filter((fund) => selectedCategory === 'All' || fund.category === selectedCategory)
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy.includes('return') || sortBy === 'expenseRatio') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortBy === 'aum') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getRiskColor = (risk) => {
    const riskMap = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-red-100 text-red-800',
    };
    return riskMap[risk] || 'bg-gray-100 text-gray-800';
  };

  const getReturnColor = (value) => {
    return value >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mutual Fund Performance Comparison</h1>
        <p className="text-gray-600 mt-2">Compare top-performing funds across different categories</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Fund Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Category</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Risk</th>
                <th
                  className="px-6 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('return1Y')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>1Y Return</span>
                    <SortIcon column="return1Y" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('return3Y')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>3Y Return</span>
                    <SortIcon column="return3Y" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('return5Y')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>5Y Return</span>
                    <SortIcon column="return5Y" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('expenseRatio')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>Expense Ratio</span>
                    <SortIcon column="expenseRatio" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('aum')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>AUM</span>
                    <SortIcon column="aum" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center font-medium text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFunds.length > 0 ? (
                filteredAndSortedFunds.map((fund, idx) => (
                  <tr
                    key={fund.id}
                    className={`border-t border-gray-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{fund.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{fund.amc}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{fund.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(fund.risk)}`}>
                        {fund.risk}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right ${getReturnColor(fund.return1Y)}`}>
                      {fund.return1Y}%
                    </td>
                    <td className={`px-6 py-4 text-right ${getReturnColor(fund.return3Y)}`}>
                      {fund.return3Y}%
                    </td>
                    <td className={`px-6 py-4 text-right ${getReturnColor(fund.return5Y)}`}>
                      {fund.return5Y}%
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">{fund.expenseRatio}%</td>
                    <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(fund.aum)}</td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`https://investwell.example.com/fund/${fund.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded font-medium text-xs transition-colors"
                      >
                        Invest <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No funds found in this category
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-2">Note:</p>
        <ul className="space-y-1">
          <li>Returns are annualized and computed as on the selected date.</li>
          <li>Expense Ratio is the percentage of fund assets used for running the fund.</li>
          <li>AUM (Assets Under Management) reflects the total value of fund assets.</li>
          <li>Past performance is not indicative of future results.</li>
        </ul>
      </div>
    </div>
  );
};

export default MFPerformanceComparison;
