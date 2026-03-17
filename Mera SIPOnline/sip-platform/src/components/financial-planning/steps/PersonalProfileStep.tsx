'use client';

import { useMemo } from 'react';
import { User, UserRound, Users, MapPin, Home } from 'lucide-react';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';
import SelectInput from '@/components/financial-planning/inputs/SelectInput';
import { INDIA_STATES, TIER_DEFINITIONS } from '@/lib/constants/india-locations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonalProfileData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  dependents: number;
  spouseAge: number | null;
  childrenAges: number[];
  state: string;
  city: string;
  cityTier: string;
  otherCity: string;
  pincode: string;
  residentialStatus: string;
}

interface Props {
  data: PersonalProfileData;
  onUpdate: (updates: Partial<PersonalProfileData>) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: <UserRound className="w-5 h-5" /> },
  { value: 'female', label: 'Female', icon: <User className="w-5 h-5" /> },
  { value: 'other', label: 'Other', icon: <Users className="w-5 h-5" /> },
];

const MARITAL_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

const RESIDENTIAL_OPTIONS = [
  {
    value: 'own',
    label: 'Own Home',
    description: 'Fully owned or home loan running',
  },
  {
    value: 'rent',
    label: 'Rented',
    description: 'Paying monthly rent',
  },
  {
    value: 'family',
    label: 'Living with Family',
    description: 'No separate housing cost',
  },
];

// Build state options for dropdown
const STATE_OPTIONS = INDIA_STATES.map((s) => ({
  value: s.value,
  label: s.label,
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PersonalProfileStep({ data, onUpdate }: Props) {
  const isMarried = data.maritalStatus === 'married';
  const hasDependents = data.dependents > 0;

  // Today's date string for the date max attribute
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Get cities for selected state
  const selectedState = useMemo(
    () => INDIA_STATES.find((s) => s.value === data.state),
    [data.state]
  );

  const cityOptions = useMemo(() => {
    if (!selectedState) return [];
    const cities = selectedState.cities.map((c) => ({
      value: c.value,
      label: c.label,
    }));
    if (cities.length > 0) {
      cities.push({ value: 'other', label: 'Other (not listed)' });
    }
    return cities;
  }, [selectedState]);

  const isOtherCity = data.city === 'other';
  const isNRI = data.state === 'NRI';

  // ---- Handlers ----

  const handleStateChange = (stateVal: string) => {
    // Reset city when state changes, auto-set tier for NRI
    if (stateVal === 'NRI') {
      onUpdate({ state: stateVal, city: '', cityTier: 'metro', otherCity: '', pincode: '' });
    } else {
      onUpdate({ state: stateVal, city: '', cityTier: '', otherCity: '', pincode: '' });
    }
  };

  const handleCityChange = (cityVal: string) => {
    if (cityVal === 'other') {
      onUpdate({ city: 'other', cityTier: 'tier3', otherCity: '', pincode: '' });
    } else if (selectedState) {
      const cityEntry = selectedState.cities.find((c) => c.value === cityVal);
      onUpdate({
        city: cityVal,
        cityTier: cityEntry?.tier || 'tier3',
        otherCity: '',
        pincode: '',
      });
    }
  };

  // ---- Handlers for children ages ----
  const addChild = () => {
    onUpdate({ childrenAges: [...data.childrenAges, 0] });
  };

  const removeChild = (index: number) => {
    const updated = data.childrenAges.filter((_, i) => i !== index);
    onUpdate({ childrenAges: updated });
  };

  const updateChildAge = (index: number, age: number) => {
    const updated = [...data.childrenAges];
    updated[index] = age;
    onUpdate({ childrenAges: updated });
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- */}
      {/* Section: Identity */}
      {/* ---------------------------------------------------------- */}
      <div className="flex items-center gap-2 mb-1">
        <User className="w-4 h-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
          Basic Details
        </h3>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
          Full Name <span className="text-negative ml-0.5">*</span>
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => onUpdate({ fullName: e.target.value })}
          placeholder="Enter your full name"
          className={INPUT_CLASS}
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
          Date of Birth <span className="text-negative ml-0.5">*</span>
        </label>
        <input
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
          max={today}
          className={INPUT_CLASS}
        />
      </div>

      {/* Gender */}
      <RadioCards
        label="Gender"
        value={data.gender}
        onChange={(val) => onUpdate({ gender: val })}
        options={GENDER_OPTIONS}
        columns={3}
      />

      {/* Marital Status */}
      <RadioCards
        label="Marital Status"
        value={data.maritalStatus}
        onChange={(val) => onUpdate({ maritalStatus: val })}
        options={MARITAL_OPTIONS}
        columns={4}
      />

      {/* ------ Conditional: Married fields ------ */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isMarried
            ? 'max-h-[200px] opacity-100'
            : 'max-h-0 opacity-0'
        }`}
      >
        {isMarried && (
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Spouse&apos;s Age
            </label>
            <input
              type="number"
              value={data.spouseAge ?? ''}
              onChange={(e) =>
                onUpdate({
                  spouseAge: e.target.value ? Number(e.target.value) : null,
                })
              }
              min={18}
              max={100}
              placeholder="e.g. 32"
              className={INPUT_CLASS}
            />
          </div>
        )}
      </div>

      {/* Number of Dependents — show if married OR if dependents already > 0 */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isMarried || hasDependents
            ? 'max-h-[200px] opacity-100'
            : 'max-h-0 opacity-0'
        }`}
      >
        {(isMarried || hasDependents) && (
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Number of Dependents
            </label>
            <input
              type="number"
              value={data.dependents}
              onChange={(e) => {
                const val = Math.min(10, Math.max(0, Number(e.target.value)));
                onUpdate({ dependents: val });
              }}
              min={0}
              max={10}
              placeholder="0"
              className={INPUT_CLASS}
            />
            <p className="text-xs text-slate-400 mt-1">
              Include children, elderly parents, or anyone financially dependent on you.
            </p>
          </div>
        )}
      </div>

      {/* ------ Conditional: Children Ages (dynamic list) ------ */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          hasDependents
            ? 'max-h-[600px] opacity-100'
            : 'max-h-0 opacity-0'
        }`}
      >
        {hasDependents && (
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Children&apos;s Ages
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Add each child&apos;s current age (if applicable).
            </p>

            <div className="space-y-2">
              {data.childrenAges.map((age, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16 shrink-0">
                    Child {index + 1}
                  </span>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) =>
                      updateChildAge(index, Math.max(0, Number(e.target.value)))
                    }
                    min={0}
                    max={30}
                    placeholder="Age"
                    className={`${INPUT_CLASS} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeChild(index)}
                    className="text-negative/70 hover:text-negative text-xs font-medium px-2 py-1 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addChild}
              className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1"
            >
              <span className="text-lg leading-none">+</span> Add Child
            </button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Section: Location */}
      {/* ---------------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Location
          </h3>
        </div>

        {/* State */}
        <div className="mb-5">
          <SelectInput
            label="State / UT"
            value={data.state}
            onChange={handleStateChange}
            options={STATE_OPTIONS}
            placeholder="Select your state"
            required
          />
        </div>

        {/* City — only show if state is selected and has cities */}
        {data.state && !isNRI && cityOptions.length > 0 && (
          <div className="mb-5">
            <SelectInput
              label="City"
              value={data.city}
              onChange={handleCityChange}
              options={cityOptions}
              placeholder="Select your city"
              required
            />
          </div>
        )}

        {/* Other City — show when "Other" is selected or NRI */}
        {(isOtherCity || isNRI) && (
          <div className="mb-5 space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                {isNRI ? 'Current City / Country' : 'Enter your city / town name'} <span className="text-negative ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={data.otherCity}
                onChange={(e) => onUpdate({ otherCity: e.target.value })}
                placeholder={isNRI ? 'e.g. Dubai, UAE' : 'e.g. Sivasagar, Tinsukia'}
                className={INPUT_CLASS}
              />
            </div>
            {!isNRI && (
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  value={data.pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    onUpdate({ pincode: val });
                  }}
                  placeholder="e.g. 781001"
                  maxLength={6}
                  inputMode="numeric"
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>
        )}

        {/* City Tier — auto-set but allow override */}
        {data.cityTier && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-semibold text-slate-600">City Tier</span>
              <span className="text-[11px] text-slate-400">(auto-detected, you can change if needed)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['metro', 'tier1', 'tier2', 'tier3'] as const).map((tier) => {
                const def = TIER_DEFINITIONS[tier];
                const isActive = data.cityTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onUpdate({ cityTier: tier })}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? 'border-brand bg-brand/5 shadow-sm'
                        : 'border-surface-200 hover:border-surface-300 bg-white'
                    }`}
                  >
                    <div className={`text-xs font-bold ${isActive ? 'text-brand' : 'text-slate-700'}`}>
                      {def.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {def.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Section: Housing */}
      {/* ---------------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Housing
          </h3>
        </div>

        <RadioCards
          label="Residential Status"
          value={data.residentialStatus}
          onChange={(val) => onUpdate({ residentialStatus: val })}
          options={RESIDENTIAL_OPTIONS}
          columns={3}
        />
      </div>
    </div>
  );
}
