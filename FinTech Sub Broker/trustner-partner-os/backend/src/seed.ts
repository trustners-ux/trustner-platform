import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Database Seed Script
 * Creates initial MIS users for Trustner Partner OS
 *
 * Users:
 * 1. ram@trustner.in - SUPER_ADMIN (Admin)
 * 2. sangeeta@trustner.in - SUPER_ADMIN (Admin)
 * 3. ajanta.saikia@trustner.in - PRINCIPAL_OFFICER (Senior Management)
 * 4. abir@trustner.in - PRINCIPAL_OFFICER (Senior Management)
 * 5. trustnermis@gmail.com - MIS_MANAGER (Hirak Jyoti Das)
 * 6. rinjima.das@trustner.in - MIS_CHECKER (Checker Manager)
 *
 * Usage: npm run prisma:seed
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    const hashPassword = (password: string) => bcrypt.hashSync(password, 12);

    // ============================================================================
    // MIS USERS - Core Team
    // ============================================================================
    console.log('📝 Creating MIS users...');

    // 1. Super Admin - Ram
    const adminUser = await prisma.user.upsert({
      where: { email: 'ram@trustner.in' },
      update: {},
      create: {
        email: 'ram@trustner.in',
        name: 'Ram',
        phone: '+919876543210',
        passwordHash: hashPassword('Trustner@2026'),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
        isEmailVerified: true,
      },
    });
    console.log(`  ✓ Admin: ram@trustner.in (Password: Trustner@2026)`);

    // 2. Super Admin - Sangeeta
    const sangeetaUser = await prisma.user.upsert({
      where: { email: 'sangeeta@trustner.in' },
      update: {},
      create: {
        email: 'sangeeta@trustner.in',
        name: 'Sangeeta',
        phone: '+919876543214',
        passwordHash: hashPassword('Trustner@2026'),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
        isEmailVerified: true,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ Admin: sangeeta@trustner.in (Password: Trustner@2026)`);

    // 3. Principal Officer - Ajanta Saikia (Senior Management)
    const poUser = await prisma.user.upsert({
      where: { email: 'ajanta.saikia@trustner.in' },
      update: {},
      create: {
        email: 'ajanta.saikia@trustner.in',
        name: 'Ajanta Saikia',
        phone: '+919876543211',
        passwordHash: hashPassword('Trustner@2026'),
        role: UserRole.PRINCIPAL_OFFICER,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
        isEmailVerified: true,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ Principal Officer: ajanta.saikia@trustner.in (Password: Trustner@2026)`);

    // 4. Principal Officer - Abir (Senior Management)
    const abirUser = await prisma.user.upsert({
      where: { email: 'abir@trustner.in' },
      update: {},
      create: {
        email: 'abir@trustner.in',
        name: 'Abir',
        phone: '+919876543215',
        passwordHash: hashPassword('Trustner@2026'),
        role: UserRole.PRINCIPAL_OFFICER,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
        isEmailVerified: true,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ Principal Officer: abir@trustner.in (Password: Trustner@2026)`);

    // 5. MIS Manager - Hirak Jyoti Das
    const misManager = await prisma.user.upsert({
      where: { email: 'trustnermis@gmail.com' },
      update: {},
      create: {
        email: 'trustnermis@gmail.com',
        name: 'Hirak Jyoti Das',
        phone: '+919876543212',
        passwordHash: hashPassword('Trustner@2026'),
        role: UserRole.MIS_MANAGER,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
        isEmailVerified: true,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ MIS Manager: trustnermis@gmail.com (Password: Trustner@2026)`);

    // 6. Checker Manager - Rinjima Das
    const checkerUser = await prisma.user.upsert({
      where: { email: 'rinjima.das@trustner.in' },
      update: {},
      create: {
        email: 'rinjima.das@trustner.in',
        name: 'Rinjima Das',
        phone: '+919876543213',
        passwordHash: hashPassword('Trustner@2026'),
        role: UserRole.MIS_CHECKER,
        isActive: true,
        isApproved: true,
        mustChangePassword: true,
        isEmailVerified: true,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
    console.log(`  ✓ Checker Manager: rinjima.das@trustner.in (Password: Trustner@2026)`);

    // ============================================================================
    // HIERARCHY LEVELS — SM → CDM → RM → POSP
    // ============================================================================
    console.log('\n📊 Creating hierarchy levels...');

    const levelSM = await prisma.hierarchyLevel.upsert({
      where: { levelCode: 'SM' },
      update: {},
      create: {
        levelNumber: 1,
        levelName: 'Senior Management',
        levelCode: 'SM',
        description: 'Top-level leadership with full access',
        isActive: true,
      },
    });
    console.log('  ✓ Level 1: Senior Management (SM)');

    const levelCDM = await prisma.hierarchyLevel.upsert({
      where: { levelCode: 'CDM' },
      update: {},
      create: {
        levelNumber: 2,
        levelName: 'Cluster Development Manager',
        levelCode: 'CDM',
        description: 'Manages a cluster of Relationship Managers',
        isActive: true,
      },
    });
    console.log('  ✓ Level 2: Cluster Development Manager (CDM)');

    const levelRM = await prisma.hierarchyLevel.upsert({
      where: { levelCode: 'RM' },
      update: {},
      create: {
        levelNumber: 3,
        levelName: 'Relationship Manager',
        levelCode: 'RM',
        description: 'Manages POSPs and handles day-to-day operations',
        isActive: true,
      },
    });
    console.log('  ✓ Level 3: Relationship Manager (RM)');

    const levelPOSP = await prisma.hierarchyLevel.upsert({
      where: { levelCode: 'POSP' },
      update: {},
      create: {
        levelNumber: 4,
        levelName: 'Point of Sale Person',
        levelCode: 'POSP',
        description: 'Field agent selling insurance policies',
        isActive: true,
      },
    });
    console.log('  ✓ Level 4: Point of Sale Person (POSP)');

    // ============================================================================
    // HIERARCHY NODES — All SM users as top-level Senior Management
    // ============================================================================
    console.log('\n🌳 Creating hierarchy nodes...');

    // Helper to create/update hierarchy node
    async function ensureHierarchyNode(userId: string, levelId: string, parentId: string | null, label: string) {
      const existing = await prisma.salesHierarchyNode.findFirst({
        where: { userId, hierarchyLevelId: levelId },
      });
      if (existing) {
        // Update parentId if needed
        if (existing.parentId !== parentId) {
          await prisma.salesHierarchyNode.update({
            where: { id: existing.id },
            data: { parentId },
          });
          console.log(`  ↻ ${label} (updated parent)`);
        } else {
          console.log(`  ⏩ ${label} (already exists)`);
        }
        return existing;
      }
      const node = await prisma.salesHierarchyNode.create({
        data: { userId, hierarchyLevelId: levelId, parentId, isActive: true },
      });
      console.log(`  ✓ ${label}`);
      return node;
    }

    // Clean up any incorrectly-placed nodes (e.g., Ajanta as CDM should be SM)
    const wrongAjantaCDM = await prisma.salesHierarchyNode.findFirst({
      where: { userId: poUser.id, hierarchyLevelId: levelCDM.id },
    });
    if (wrongAjantaCDM) {
      await prisma.salesHierarchyNode.delete({ where: { id: wrongAjantaCDM.id } });
      console.log('  🗑️  Removed Ajanta CDM node (promoting to SM)');
    }

    // Ram as SM (top node)
    const ramNode = await ensureHierarchyNode(adminUser.id, levelSM.id, null, 'Ram → Senior Management (top node)');

    // Sangeeta as SM (top node)
    await ensureHierarchyNode(sangeetaUser.id, levelSM.id, null, 'Sangeeta → Senior Management (top node)');

    // Ajanta as SM (top node — Senior Management per Ram's instructions)
    await ensureHierarchyNode(poUser.id, levelSM.id, null, 'Ajanta Saikia → Senior Management (top node)');

    // Abir as SM (top node — Senior Management per Ram's instructions)
    await ensureHierarchyNode(abirUser.id, levelSM.id, null, 'Abir → Senior Management (top node)');

    // ============================================================================
    // BRANCH — Head Office
    // ============================================================================
    console.log('\n🏢 Creating branches...');

    const headOffice = await prisma.branch.upsert({
      where: { code: 'HO-GHY-001' },
      update: {},
      create: {
        code: 'HO-GHY-001',
        name: 'Trustner Head Office',
        type: 'HEAD_OFFICE',
        city: 'Guwahati',
        state: 'Assam',
        pincode: '781001',
        headId: adminUser.id,
        isActive: true,
      },
    });
    console.log(`  ✓ Head Office: ${headOffice.name} (${headOffice.code})`);

    // ============================================================================
    // MIS ROLE CONFIGS — Assign maker/checker permissions
    // ============================================================================
    console.log('\n🔐 Creating MIS role configurations...');

    const departments = [null, 'HEALTH', 'LIFE', 'GENERAL'] as const;

    // Helper for MISRoleConfig upsert
    async function ensureMISRoleConfig(
      userId: string,
      department: string | null,
      permissions: { canMake: boolean; canCheck: boolean; canViewReports: boolean; canManageContest: boolean },
      assignedById: string,
      label: string,
    ) {
      const dept = department as any;
      const regionName = null;
      const existing = await prisma.mISRoleConfig.findFirst({
        where: { userId, department: dept, regionName },
      });
      if (existing) {
        console.log(`  ⏩ ${label} (already exists)`);
        return existing;
      }
      const config = await prisma.mISRoleConfig.create({
        data: {
          userId,
          department: dept,
          regionName,
          ...permissions,
          isActive: true,
          assignedBy: assignedById,
        },
      });
      console.log(`  ✓ ${label}`);
      return config;
    }

    // Ram & Sangeeta: Full permissions (all departments)
    await ensureMISRoleConfig(adminUser.id, null,
      { canMake: true, canCheck: true, canViewReports: true, canManageContest: true },
      adminUser.id, 'Ram → Full MIS permissions (all depts)');
    await ensureMISRoleConfig(sangeetaUser.id, null,
      { canMake: true, canCheck: true, canViewReports: true, canManageContest: true },
      adminUser.id, 'Sangeeta → Full MIS permissions (all depts)');

    // Ajanta & Abir: View reports + manage contests (Senior Management)
    await ensureMISRoleConfig(poUser.id, null,
      { canMake: false, canCheck: false, canViewReports: true, canManageContest: true },
      adminUser.id, 'Ajanta → Reports & Contests (SM)');
    await ensureMISRoleConfig(abirUser.id, null,
      { canMake: false, canCheck: false, canViewReports: true, canManageContest: true },
      adminUser.id, 'Abir → Reports & Contests (SM)');

    // Hirak (MIS_MANAGER): Can make entries + view reports
    await ensureMISRoleConfig(misManager.id, null,
      { canMake: true, canCheck: false, canViewReports: true, canManageContest: false },
      adminUser.id, 'Hirak → Maker + Reports (MIS Manager)');

    // Rinjima (MIS_CHECKER): Can check entries + view reports
    await ensureMISRoleConfig(checkerUser.id, null,
      { canMake: false, canCheck: true, canViewReports: true, canManageContest: false },
      adminUser.id, 'Rinjima → Checker + Reports (MIS Checker)');

    // ============================================================================
    // CHECKER ASSIGNMENT RULES — Auto-assign checker based on maker role
    // ============================================================================
    console.log('\n⚖️  Creating checker assignment rules...');

    const checkerRules = [
      { makerRole: UserRole.RELATIONSHIP_MANAGER, checkerRole: UserRole.MIS_CHECKER, priority: 1 },
      { makerRole: UserRole.MIS_ENTRY_OPERATOR, checkerRole: UserRole.MIS_CHECKER, priority: 1 },
      { makerRole: UserRole.MIS_CHECKER, checkerRole: UserRole.CLUSTER_DEVELOPMENT_MANAGER, priority: 1 },
      { makerRole: UserRole.MIS_MANAGER, checkerRole: UserRole.PRINCIPAL_OFFICER, priority: 1 },
    ];

    for (const rule of checkerRules) {
      const existing = await prisma.checkerAssignmentRule.findFirst({
        where: { makerRole: rule.makerRole, checkerRole: rule.checkerRole, isActive: true },
      });
      if (!existing) {
        await prisma.checkerAssignmentRule.create({ data: { ...rule, isActive: true } });
        console.log(`  ✓ ${rule.makerRole} → ${rule.checkerRole}`);
      } else {
        console.log(`  ⏩ ${rule.makerRole} → ${rule.checkerRole} (already exists)`);
      }
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   MIS Users: 6');
    console.log('   Hierarchy Levels: 4 (SM → CDM → RM → POSP)');
    console.log('   Hierarchy Nodes: 4 (Ram, Sangeeta, Ajanta, Abir = all SM)');
    console.log('   Branches: 1 (Trustner Head Office)');
    console.log('   MIS Role Configs: 6');
    console.log('   Checker Assignment Rules: 4');
    console.log('\n🔐 Login Credentials (all users must change password on first login):');
    console.log('   1. ram@trustner.in / Trustner@2026 (SUPER_ADMIN)');
    console.log('   2. sangeeta@trustner.in / Trustner@2026 (SUPER_ADMIN)');
    console.log('   3. ajanta.saikia@trustner.in / Trustner@2026 (PRINCIPAL_OFFICER / SM)');
    console.log('   4. abir@trustner.in / Trustner@2026 (PRINCIPAL_OFFICER / SM)');
    console.log('   5. trustnermis@gmail.com / Trustner@2026 (MIS_MANAGER)');
    console.log('   6. rinjima.das@trustner.in / Trustner@2026 (MIS_CHECKER)');
    console.log('\n🌳 Hierarchy: Ram, Sangeeta, Ajanta, Abir (all SM) → [create CDM/RM users via admin]');
    console.log('\n⚠️  All users are required to change their password on first login.');
    console.log('   Password requirements: Min 8 characters, alphanumeric');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
