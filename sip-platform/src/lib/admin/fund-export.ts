import type { TrustnerCuratedFund, TrustnerFundCategory } from '@/types/funds';

function formatFundToTS(fund: TrustnerCuratedFund): string {
  const lines = [
    `    {`,
    `      id: '${fund.id}',`,
    `      name: '${fund.name.replace(/'/g, "\\'")}',`,
    `      category: '${fund.category}',`,
    `      fundManager: '${fund.fundManager.replace(/'/g, "\\'")}',`,
    `      ageOfFund: ${fund.ageOfFund},`,
    `      aumCr: ${fund.aumCr},`,
    `      ter: ${fund.ter},`,
    `      standardDeviation: ${fund.standardDeviation},`,
    `      sharpeRatio: ${fund.sharpeRatio},`,
    `      returns: {`,
    `        mtd: ${fund.returns.mtd},`,
    `        ytd: ${fund.returns.ytd},`,
    `        oneYear: ${fund.returns.oneYear},`,
    `        twoYear: ${fund.returns.twoYear},`,
    `        threeYear: ${fund.returns.threeYear},`,
    `        fiveYear: ${fund.returns.fiveYear},`,
    `      },`,
    `      numberOfHoldings: ${fund.numberOfHoldings},`,
  ];

  if (fund.skinInTheGame) {
    lines.push(`      skinInTheGame: {`);
    lines.push(`        amountCr: ${fund.skinInTheGame.amountCr},`);
    lines.push(`        percentOfAum: ${fund.skinInTheGame.percentOfAum},`);
    lines.push(`      },`);
  }

  lines.push(`      rank: ${fund.rank},`);
  lines.push(`    },`);

  return lines.join('\n');
}

export function generateCategoryFile(category: TrustnerFundCategory): string {
  const varName = category.name
    .toUpperCase()
    .replace(/[&\s]+/g, '_')
    .replace(/_+/g, '_') + '_FUNDS';

  const fundsContent = category.funds
    .sort((a, b) => a.rank - b.rank)
    .map(formatFundToTS)
    .join('\n');

  return `import type { TrustnerFundCategory } from '@/types/funds';

export const ${varName}: TrustnerFundCategory = {
  name: '${category.name}',
  displayName: '${category.displayName}',
  hasSkinInTheGame: ${category.hasSkinInTheGame},
  funds: [
${fundsContent}
  ],
};
`;
}

export function generateIndexFile(categories: TrustnerFundCategory[], month: string, year: number): string {
  const imports = categories.map((cat) => {
    const fileName = cat.name.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-');
    const varName = cat.name.toUpperCase().replace(/[&\s]+/g, '_').replace(/_+/g, '_') + '_FUNDS';
    return `import { ${varName} } from './${fileName}';`;
  });

  const categoryList = categories.map((cat) =>
    cat.name.toUpperCase().replace(/[&\s]+/g, '_').replace(/_+/g, '_') + '_FUNDS'
  );

  return `import type { TrustnerFundList } from '@/types/funds';
${imports.join('\n')}

export const ${month.toUpperCase()}_${year}_FUND_LIST: TrustnerFundList = {
  month: '${month}',
  year: ${year},
  dataAsOn: '01.${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, '0')}.${year}',
  lastUpdated: '${year}-${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, '0')}-01',
  categories: [
    ${categoryList.join(',\n    ')},
  ],
};
`;
}
