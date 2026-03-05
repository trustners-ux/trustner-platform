import React, { useEffect, useState } from 'react';
import { Search, ExternalLink, TrendingUp, AlertCircle, X } from 'lucide-react';
import { formatCurrency, formatIndianNumber } from '../../utils/formatters';
import api from '../../services/api';

const FundExplorer = () => {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFunds, setSelectedFunds] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const categories = ['All', 'Equity', 'Debt', 'Hybrid', 'ELSS', 'Index'];

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/funds', {
        params: {
          limit: 50,
        },
      });
      setFunds(res.data.funds || []);
    } catch (err) {
      setError('Failed to load funds. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFunds = funds.filter((fund) => {
    const matchesSearch =
      !searchQuery ||
      fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fund.amc.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || fund.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleFundSelection = (fund) => {
    const isSelected = selectedFunds.some((f) => f.id === fund.id);
    if (isSelected) {
      setSelectedFunds(selectedFunds.filter((f) => f.id !== fund.id));
    } else if (selectedFunds.length < 3) {
      setSelectedFunds([...selectedFunds, fund]);
    }
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
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading mutual funds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fund Explorer</h1>
        <p className="text-gray-600 mt-2">Compare mutual fund schemes and start investing</p>
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by fund name, AMC, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Chips */}
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

        {/* Comparison Section */}
        {selectedFunds.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedFunds.length} fund{selectedFunds.length !== 1 ? 's' : ''} selected for comparison
                </span>
                <div className="flex gap-2">
                  {selectedFunds.map((fund) => (
                    <span
                      key={fund.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {fund.name}
                      <button
                        onClick={() => toggleFundSelection(fund)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowComparison(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Compare
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Funds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFunds.length > 0 ? (
          filteredFunds.map((fund) => (
            <div key={fund.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{fund.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{fund.amc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedFunds.some((f) => f.id === fund.id)}
                  onChange={() => toggleFundSelection(fund)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              {/* Category and Risk */}
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {fund.category}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(fund.risk)}`}>
                  {fund.risk} Risk
                </span>
              </div>

              {/* Returns */}
              <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">1Y Return</p>
                  <p className={`text-sm font-bold mt-1 ${getReturnColor(fund.return1Y)}`}>
                    {fund.return1Y}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">3Y Return</p>
                  <p className={`text-sm font-bold mt-1 ${getReturnColor(fund.return3Y)}`}>
                    {fund.return3Y}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">5Y Return</p>
                  <p className={`text-sm font-bold mt-1 ${getReturnColor(fund.return5Y)}`}>
                    {fund.return5Y}%
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">AUM</span>
                  <span className="text-xs font-medium text-gray-900">{formatCurrency(fund.aum)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Expense Ratio</span>
                  <span className="text-xs font-medium text-gray-900">{fund.expenseRatio}%</span>
                </div>
              </div>

              {/* Action Button */}
              <a
                href={`https://investwell.example.com/fund/${fund.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Invest via InvestWell <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No funds found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparison && selectedFunds.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Compare Funds</h2>
              <button
                onClick={() => setShowComparison(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Metric</th>
                      {selectedFunds.map((fund) => (
                        <th key={fund.id} className="px-4 py-3 text-left font-medium text-gray-900">
                          <div className="font-bold text-xs line-clamp-2">{fund.name}</div>
                          <div className="text-gray-600">{fund.amc}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">Category</td>
                      {selectedFunds.map((fund) => (
                        <td key={fund.id} className="px-4 py-3 text-gray-600">
                          {fund.category}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">Risk</td>
                      {selectedFunds.map((fund) => (
                        <td key={fund.id} className="px-4 py-3 text-gray-600">
                          {fund.risk}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">1Y Return</td>
                      {selectedFunds.map((fund) => (
                        <td key={fund.id} className={`px-4 py-3 font-medium ${getReturnColor(fund.return1Y)}`}>
                          {fund.return1Y}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">3Y Return</td>
                      {selectedFunds.map((fund) => (
                        <td key={fund.id} className={`px-4 py-3 font-medium ${getReturnColor(fund.return3Y)}`}>
                          {fund.return3Y}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">5Y Return</td>
                      {selectedFunds.map((fund) => (
                        <td key={fund.id} className={`px-4 py-3 font-medium ${getReturnColor(fund.return5Y)}`}>
                          {fund.return5Y}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">AUM</td>
                      {selectedFunds.map((fund) => (
                        <td key={fund.id} className="px-4 py-3 text-gray-600">
                          {formatCurrency(fund.aum)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">Expense Ratio</td>
                      {selectedFunds.map((fund) => (
                        <td key={fund.id} className="px-4 py-3 text-gray-600">
                          {fund.expenseRatio}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowComparison(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
              <a
                href={`https://investwell.example.com?compare=${selectedFunds.map((f) => f.id).join(',')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                View on InvestWell <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Note */}
      <div className="text-center text-xs text-gray-500 mt-8">
        Live data synced from AMFI
      </div>
    </div>
  );
};

export default FundExplorer;
