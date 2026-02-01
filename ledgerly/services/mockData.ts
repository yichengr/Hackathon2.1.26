
import { Transaction, AccountSummary, LocationData } from '../types';

export const MOCK_SUMMARY: AccountSummary = {
  totalBalance: 12450.75,
  monthlySpending: 3120.50,
  monthlyIncome: 5200.00,
  paycheckAmount: 2600.00,
  incomeFrequency: 'biweekly',
  incomeDay: 'Friday',
  lastProcessedDate: new Date().toISOString(),
  savingsGoal: 25000,
  currentSavings: 9200,
  savingsPercentage: 20
};

const today = new Date();
const formatDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// --- REALISTIC NYC GEOGRAPHY ---
// Jitter function to prevent overlapping markers
const jitter = (coord: number, scale: number = 0.0015) => coord + (Math.random() - 0.5) * scale;

const LOCATIONS = {
  // RESIDENTIAL HUB (Brooklyn - Prospect Heights/Park Slope) -> NORMAL GOODS
  HOME: { city: 'Brooklyn', region: 'NY', lat: 40.6718, lng: -73.9723, neighborhood: 'Prospect Heights' },
  GROCERY: { city: 'Brooklyn', region: 'NY', lat: 40.6830, lng: -73.9760, neighborhood: 'Fort Greene' },
  
  // LUXURY HUB (Manhattan - SoHo/Tribeca) -> LUXURY GOODS
  SOHO_RETAIL: { city: 'New York', region: 'NY', lat: 40.7233, lng: -74.0030, neighborhood: 'SoHo' },
  TRIBECA_DINING: { city: 'New York', region: 'NY', lat: 40.7185, lng: -74.0075, neighborhood: 'Tribeca' },
  HUDSON_YARDS: { city: 'New York', region: 'NY', lat: 40.7540, lng: -74.0010, neighborhood: 'Hudson Yards' },

  // COMMUTER/TRANSIT HUB (Queens/Midtown Transit) -> INFERIOR/SUBSTITUTE GOODS
  PORT_AUTHORITY: { city: 'New York', region: 'NY', lat: 40.7570, lng: -73.9910, neighborhood: 'Midtown West' },
  QUEENS_PLAZA: { city: 'Long Island City', region: 'NY', lat: 40.7490, lng: -73.9390, neighborhood: 'LIC' },
  ASTORIA_DELI: { city: 'Queens', region: 'NY', lat: 40.7644, lng: -73.9235, neighborhood: 'Astoria' }
};

const getLocation = (base: LocationData): LocationData => ({
  ...base,
  lat: jitter(base.lat),
  lng: jitter(base.lng)
});

export const MOCK_TRANSACTIONS: Transaction[] = [
  // --- NORMAL (ESSENTIAL) SPENDING ---
  {
    id: 't1', date: formatDate(1), description: 'Trader Joe\'s', amount: -142.50, category: 'Groceries', merchant: 'Trader Joe\'s',
    lifePurpose: 'Survival', economicBehavior: 'Normal', location: getLocation(LOCATIONS.GROCERY),
    purposeRationale: 'Weekly nutritional baseline.'
  },
  {
    id: 't2', date: formatDate(4), description: 'ConEd Utilities', amount: -115.00, category: 'Utilities', merchant: 'ConEd',
    lifePurpose: 'Survival', economicBehavior: 'Normal', location: getLocation(LOCATIONS.HOME),
    purposeRationale: 'Basic electricity and gas service.'
  },
  {
    id: 't3', date: formatDate(2), description: 'MTA MetroCard', amount: -132.00, category: 'Transportation', merchant: 'MTA',
    lifePurpose: 'Survival', economicBehavior: 'Normal', location: getLocation(LOCATIONS.HOME),
    purposeRationale: 'Monthly commute infrastructure.'
  },
  {
    id: 't4', date: formatDate(8), description: 'Duane Reade', amount: -28.45, category: 'Health', merchant: 'Duane Reade',
    lifePurpose: 'Survival', economicBehavior: 'Normal', location: getLocation(LOCATIONS.HOME),
    purposeRationale: 'Medication and hygiene essentials.'
  },
  {
    id: 't5', date: formatDate(15), description: 'Wash & Fold Service', amount: -45.00, category: 'Services', merchant: 'Clean Rite',
    lifePurpose: 'Convenience', economicBehavior: 'Normal', location: getLocation(LOCATIONS.HOME)
  },
  {
    id: 't20', date: formatDate(9), description: 'Whole Foods Market', amount: -85.20, category: 'Groceries', merchant: 'Whole Foods',
    lifePurpose: 'Growth', economicBehavior: 'Normal', location: getLocation(LOCATIONS.GROCERY)
  },

  // --- LUXURY (DISCRETIONARY) SPENDING ---
  {
    id: 't6', date: formatDate(3), description: 'Equinox Membership', amount: -210.00, category: 'Health', merchant: 'Equinox',
    lifePurpose: 'Growth', economicBehavior: 'Luxury', location: getLocation(LOCATIONS.HUDSON_YARDS),
    purposeRationale: 'Premium fitness investment.'
  },
  {
    id: 't8', date: formatDate(5), description: 'Blue Bottle Coffee', amount: -7.25, category: 'Food & Drink', merchant: 'Blue Bottle',
    lifePurpose: 'Joy', economicBehavior: 'Luxury', location: getLocation(LOCATIONS.SOHO_RETAIL)
  },
  {
    id: 't9', date: formatDate(6), description: 'Sephora', amount: -145.00, category: 'Shopping', merchant: 'Sephora',
    lifePurpose: 'Joy', economicBehavior: 'Luxury', location: getLocation(LOCATIONS.SOHO_RETAIL),
    purposeRationale: 'Discretionary personal care.'
  },
  {
    id: 't10', date: formatDate(6), description: 'Nobu Downtown', amount: -245.00, category: 'Food & Drink', merchant: 'Nobu',
    lifePurpose: 'Joy', economicBehavior: 'Luxury', location: getLocation(LOCATIONS.TRIBECA_DINING),
    purposeRationale: 'High-end social dining.'
  },
  {
    id: 't11', date: formatDate(7), description: 'Uber Black', amount: -58.50, category: 'Transportation', merchant: 'Uber',
    lifePurpose: 'Convenience', economicBehavior: 'Luxury', location: getLocation(LOCATIONS.TRIBECA_DINING),
    purposeRationale: 'Premium transit choice.'
  },
  {
    id: 't18', date: formatDate(18), description: 'Broadway Tickets', amount: -320.00, category: 'Entertainment', merchant: 'Telecharge',
    lifePurpose: 'Joy', economicBehavior: 'Luxury', location: getLocation(LOCATIONS.PORT_AUTHORITY)
  },

  // --- INFERIOR (CONSTRAINT) SPENDING ---
  {
    id: 't12', date: formatDate(0), description: 'Corner Bodega', amount: -14.50, category: 'Food & Drink', merchant: 'Bodega',
    lifePurpose: 'Survival', economicBehavior: 'Inferior', location: getLocation(LOCATIONS.ASTORIA_DELI),
    purposeRationale: 'Late night substitute meal.'
  },
  {
    id: 't13', date: formatDate(10), description: 'Dollar Tree', amount: -18.20, category: 'Shopping', merchant: 'Dollar Tree',
    lifePurpose: 'Convenience', economicBehavior: 'Inferior', location: getLocation(LOCATIONS.QUEENS_PLAZA),
    purposeRationale: 'Discount household basics.'
  },
  {
    id: 't14', date: formatDate(12), description: 'McDonalds', amount: -11.40, category: 'Food & Drink', merchant: 'McDonalds',
    lifePurpose: 'Convenience', economicBehavior: 'Inferior', location: getLocation(LOCATIONS.PORT_AUTHORITY),
    purposeRationale: 'Low-cost meal alternative.'
  },
  {
    id: 't15', date: formatDate(12), description: '7-Eleven', amount: -8.50, category: 'Shopping', merchant: '7-Eleven',
    lifePurpose: 'Convenience', economicBehavior: 'Inferior', location: getLocation(LOCATIONS.QUEENS_PLAZA)
  },
  {
    id: 't22', date: formatDate(11), description: 'Greyhound Bus', amount: -24.50, category: 'Transportation', merchant: 'Greyhound',
    lifePurpose: 'Convenience', economicBehavior: 'Inferior', location: getLocation(LOCATIONS.PORT_AUTHORITY),
    purposeRationale: 'Budget inter-city travel.'
  },

  // --- INCOME (No behavior mapped usually, but can be located) ---
  {
    id: 't16', date: formatDate(7), description: 'Direct Deposit', amount: 2600.00, category: 'Income', merchant: 'Tech Corp',
    lifePurpose: 'Growth', location: LOCATIONS.HUDSON_YARDS
  },
  {
    id: 't17', date: formatDate(21), description: 'Direct Deposit', amount: 2600.00, category: 'Income', merchant: 'Tech Corp',
    lifePurpose: 'Growth', location: LOCATIONS.HUDSON_YARDS
  }
];
