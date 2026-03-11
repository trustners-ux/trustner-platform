import { useState, useEffect, useRef } from 'react'
import { Search, X, User, Loader2 } from 'lucide-react'
import pospAPI from '../../services/posp'

/**
 * POSP Selector - Searchable dropdown for selecting POSP agents
 * Shows results as [CODE] - Name (City)
 * Supports debounced search, loading state, and clearing
 */
export default function POSPSelector({ value, onChange, disabled = false, className = '' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPosp, setSelectedPosp] = useState(null)
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Set initial selected POSP from value prop
  useEffect(() => {
    if (value && value.pospName) {
      setSelectedPosp({
        agentCode: value.pospCode || '',
        fullName: value.pospName,
        id: value.pospId || '',
      })
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 1) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await pospAPI.search(query, 20)
        const data = Array.isArray(res) ? res : (res?.data || [])
        setResults(data)
      } catch (err) {
        console.error('POSP search failed:', err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = (posp) => {
    const fullName = `${posp.firstName} ${posp.lastName}`.trim()
    setSelectedPosp({
      id: posp.id,
      agentCode: posp.agentCode,
      fullName,
    })
    setQuery('')
    setIsOpen(false)
    onChange?.({
      pospId: posp.id,
      pospCode: posp.agentCode,
      pospName: fullName,
    })
  }

  const handleClear = () => {
    setSelectedPosp(null)
    setQuery('')
    onChange?.({
      pospId: '',
      pospCode: '',
      pospName: '',
    })
  }

  if (disabled) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 text-sm ${className}`}>
        POSP selector disabled (DST mode)
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {selectedPosp ? (
        <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-800">
              [{selectedPosp.agentCode}] - {selectedPosp.fullName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-teal-500 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => query.length >= 1 && setIsOpen(true)}
            placeholder="Search POSP by name or code..."
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && !selectedPosp && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {query.length < 1 ? 'Type to search...' : 'No POSPs found'}
            </div>
          ) : (
            results.map((posp) => (
              <button
                key={posp.id}
                type="button"
                onClick={() => handleSelect(posp)}
                className="w-full text-left px-4 py-2.5 hover:bg-teal-50 text-sm border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  [{posp.agentCode}] - {posp.firstName} {posp.lastName}
                </div>
                {posp.city && (
                  <div className="text-xs text-gray-500 mt-0.5">{posp.city}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
