import { TrustnerFundList } from '@/types/funds';
import { VALUE_FUNDS } from './value-funds';
import { CONTRA_FUNDS } from './contra-funds';
import { SMALL_CAP_FUNDS } from './small-cap';
import { MID_CAP_FUNDS } from './mid-cap';
import { LARGE_CAP_FUNDS } from './large-cap';
import { LARGE_MID_CAP_FUNDS } from './large-mid-cap';
import { FLEXI_CAP_FUNDS } from './flexi-cap';
import { MULTI_CAP_FUNDS } from './multi-cap';
import { MULTI_ASSET_FUNDS } from './multi-asset';
import { BALANCED_ADVANTAGE_FUNDS } from './balanced-advantage';
import { AGGRESSIVE_HYBRID_FUNDS } from './aggressive-hybrid';
import { EQUITY_SAVINGS_FUNDS } from './equity-savings';
import { CONSERVATIVE_HYBRID_FUNDS } from './conservative-hybrid';
import { GOLD_SILVER_FUNDS } from './gold-silver';
import { FUND_OF_FUND_FUNDS } from './fund-of-fund';

export const MARCH_2026_FUND_LIST: TrustnerFundList = {
  month: 'March',
  year: 2026,
  dataAsOn: '01.03.2026',
  lastUpdated: '2026-03-01',
  categories: [
    LARGE_CAP_FUNDS,
    LARGE_MID_CAP_FUNDS,
    MID_CAP_FUNDS,
    SMALL_CAP_FUNDS,
    FLEXI_CAP_FUNDS,
    MULTI_CAP_FUNDS,
    VALUE_FUNDS,
    CONTRA_FUNDS,
    MULTI_ASSET_FUNDS,
    BALANCED_ADVANTAGE_FUNDS,
    AGGRESSIVE_HYBRID_FUNDS,
    EQUITY_SAVINGS_FUNDS,
    CONSERVATIVE_HYBRID_FUNDS,
    GOLD_SILVER_FUNDS,
    FUND_OF_FUND_FUNDS,
  ],
};
