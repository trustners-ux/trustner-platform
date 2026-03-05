import { PrismaClient, UserRole, SubBrokerStatus, ClientStatus, CommissionTier } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Database Seed Script
 * Creates initial data for Trustner Partner OS
 * - Admin users with different roles
 * - Sample sub-brokers with various statuses and tiers
 * - Sample clients
 * - MF schemes with commission rates
 * - System configuration
 *
 * Usage: npm run prisma:seed
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ============================================================================
    // 1. CREATE ADMIN USERS
    // ============================================================================
    console.log('📝 Creating admin users...');

    const hashPassword = (password: string) =>
      bcrypt.hashSync(password, 12);

    // Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@trustner.in' },
      update: {},
      create: {
        id: uuidv4(),
        email: 'admin@trustner.in',
        name: 'Super Admin',
        phone: '+919876543210',
        password: hashPassword('TrustnerAdmin@2026'),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        emailVerified: true,
      },
    });

    // Compliance Admin
    const complianceAdmin = await prisma.user.upsert({
      where: { email: 'compliance@trustner.in' },
      update: {},
      create: {
        id: uuidv4(),
        email: 'compliance@trustner.in',
        name: 'Compliance Admin',
        phone: '+919876543211',
        password: hashPassword('ComplianceAdmin@2026'),
        role: UserRole.COMPLIANCE_ADMIN,
        isActive: true,
        emailVerified: true,
      },
    });

    // Finance Admin
    const financeAdmin = await prisma.user.upsert({
      where: { email: 'finance@trustner.in' },
      update: {},
      create: {
        id: uuidv4(),
        email: 'finance@trustner.in',
        name: 'Finance Admin',
        phone: '+919876543212',
        password: hashPassword('FinanceAdmin@2026'),
        role: UserRole.FINANCE_ADMIN,
        isActive: true,
        emailVerified: true,
      },
    });

    console.log('✓ Admin users created\n');

    // ============================================================================
    // 2. CREATE REGIONAL HEADS
    // ============================================================================
    console.log('📝 Creating regional heads...');

    const regionalHeads = [];
    const regions = ['Mumbai', 'Delhi', 'Bangalore'];

    for (const region of regions) {
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: `regional.head.${region.toLowerCase()}@trustner.in`,
          name: `${region} Regional Head`,
          phone: `+9198765432${10 + regions.indexOf(region)}`,
          password: hashPassword('RegionalHead@2026'),
          role: UserRole.REGIONAL_HEAD,
          isActive: true,
          emailVerified: true,
        },
      });

      regionalHeads.push(user);
    }

    console.log('✓ Regional heads created\n');

    // ============================================================================
    // 3. CREATE SUB-BROKERS
    // ============================================================================
    console.log('📝 Creating sample sub-brokers...');

    const subBrokerNames = [
      { name: 'ABC Financial Services', arn: 'ARN-12001', city: 'Mumbai', tier: CommissionTier.STARTER },
      { name: 'XYZ Investments Pvt Ltd', arn: 'ARN-12002', city: 'Delhi', tier: CommissionTier.GROWTH },
      { name: 'Premier Wealth Management', arn: 'ARN-12003', city: 'Bangalore', tier: CommissionTier.SENIOR },
      { name: 'Elite Capital Advisors', arn: 'ARN-12004', city: 'Mumbai', tier: CommissionTier.ELITE },
      { name: 'Global Investment Group', arn: 'ARN-12005', city: 'Delhi', tier: CommissionTier.STARTER },
      { name: 'Smart Money Solutions', arn: 'ARN-12006', city: 'Bangalore', tier: CommissionTier.GROWTH },
      { name: 'Wealth First Advisory', arn: 'ARN-12007', city: 'Mumbai', tier: CommissionTier.SENIOR },
      { name: 'Prosperity Partners', arn: 'ARN-12008', city: 'Delhi', tier: CommissionTier.STARTER },
      { name: 'Capital Gains Advisors', arn: 'ARN-12009', city: 'Bangalore', tier: CommissionTier.GROWTH },
      { name: 'Trusteeship Group', arn: 'ARN-12010', city: 'Mumbai', tier: CommissionTier.STARTER },
    ];

    const subBrokers = [];

    for (let i = 0; i < subBrokerNames.length; i++) {
      const sbData = subBrokerNames[i];
      const regionalHead = regionalHeads[i % regionalHeads.length];

      const subBroker = await prisma.subBroker.create({
        data: {
          id: uuidv4(),
          code: `TRUSTNER-SB-${String(i + 1).padStart(5, '0')}`,
          name: sbData.name,
          arn: sbData.arn,
          email: `contact@${sbData.name.toLowerCase().replace(/\s+/g, '-')}.com`,
          phone: `+9198765${4000 + i}`,
          city: sbData.city,
          branch: sbData.city,
          regionalHeadId: regionalHead.id,
          status: i < 3 ? SubBrokerStatus.APPROVED : SubBrokerStatus.PENDING_APPROVAL,
          commissionTier: sbData.tier,
          aum: sbData.tier === CommissionTier.STARTER ? 5000000 :
               sbData.tier === CommissionTier.GROWTH ? 25000000 :
               sbData.tier === CommissionTier.SENIOR ? 100000000 : 300000000,
          clientCount: Math.floor(Math.random() * 50) + 5,
          sipBookSize: Math.floor(Math.random() * 100) + 10,
          totalCommissionEarned: Math.random() * 500000,
        },
      });

      subBrokers.push(subBroker);
    }

    console.log('✓ Sub-brokers created\n');

    // ============================================================================
    // 4. CREATE MF SCHEMES
    // ============================================================================
    console.log('📝 Creating MF schemes...');

    const schemeCategories = [
      { name: 'Large Cap Equity Fund', category: 'Large Cap' },
      { name: 'Mid Cap Growth Fund', category: 'Mid Cap' },
      { name: 'Flexi Cap Dynamic Fund', category: 'Flexi Cap' },
      { name: 'Debt Fixed Income Fund', category: 'Debt' },
      { name: 'Hybrid Balanced Fund', category: 'Hybrid' },
      { name: 'Small Cap Opportunities', category: 'Small Cap' },
      { name: 'Multi Asset Diversified Fund', category: 'Multi Asset' },
      { name: 'Liquid Money Market Fund', category: 'Liquid' },
    ];

    const schemes = [];
    for (let i = 0; i < schemeCategories.length; i++) {
      const scheme = await prisma.scheme.create({
        data: {
          id: uuidv4(),
          code: `SCHEME-${String(i + 1).padStart(5, '0')}`,
          name: schemeCategories[i].name,
          amfiCode: `100${i + 1}`,
          category: schemeCategories[i].category,
          nav: 100 + Math.random() * 500,
          aum: Math.random() * 10000000000,
          expenseRatio: Math.random() * 2.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create commission rates for the scheme
      await prisma.commissionRate.create({
        data: {
          id: uuidv4(),
          schemeId: scheme.id,
          type: 'LUMPSUM',
          rate: Math.random() * 1.5 + 0.5, // 0.5% - 2%
        },
      });

      await prisma.commissionRate.create({
        data: {
          id: uuidv4(),
          schemeId: scheme.id,
          type: 'SIP',
          rate: Math.random() * 1.0 + 0.3, // 0.3% - 1.3%
        },
      });

      schemes.push(scheme);
    }

    console.log('✓ MF schemes created\n');

    // ============================================================================
    // 5. CREATE SAMPLE CLIENTS
    // ============================================================================
    console.log('📝 Creating sample clients...');

    const clientNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh',
      'Ananya Desai', 'Rohan Verma', 'Pooja Joshi', 'Arjun Nair', 'Divya Iyer',
      'Sanjay Mehta', 'Zara Khan', 'Nikhil Agarwal', 'Esha Bansal', 'Kabir Malhotra',
    ];

    const clients = [];
    for (let i = 0; i < clientNames.length; i++) {
      const subBroker = subBrokers[i % subBrokers.length];
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: `${clientNames[i].toLowerCase().replace(/\s+/g, '.')}@email.com`,
          name: clientNames[i],
          phone: `+9198765${5000 + i}`,
          password: hashPassword('Client@2026'),
          role: UserRole.CLIENT,
          clientId: uuidv4(),
          isActive: true,
          emailVerified: false,
        },
      });

      const client = await prisma.client.create({
        data: {
          id: user.clientId!,
          externalClientId: `CLI-${String(i + 1).padStart(5, '0')}`,
          subBrokerId: subBroker.id,
          name: clientNames[i],
          email: user.email,
          phone: user.phone,
          pan: `PAN${String(i + 1).padStart(7, '0')}A`,
          aadhaar: `AADHAAR${String(i + 1).padStart(6, '0')}`,
          status: i < 10 ? ClientStatus.ACTIVE : ClientStatus.KYC_PENDING,
          kycStatus: i < 10 ? 'COMPLETE' : 'NOT_STARTED',
          annualIncome: Math.random() * 5000000 + 500000,
          investmentGoal: 'RETIREMENT',
          riskProfile: 'MODERATE',
          createdAt: new Date(),
        },
      });

      clients.push(client);
    }

    console.log('✓ Sample clients created\n');

    // ============================================================================
    // 6. CREATE SAMPLE HOLDINGS
    // ============================================================================
    console.log('📝 Creating sample holdings...');

    for (const client of clients.slice(0, 10)) {
      const selectedSchemes = schemes.slice(0, Math.floor(Math.random() * 4) + 1);

      for (const scheme of selectedSchemes) {
        await prisma.holding.create({
          data: {
            id: uuidv4(),
            clientId: client.id,
            schemeId: scheme.id,
            units: Math.random() * 1000 + 100,
            purchaseNav: 100,
            purchaseValue: (Math.random() * 500000 + 50000),
            currentNav: scheme.nav,
            currentValue: (Math.random() * 500000 + 50000),
            gains: Math.random() * 50000 - 10000,
            xirr: Math.random() * 15 + 5,
            acquiredAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log('✓ Sample holdings created\n');

    // ============================================================================
    // 7. CREATE SAMPLE TRANSACTIONS
    // ============================================================================
    console.log('📝 Creating sample transactions...');

    for (let i = 0; i < 50; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const scheme = schemes[Math.floor(Math.random() * schemes.length)];

      await prisma.transaction.create({
        data: {
          id: uuidv4(),
          clientId: client.id,
          subBrokerId: client.subBrokerId,
          schemeId: scheme.id,
          code: `TXN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(i + 1).padStart(5, '0')}`,
          type: 'LUMPSUM',
          transactionAmount: Math.random() * 100000 + 10000,
          units: Math.random() * 1000 + 100,
          nav: scheme.nav,
          status: i < 30 ? 'ALLOTMENT_DONE' : 'SUBMITTED_TO_BSE',
          bseOrderId: `BSE-${i + 1}`,
          bseOrderStatus: i < 30 ? 'ALLOTED' : 'PENDING',
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log('✓ Sample transactions created\n');

    // ============================================================================
    // 8. CREATE SYSTEM CONFIGURATION
    // ============================================================================
    console.log('📝 Creating system configuration...');

    const systemConfigs = [
      { key: 'TDS_RATE', value: '5' },
      { key: 'GST_RATE', value: '18' },
      { key: 'TDS_THRESHOLD', value: '15000' },
      { key: 'STARTER_TIER_REVENUE_SHARE', value: '50' },
      { key: 'GROWTH_TIER_REVENUE_SHARE', value: '60' },
      { key: 'SENIOR_TIER_REVENUE_SHARE', value: '65' },
      { key: 'ELITE_TIER_REVENUE_SHARE', value: '70' },
      { key: 'MAX_LOGIN_ATTEMPTS', value: '5' },
      { key: 'LOCKOUT_DURATION_MINUTES', value: '30' },
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: {
          id: uuidv4(),
          key: config.key,
          value: config.value,
          description: `Configuration: ${config.key}`,
        },
      });
    }

    console.log('✓ System configuration created\n');

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin users: 3`);
    console.log(`   - Regional heads: ${regionalHeads.length}`);
    console.log(`   - Sub-brokers: ${subBrokers.length}`);
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - MF Schemes: ${schemes.length}`);
    console.log(`   - Holdings: ~${Math.min(10, clients.length) * 2}`);
    console.log(`   - Transactions: 50`);
    console.log(`   - System configs: ${systemConfigs.length}`);
    console.log('\n🚀 Ready to start development!');
    console.log('\n📝 Test Credentials:');
    console.log('   - Super Admin: admin@trustner.in / TrustnerAdmin@2026');
    console.log('   - Compliance: compliance@trustner.in / ComplianceAdmin@2026');
    console.log('   - Finance: finance@trustner.in / FinanceAdmin@2026');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
