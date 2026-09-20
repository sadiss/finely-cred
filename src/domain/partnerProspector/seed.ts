import type { PartnerVertical, RawProspectCandidate } from './types.ts';

type Seed = {
  businessName: string;
  city: string;
  metro: string;
  vertical: PartnerVertical;
  website: string;
  title?: string;
  snippet?: string;
};

/**
 * Curated South Florida / Haitian-corridor public businesses.
 * Websites are official public sites only. Phone/email are left blank so
 * enrichment (or an operator) can fill public contacts — never invented here.
 */
const SEED: Seed[] = [
  // tax / accounting
  { businessName: 'H&R Block Miami Gardens', city: 'Miami Gardens', metro: 'miami_gardens', vertical: 'tax', website: 'https://www.hrblock.com', snippet: 'National tax preparer with Miami Gardens / North Dade offices.' },
  { businessName: 'H&R Block North Miami', city: 'North Miami', metro: 'north_miami', vertical: 'tax', website: 'https://www.hrblock.com', snippet: 'Walk-in income tax office serving North Miami.' },
  { businessName: 'H&R Block Little Haiti / Miami', city: 'Miami', metro: 'miami', vertical: 'tax', website: 'https://www.hrblock.com', snippet: 'Miami tax preparation offices near the Haitian corridor.' },
  { businessName: 'H&R Block Hollywood', city: 'Hollywood', metro: 'hollywood', vertical: 'tax', website: 'https://www.hrblock.com', snippet: 'Hollywood FL tax office.' },
  { businessName: 'H&R Block Fort Lauderdale', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'tax', website: 'https://www.hrblock.com', snippet: 'Broward tax preparation.' },
  { businessName: 'H&R Block Homestead', city: 'Homestead', metro: 'homestead', vertical: 'tax', website: 'https://www.hrblock.com', snippet: 'South Dade tax office.' },
  { businessName: 'H&R Block West Palm Beach', city: 'West Palm Beach', metro: 'west_palm', vertical: 'tax', website: 'https://www.hrblock.com', snippet: 'Palm Beach County tax office.' },
  { businessName: 'Jackson Hewitt Tax Service Miami', city: 'Miami', metro: 'miami', vertical: 'tax', website: 'https://www.jacksonhewitt.com', snippet: 'Seasonal and year-round tax preparer.' },
  { businessName: 'Jackson Hewitt Miramar', city: 'Miramar', metro: 'miramar', vertical: 'tax', website: 'https://www.jacksonhewitt.com', snippet: 'Miramar / Pembroke Pines tax desk.' },
  { businessName: 'Liberty Tax Miami', city: 'Miami', metro: 'miami', vertical: 'tax', website: 'https://www.libertytax.com', snippet: 'Community tax franchise with Miami locations.' },
  { businessName: 'Liberty Tax North Miami', city: 'North Miami', metro: 'north_miami', vertical: 'tax', website: 'https://www.libertytax.com', snippet: 'North Miami tax franchise.' },
  { businessName: 'Kaufman Rossin', city: 'Miami', metro: 'miami', vertical: 'tax', website: 'https://kaufmanrossin.com', snippet: 'Miami CPA and advisory firm.' },
  { businessName: 'Berkowitz Pollack Brant', city: 'Miami', metro: 'miami', vertical: 'tax', website: 'https://www.bpb-cpa.com', snippet: 'South Florida CPA / tax advisors.' },
  { businessName: 'Marcum LLP Miami', city: 'Miami', metro: 'miami', vertical: 'tax', website: 'https://www.marcumllp.com', snippet: 'National CPA firm with a Miami office.' },
  { businessName: 'Daszkal Bolton', city: 'Boca Raton', metro: 'west_palm', vertical: 'tax', website: 'https://www.daszkalbolton.com', snippet: 'Palm Beach / Boca accounting and tax firm.' },
  { businessName: 'Verdeja, De Armas, Trujillo', city: 'Coral Gables', metro: 'miami', vertical: 'tax', website: 'https://www.vdt-cpa.com', snippet: 'Miami-Dade CPA firm.' },
  { businessName: 'Templeton & Company', city: 'West Palm Beach', metro: 'west_palm', vertical: 'tax', website: 'https://www.templetonco.com', snippet: 'West Palm Beach CPA firm.' },
  { businessName: 'S. Davis & Associates', city: 'Hollywood', metro: 'hollywood', vertical: 'tax', website: 'https://www.sdavispa.com', snippet: 'Hollywood FL certified public accountants.' },

  // BHPH / used-car / in-house finance
  { businessName: 'DriveTime Miami', city: 'Miami', metro: 'miami', vertical: 'bhph', website: 'https://www.drivetime.com', snippet: 'Buy-here-pay-here used car dealer with Miami stores.' },
  { businessName: 'DriveTime Miami Gardens', city: 'Miami Gardens', metro: 'miami_gardens', vertical: 'bhph', website: 'https://www.drivetime.com', snippet: 'In-house auto finance dealer serving North Dade.' },
  { businessName: 'DriveTime Fort Lauderdale', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'bhph', website: 'https://www.drivetime.com', snippet: 'Broward BHPH used-car store.' },
  { businessName: 'J.D. Byrider Fort Lauderdale', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'bhph', website: 'https://www.jdbyrider.com', snippet: 'Buy here pay here franchise.' },
  { businessName: 'J.D. Byrider West Palm Beach', city: 'West Palm Beach', metro: 'west_palm', vertical: 'bhph', website: 'https://www.jdbyrider.com', snippet: 'In-house financing used cars, Palm Beach.' },
  { businessName: 'Car Credit City', city: 'Hollywood', metro: 'hollywood', vertical: 'bhph', website: 'https://www.carcreditcity.net', snippet: 'Florida BHPH / in-house finance used-car dealer.' },
  { businessName: 'AutoNation USA Miami', city: 'Miami', metro: 'miami', vertical: 'bhph', website: 'https://www.autonationusa.com', snippet: 'Used-car superstore with in-store financing.' },
  { businessName: 'AutoNation USA Fort Lauderdale', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'bhph', website: 'https://www.autonationusa.com', snippet: 'Broward used-car retail + finance.' },
  { businessName: 'CarMax Miami', city: 'Miami', metro: 'miami', vertical: 'bhph', website: 'https://www.carmax.com', snippet: 'Used-car retailer; financing desk on site.' },
  { businessName: 'CarMax Fort Lauderdale', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'bhph', website: 'https://www.carmax.com', snippet: 'Broward used-car store.' },
  { businessName: 'CarMax West Palm Beach', city: 'West Palm Beach', metro: 'west_palm', vertical: 'bhph', website: 'https://www.carmax.com', snippet: 'Palm Beach used-car store.' },
  { businessName: 'Hendrick Honda of Miami Gardens', city: 'Miami Gardens', metro: 'miami_gardens', vertical: 'bhph', website: 'https://www.hendrickhondamiamigardens.com', snippet: 'Miami Gardens dealership with in-house finance office.' },

  // realtor
  { businessName: 'The Keyes Company', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.keyes.com', snippet: 'Long-standing South Florida residential brokerage.' },
  { businessName: 'Keller Williams Miami', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.kw.com', snippet: 'Miami realtor offices across the corridor.' },
  { businessName: 'Keller Williams Miami Gardens', city: 'Miami Gardens', metro: 'miami_gardens', vertical: 'realtor', website: 'https://www.kw.com', snippet: 'North Dade realtor market center.' },
  { businessName: 'RE/MAX Advance Realty', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.remax.com', snippet: 'Miami-Dade residential real estate.' },
  { businessName: 'RE/MAX North Miami', city: 'North Miami', metro: 'north_miami', vertical: 'realtor', website: 'https://www.remax.com', snippet: 'North Miami realtor office.' },
  { businessName: 'Coldwell Banker Realty Miami', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.coldwellbankerhomes.com', snippet: 'Residential brokerage, Miami-Dade.' },
  { businessName: 'Coldwell Banker Fort Lauderdale', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'realtor', website: 'https://www.coldwellbankerhomes.com', snippet: 'Broward residential real estate.' },
  { businessName: 'Compass Miami', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.compass.com', snippet: 'Miami residential brokerage.' },
  { businessName: 'Berkshire Hathaway HomeServices Florida Realty', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'realtor', website: 'https://www.bhhsfloridarealty.com', snippet: 'South Florida realtor network.' },
  { businessName: 'ONE Sotheby’s International Realty', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.onesothebysrealty.com', snippet: 'Miami luxury and residential brokerage.' },
  { businessName: 'United Realty Group', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'realtor', website: 'https://www.urgflorida.com', snippet: 'Broward / South Florida realtor offices.' },
  { businessName: 'Related ISG', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.relatedisg.com', snippet: 'Miami residential sales.' },
  { businessName: 'LoKation Real Estate Hollywood', city: 'Hollywood', metro: 'hollywood', vertical: 'realtor', website: 'https://www.lokationre.com', snippet: 'Broward realtor brokerage.' },
  { businessName: 'EXP Realty Miami', city: 'Miami', metro: 'miami', vertical: 'realtor', website: 'https://www.exprealty.com', snippet: 'Cloud brokerage with a large SFL agent desk.' },

  // mortgage / loan officers
  { businessName: 'CrossCountry Mortgage Miami', city: 'Miami', metro: 'miami', vertical: 'mortgage', website: 'https://www.crosscountrymortgage.com', snippet: 'Retail mortgage lender with South Florida loan officers.' },
  { businessName: 'CrossCountry Mortgage Fort Lauderdale', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'mortgage', website: 'https://www.crosscountrymortgage.com', snippet: 'Broward mortgage / LO desk.' },
  { businessName: 'Guild Mortgage South Florida', city: 'Miami', metro: 'miami', vertical: 'mortgage', website: 'https://www.guildmortgage.com', snippet: 'Retail mortgage lender serving Florida.' },
  { businessName: 'Movement Mortgage South Florida', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'mortgage', website: 'https://www.movement.com', snippet: 'Loan officer team covering Broward and Dade.' },
  { businessName: 'Fairway Independent Mortgage Miami', city: 'Miami', metro: 'miami', vertical: 'mortgage', website: 'https://www.fairwayindependentmc.com', snippet: 'Independent mortgage bankers / LOs.' },
  { businessName: 'Paramount Residential Mortgage Group', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'mortgage', website: 'https://www.prmg.net', snippet: 'Retail mortgage lender, Florida.' },
  { businessName: 'American Neighborhood Mortgage (AnnieMac)', city: 'West Palm Beach', metro: 'west_palm', vertical: 'mortgage', website: 'https://www.anniemac.com', snippet: 'Mortgage lender with Florida loan officers.' },
  { businessName: 'CMG Financial Miami', city: 'Miami', metro: 'miami', vertical: 'mortgage', website: 'https://www.cmgfi.com', snippet: 'Retail mortgage / home loans.' },
  { businessName: 'loanDepot Miami', city: 'Miami', metro: 'miami', vertical: 'mortgage', website: 'https://www.loandepot.com', snippet: 'Retail mortgage lender.' },
  { businessName: 'New American Funding Florida', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'mortgage', website: 'https://www.newamericanfunding.com', snippet: 'Retail mortgage and refinance LOs.' },
  { businessName: 'United Wholesale Mortgage (broker partners)', city: 'Miami', metro: 'miami', vertical: 'mortgage', website: 'https://www.uwm.com', snippet: 'Wholesale channel used by local mortgage brokers.' },

  // immigration / notary / multiservice
  { businessName: 'Catholic Legal Services Archdiocese of Miami', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://www.catholiclegalservices.org', snippet: 'Immigration legal aid serving Miami-Dade families.' },
  { businessName: 'Americans for Immigrant Justice', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://aijustice.org', snippet: 'Miami immigration legal nonprofit.' },
  { businessName: 'Catholic Charities Legal Services Miami', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://www.ccadm.org', snippet: 'Archdiocese social + immigration services.' },
  { businessName: 'Florida Immigrant Coalition', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://floridaimmigrant.org', snippet: 'Immigrant-rights coalition with Miami roots.' },
  { businessName: 'Coast to Coast Legal Aid of South Florida', city: 'Hollywood', metro: 'hollywood', vertical: 'immigration', website: 'https://www.coasttocoastlegalaid.org', snippet: 'Broward legal aid including immigration referrals.' },
  { businessName: 'Legal Aid Service of Broward County', city: 'Fort Lauderdale', metro: 'fort_lauderdale', vertical: 'immigration', website: 'https://www.browardlegalaid.org', snippet: 'Broward legal aid desk.' },
  { businessName: 'Put Something Back Legal Aid (11th Circuit)', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://www.dadecountybar.org', snippet: 'Miami-Dade pro bono / legal referral desk.' },
  { businessName: 'Haitian American Community Development Corporation', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://www.hacdc.org', snippet: 'Little Haiti community + immigrant services.' },
  { businessName: 'Sant La Haitian Neighborhood Center', city: 'North Miami', metro: 'north_miami', vertical: 'immigration', website: 'https://www.santla.org', snippet: 'Haitian neighborhood center — North Miami / Little Haiti corridor.' },
  { businessName: 'Notre Dame d’Haiti Catholic Church Mission', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://www.notredamedhaiti.com', snippet: 'Little Haiti parish / community mission desk.' },
  { businessName: 'Florida Association of Notaries (public directory)', city: 'Miami', metro: 'miami', vertical: 'immigration', website: 'https://www.flnotary.com', snippet: 'Public notary education and locator — seed only, not a law firm.' },

  // community desks (money transfer, etc.)
  { businessName: 'Unitransfer USA', city: 'Miami', metro: 'miami', vertical: 'community', website: 'https://www.unitransferusa.com', snippet: 'Haitian-corridor money transfer brand with Miami agents.' },
  { businessName: 'CAM (Caribbean Air Mail) Transfer', city: 'Miami', metro: 'miami', vertical: 'community', website: 'https://www.camtransfer.com', snippet: 'Haiti remittance / CAM transfer network.' },
  { businessName: 'Unibank Haiti / Unigestion (public US info)', city: 'Miami', metro: 'miami', vertical: 'community', website: 'https://www.unibankhaiti.com', snippet: 'Haitian bank with US remittance relationships.' },
  { businessName: 'MoneyGram Miami agent network', city: 'Miami', metro: 'miami', vertical: 'community', website: 'https://www.moneygram.com', snippet: 'Walk-in remittance agents across Little Haiti / North Miami.' },
  { businessName: 'Western Union South Florida agents', city: 'North Miami', metro: 'north_miami', vertical: 'community', website: 'https://www.westernunion.com', snippet: 'Community money-transfer agents.' },
  { businessName: 'RIA Money Transfer Miami', city: 'Miami', metro: 'miami', vertical: 'community', website: 'https://www.riamoneytransfer.com', snippet: 'Remittance brand with Haitian-corridor agents.' },
  { businessName: 'Sogebank / Sogexpress public remittance', city: 'Miami', metro: 'miami', vertical: 'community', website: 'https://www.sogebank.com', snippet: 'Haiti-linked remittance channel used by SFL desks.' },
  { businessName: 'Fonkoze (public US outreach)', city: 'Miami', metro: 'miami', vertical: 'community', website: 'https://www.fonkoze.org', snippet: 'Haiti microfinance / diaspora community desk.' },
];

export function seedCandidates(args?: { metros?: string[]; verticals?: PartnerVertical[] }): RawProspectCandidate[] {
  const metros = new Set((args?.metros ?? []).map((m) => m.trim().toLowerCase()).filter(Boolean));
  const verticals = new Set((args?.verticals ?? []).map((v) => v.trim().toLowerCase()).filter(Boolean));
  return SEED.filter((row) => {
    if (metros.size && !metros.has(row.metro)) return false;
    if (verticals.size && !verticals.has(row.vertical)) return false;
    return true;
  }).map((row) => ({
    businessName: row.businessName,
    city: row.city,
    metro: row.metro,
    vertical: row.vertical,
    website: row.website,
    title: row.title,
    snippet: row.snippet,
    sourceUrls: [row.website],
    sources: ['sfl_seed'],
  }));
}

export function seedCount(): number {
  return SEED.length;
}
