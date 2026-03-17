/**
 * India States → Major Cities mapping with auto-tier classification.
 * Used in Financial Planning wizard PersonalProfileStep.
 */

export interface CityEntry {
  value: string;
  label: string;
  tier: 'metro' | 'tier1' | 'tier2' | 'tier3';
}

export interface StateEntry {
  value: string;
  label: string;
  cities: CityEntry[];
}

export const INDIA_STATES: StateEntry[] = [
  {
    value: 'AN', label: 'Andaman & Nicobar Islands',
    cities: [
      { value: 'Port Blair', label: 'Port Blair', tier: 'tier3' },
    ],
  },
  {
    value: 'AP', label: 'Andhra Pradesh',
    cities: [
      { value: 'Visakhapatnam', label: 'Visakhapatnam', tier: 'tier2' },
      { value: 'Vijayawada', label: 'Vijayawada', tier: 'tier2' },
      { value: 'Guntur', label: 'Guntur', tier: 'tier3' },
      { value: 'Nellore', label: 'Nellore', tier: 'tier3' },
      { value: 'Tirupati', label: 'Tirupati', tier: 'tier3' },
      { value: 'Rajahmundry', label: 'Rajahmundry', tier: 'tier3' },
      { value: 'Kakinada', label: 'Kakinada', tier: 'tier3' },
      { value: 'Amaravati', label: 'Amaravati', tier: 'tier3' },
    ],
  },
  {
    value: 'AR', label: 'Arunachal Pradesh',
    cities: [
      { value: 'Itanagar', label: 'Itanagar', tier: 'tier3' },
    ],
  },
  {
    value: 'AS', label: 'Assam',
    cities: [
      { value: 'Guwahati', label: 'Guwahati', tier: 'tier2' },
      { value: 'Silchar', label: 'Silchar', tier: 'tier3' },
      { value: 'Dibrugarh', label: 'Dibrugarh', tier: 'tier3' },
      { value: 'Jorhat', label: 'Jorhat', tier: 'tier3' },
      { value: 'Tezpur', label: 'Tezpur', tier: 'tier3' },
    ],
  },
  {
    value: 'BR', label: 'Bihar',
    cities: [
      { value: 'Patna', label: 'Patna', tier: 'tier2' },
      { value: 'Gaya', label: 'Gaya', tier: 'tier3' },
      { value: 'Muzaffarpur', label: 'Muzaffarpur', tier: 'tier3' },
      { value: 'Bhagalpur', label: 'Bhagalpur', tier: 'tier3' },
      { value: 'Darbhanga', label: 'Darbhanga', tier: 'tier3' },
    ],
  },
  {
    value: 'CG', label: 'Chhattisgarh',
    cities: [
      { value: 'Raipur', label: 'Raipur', tier: 'tier2' },
      { value: 'Bhilai', label: 'Bhilai', tier: 'tier3' },
      { value: 'Bilaspur', label: 'Bilaspur', tier: 'tier3' },
      { value: 'Korba', label: 'Korba', tier: 'tier3' },
    ],
  },
  {
    value: 'CH', label: 'Chandigarh',
    cities: [
      { value: 'Chandigarh', label: 'Chandigarh', tier: 'tier1' },
    ],
  },
  {
    value: 'DD', label: 'Dadra & Nagar Haveli and Daman & Diu',
    cities: [
      { value: 'Silvassa', label: 'Silvassa', tier: 'tier3' },
      { value: 'Daman', label: 'Daman', tier: 'tier3' },
    ],
  },
  {
    value: 'DL', label: 'Delhi',
    cities: [
      { value: 'Delhi', label: 'Delhi / NCR', tier: 'metro' },
    ],
  },
  {
    value: 'GA', label: 'Goa',
    cities: [
      { value: 'Panaji', label: 'Panaji', tier: 'tier3' },
      { value: 'Margao', label: 'Margao', tier: 'tier3' },
      { value: 'Vasco da Gama', label: 'Vasco da Gama', tier: 'tier3' },
    ],
  },
  {
    value: 'GJ', label: 'Gujarat',
    cities: [
      { value: 'Ahmedabad', label: 'Ahmedabad', tier: 'tier1' },
      { value: 'Surat', label: 'Surat', tier: 'tier1' },
      { value: 'Vadodara', label: 'Vadodara', tier: 'tier2' },
      { value: 'Rajkot', label: 'Rajkot', tier: 'tier2' },
      { value: 'Gandhinagar', label: 'Gandhinagar', tier: 'tier2' },
      { value: 'Bhavnagar', label: 'Bhavnagar', tier: 'tier3' },
      { value: 'Jamnagar', label: 'Jamnagar', tier: 'tier3' },
      { value: 'Junagadh', label: 'Junagadh', tier: 'tier3' },
    ],
  },
  {
    value: 'HR', label: 'Haryana',
    cities: [
      { value: 'Gurugram', label: 'Gurugram (Gurgaon)', tier: 'metro' },
      { value: 'Faridabad', label: 'Faridabad', tier: 'tier1' },
      { value: 'Karnal', label: 'Karnal', tier: 'tier3' },
      { value: 'Panipat', label: 'Panipat', tier: 'tier3' },
      { value: 'Ambala', label: 'Ambala', tier: 'tier3' },
      { value: 'Hisar', label: 'Hisar', tier: 'tier3' },
      { value: 'Rohtak', label: 'Rohtak', tier: 'tier3' },
    ],
  },
  {
    value: 'HP', label: 'Himachal Pradesh',
    cities: [
      { value: 'Shimla', label: 'Shimla', tier: 'tier3' },
      { value: 'Dharamshala', label: 'Dharamshala', tier: 'tier3' },
      { value: 'Manali', label: 'Manali', tier: 'tier3' },
      { value: 'Solan', label: 'Solan', tier: 'tier3' },
    ],
  },
  {
    value: 'JK', label: 'Jammu & Kashmir',
    cities: [
      { value: 'Srinagar', label: 'Srinagar', tier: 'tier2' },
      { value: 'Jammu', label: 'Jammu', tier: 'tier2' },
    ],
  },
  {
    value: 'JH', label: 'Jharkhand',
    cities: [
      { value: 'Ranchi', label: 'Ranchi', tier: 'tier2' },
      { value: 'Jamshedpur', label: 'Jamshedpur', tier: 'tier2' },
      { value: 'Dhanbad', label: 'Dhanbad', tier: 'tier3' },
      { value: 'Bokaro', label: 'Bokaro', tier: 'tier3' },
    ],
  },
  {
    value: 'KA', label: 'Karnataka',
    cities: [
      { value: 'Bangalore', label: 'Bangalore (Bengaluru)', tier: 'metro' },
      { value: 'Mysore', label: 'Mysore (Mysuru)', tier: 'tier2' },
      { value: 'Mangalore', label: 'Mangalore (Mangaluru)', tier: 'tier2' },
      { value: 'Hubli-Dharwad', label: 'Hubli-Dharwad', tier: 'tier2' },
      { value: 'Belgaum', label: 'Belgaum (Belagavi)', tier: 'tier3' },
      { value: 'Shimoga', label: 'Shimoga', tier: 'tier3' },
    ],
  },
  {
    value: 'KL', label: 'Kerala',
    cities: [
      { value: 'Kochi', label: 'Kochi (Cochin)', tier: 'tier1' },
      { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram', tier: 'tier2' },
      { value: 'Kozhikode', label: 'Kozhikode (Calicut)', tier: 'tier2' },
      { value: 'Thrissur', label: 'Thrissur', tier: 'tier3' },
      { value: 'Kollam', label: 'Kollam', tier: 'tier3' },
      { value: 'Kannur', label: 'Kannur', tier: 'tier3' },
    ],
  },
  {
    value: 'LA', label: 'Ladakh',
    cities: [
      { value: 'Leh', label: 'Leh', tier: 'tier3' },
    ],
  },
  {
    value: 'MP', label: 'Madhya Pradesh',
    cities: [
      { value: 'Indore', label: 'Indore', tier: 'tier1' },
      { value: 'Bhopal', label: 'Bhopal', tier: 'tier2' },
      { value: 'Jabalpur', label: 'Jabalpur', tier: 'tier2' },
      { value: 'Gwalior', label: 'Gwalior', tier: 'tier3' },
      { value: 'Ujjain', label: 'Ujjain', tier: 'tier3' },
    ],
  },
  {
    value: 'MH', label: 'Maharashtra',
    cities: [
      { value: 'Mumbai', label: 'Mumbai', tier: 'metro' },
      { value: 'Pune', label: 'Pune', tier: 'tier1' },
      { value: 'Navi Mumbai', label: 'Navi Mumbai', tier: 'metro' },
      { value: 'Thane', label: 'Thane', tier: 'metro' },
      { value: 'Nagpur', label: 'Nagpur', tier: 'tier2' },
      { value: 'Nashik', label: 'Nashik', tier: 'tier2' },
      { value: 'Aurangabad', label: 'Aurangabad', tier: 'tier2' },
      { value: 'Solapur', label: 'Solapur', tier: 'tier3' },
      { value: 'Kolhapur', label: 'Kolhapur', tier: 'tier3' },
    ],
  },
  {
    value: 'MN', label: 'Manipur',
    cities: [
      { value: 'Imphal', label: 'Imphal', tier: 'tier3' },
    ],
  },
  {
    value: 'ML', label: 'Meghalaya',
    cities: [
      { value: 'Shillong', label: 'Shillong', tier: 'tier3' },
    ],
  },
  {
    value: 'MZ', label: 'Mizoram',
    cities: [
      { value: 'Aizawl', label: 'Aizawl', tier: 'tier3' },
    ],
  },
  {
    value: 'NL', label: 'Nagaland',
    cities: [
      { value: 'Dimapur', label: 'Dimapur', tier: 'tier3' },
      { value: 'Kohima', label: 'Kohima', tier: 'tier3' },
    ],
  },
  {
    value: 'OD', label: 'Odisha',
    cities: [
      { value: 'Bhubaneswar', label: 'Bhubaneswar', tier: 'tier2' },
      { value: 'Cuttack', label: 'Cuttack', tier: 'tier3' },
      { value: 'Rourkela', label: 'Rourkela', tier: 'tier3' },
      { value: 'Puri', label: 'Puri', tier: 'tier3' },
    ],
  },
  {
    value: 'PY', label: 'Puducherry',
    cities: [
      { value: 'Puducherry', label: 'Puducherry', tier: 'tier3' },
    ],
  },
  {
    value: 'PB', label: 'Punjab',
    cities: [
      { value: 'Ludhiana', label: 'Ludhiana', tier: 'tier2' },
      { value: 'Amritsar', label: 'Amritsar', tier: 'tier2' },
      { value: 'Jalandhar', label: 'Jalandhar', tier: 'tier3' },
      { value: 'Patiala', label: 'Patiala', tier: 'tier3' },
      { value: 'Bathinda', label: 'Bathinda', tier: 'tier3' },
      { value: 'Mohali', label: 'Mohali', tier: 'tier2' },
    ],
  },
  {
    value: 'RJ', label: 'Rajasthan',
    cities: [
      { value: 'Jaipur', label: 'Jaipur', tier: 'tier1' },
      { value: 'Jodhpur', label: 'Jodhpur', tier: 'tier2' },
      { value: 'Udaipur', label: 'Udaipur', tier: 'tier2' },
      { value: 'Kota', label: 'Kota', tier: 'tier3' },
      { value: 'Ajmer', label: 'Ajmer', tier: 'tier3' },
      { value: 'Bikaner', label: 'Bikaner', tier: 'tier3' },
    ],
  },
  {
    value: 'SK', label: 'Sikkim',
    cities: [
      { value: 'Gangtok', label: 'Gangtok', tier: 'tier3' },
    ],
  },
  {
    value: 'TN', label: 'Tamil Nadu',
    cities: [
      { value: 'Chennai', label: 'Chennai', tier: 'metro' },
      { value: 'Coimbatore', label: 'Coimbatore', tier: 'tier2' },
      { value: 'Madurai', label: 'Madurai', tier: 'tier2' },
      { value: 'Tiruchirappalli', label: 'Tiruchirappalli (Trichy)', tier: 'tier2' },
      { value: 'Salem', label: 'Salem', tier: 'tier3' },
      { value: 'Erode', label: 'Erode', tier: 'tier3' },
      { value: 'Tirunelveli', label: 'Tirunelveli', tier: 'tier3' },
      { value: 'Vellore', label: 'Vellore', tier: 'tier3' },
    ],
  },
  {
    value: 'TS', label: 'Telangana',
    cities: [
      { value: 'Hyderabad', label: 'Hyderabad', tier: 'metro' },
      { value: 'Warangal', label: 'Warangal', tier: 'tier3' },
      { value: 'Nizamabad', label: 'Nizamabad', tier: 'tier3' },
      { value: 'Karimnagar', label: 'Karimnagar', tier: 'tier3' },
    ],
  },
  {
    value: 'TR', label: 'Tripura',
    cities: [
      { value: 'Agartala', label: 'Agartala', tier: 'tier3' },
    ],
  },
  {
    value: 'UP', label: 'Uttar Pradesh',
    cities: [
      { value: 'Noida', label: 'Noida / Greater Noida', tier: 'metro' },
      { value: 'Lucknow', label: 'Lucknow', tier: 'tier1' },
      { value: 'Kanpur', label: 'Kanpur', tier: 'tier2' },
      { value: 'Agra', label: 'Agra', tier: 'tier2' },
      { value: 'Varanasi', label: 'Varanasi', tier: 'tier2' },
      { value: 'Ghaziabad', label: 'Ghaziabad', tier: 'tier1' },
      { value: 'Allahabad', label: 'Prayagraj (Allahabad)', tier: 'tier2' },
      { value: 'Meerut', label: 'Meerut', tier: 'tier3' },
      { value: 'Bareilly', label: 'Bareilly', tier: 'tier3' },
      { value: 'Aligarh', label: 'Aligarh', tier: 'tier3' },
    ],
  },
  {
    value: 'UK', label: 'Uttarakhand',
    cities: [
      { value: 'Dehradun', label: 'Dehradun', tier: 'tier2' },
      { value: 'Haridwar', label: 'Haridwar', tier: 'tier3' },
      { value: 'Rishikesh', label: 'Rishikesh', tier: 'tier3' },
      { value: 'Haldwani', label: 'Haldwani', tier: 'tier3' },
    ],
  },
  {
    value: 'WB', label: 'West Bengal',
    cities: [
      { value: 'Kolkata', label: 'Kolkata', tier: 'metro' },
      { value: 'Howrah', label: 'Howrah', tier: 'metro' },
      { value: 'Durgapur', label: 'Durgapur', tier: 'tier3' },
      { value: 'Siliguri', label: 'Siliguri', tier: 'tier3' },
      { value: 'Asansol', label: 'Asansol', tier: 'tier3' },
    ],
  },
  {
    value: 'NRI', label: 'Outside India (NRI)',
    cities: [],
  },
];

/** Tier labels with descriptions for display */
export const TIER_DEFINITIONS: Record<string, { label: string; description: string }> = {
  metro: { label: 'Metro City', description: 'Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, Kolkata — highest cost of living' },
  tier1: { label: 'Tier 1 City', description: 'Pune, Ahmedabad, Jaipur, Lucknow, Kochi, Chandigarh — high cost of living' },
  tier2: { label: 'Tier 2 City', description: 'Indore, Nagpur, Coimbatore, Bhopal, Ranchi — moderate cost of living' },
  tier3: { label: 'Tier 3 / Smaller', description: 'Smaller towns & rural areas — lower cost of living' },
};
