import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyStatus, InsuranceDepartment } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class DataMigrationService {
  private readonly logger = new Logger(DataMigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ──────────────────────────────────────────────
  private toDateOrNull(val: any): Date | null {
    if (!val || val === '' || val === 'N/A') return null;
    // Handle DD-MMM-YYYY format (e.g., "28-Dec-2023")
    const ddMmmYyyy = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
    const match = val.match?.(ddMmmYyyy);
    if (match) {
      const d = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private toDecimalOrNull(val: any): number | null {
    if (val === undefined || val === null || val === '' || val === 'N/A') return null;
    const cleaned = String(val).replace(/,/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? null : n;
  }

  private cleanStr(val: any): string | null {
    if (!val || val === '' || val === 'N/A' || val === 'null') return null;
    return String(val).trim();
  }

  // ─── 1. Import Clients ────────────────────────────────────
  async importClients(rows: any[], userId: string) {
    this.logger.log(`Importing ${rows.length} clients...`);

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    // Get existing client names to skip duplicates
    const existing = await this.prisma.insuranceClient.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existing.map((c) => c.name?.toUpperCase()));

    // Get the last client code number
    const lastClient = await this.prisma.insuranceClient.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { clientCode: true },
    });
    let nextNum = 1;
    if (lastClient?.clientCode) {
      const m = lastClient.clientCode.match(/TIB-CLT-(\d+)/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }

    for (const row of rows) {
      try {
        const name = this.cleanStr(row.name || row.Name || row['Insured Name']);
        if (!name) {
          results.skipped++;
          continue;
        }

        if (existingNames.has(name.toUpperCase())) {
          results.skipped++;
          continue;
        }

        const clientCode = `TIB-CLT-${String(nextNum).padStart(5, '0')}`;
        nextNum++;

        await this.prisma.insuranceClient.create({
          data: {
            clientCode,
            name,
            phone: this.cleanStr(row.mobile || row.MobileNo || row.phone || row['Mobile Number']),
            email: this.cleanStr(row.email || row.Email || row['Email Id']),
            groupHeadName: this.cleanStr(row.groupHead || row['Group Head']),
            city: this.cleanStr(row.city || row.City),
            createdBy: userId,
          },
        });

        existingNames.add(name.toUpperCase());
        results.created++;
      } catch (err) {
        results.errors.push(`Row ${results.created + results.skipped + results.errors.length + 1}: ${err.message}`);
      }
    }

    this.logger.log(`Client import complete: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`);
    return results;
  }

  // ─── 2. Import MIS Entries (Policy Register) ─────────────
  async importPolicyRegister(rows: any[], userId: string) {
    this.logger.log(`Importing ${rows.length} policy register entries...`);

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    // Get existing policy numbers to skip duplicates
    const existing = await this.prisma.mISEntry.findMany({
      select: { policyNumber: true },
      where: { policyNumber: { not: null } },
    });
    const existingPolicies = new Set(existing.map((e) => e.policyNumber?.toUpperCase()));

    // Get the current max MIS entry count for unique misCode generation
    let misSeq = await this.prisma.mISEntry.count();

    for (const row of rows) {
      try {
        const policyNo = this.cleanStr(row.policyNo || row['Policy No'] || row.policyNumber);
        const customerName = this.cleanStr(row.insuredName || row['Insured Name'] || row.customerName);

        if (!customerName) {
          results.skipped++;
          continue;
        }

        if (policyNo && existingPolicies.has(policyNo.toUpperCase())) {
          results.skipped++;
          continue;
        }

        // Determine LOB from Insurance Type
        const insType = (row.insuranceType || row['Insurance Type'] || '').toUpperCase();
        let lob = 'OTHER';
        if (insType.includes('MOTOR') || insType.includes('TWO WHEELER') || insType.includes('FOUR WHEELER') || insType.includes('COMMERCIAL')) {
          if (insType.includes('TWO')) lob = 'MOTOR_TWO_WHEELER';
          else if (insType.includes('COMMERCIAL') || insType.includes('GCV') || insType.includes('PCV')) lob = 'MOTOR_COMMERCIAL';
          else lob = 'MOTOR_FOUR_WHEELER';
        } else if (insType.includes('HEALTH')) {
          lob = 'HEALTH_INDIVIDUAL';
        } else if (insType.includes('FIRE')) {
          lob = 'FIRE';
        } else if (insType.includes('MARINE')) {
          lob = 'MARINE';
        } else if (insType.includes('BURGLARY') || insType.includes('MISC')) {
          lob = 'OTHER';
        } else if (insType.includes('PA') || insType.includes('PERSONAL ACCIDENT')) {
          lob = 'PA_PERSONAL_ACCIDENT';
        }

        misSeq++;
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const misCode = `MIS-VJ-${date}-${String(misSeq).padStart(6, '0')}`;

        const entryDate = this.toDateOrNull(row.from || row.From || row['Policy Start Date']);

        const policyTypeStr = this.cleanStr(row.policyType || row['Policy Type'] || row['Insurance Type']);

        await this.prisma.mISEntry.create({
          data: {
            misCode,
            customerName,
            policyNumber: policyNo,
            insurerName: this.cleanStr(row.company || row.Company || row['Company Name']),
            lob,
            department: this.resolveDepartment(lob, policyTypeStr || insType),
            sourceType: 'VJ_INFOSOFT_IMPORT',
            entryDate: entryDate || new Date(),
            entryMonth: this.getEntryMonth(entryDate),
            policyStartDate: this.toDateOrNull(row.from || row.From || row['Policy Start Date'] || row['Risk Start']),
            policyEndDate: this.toDateOrNull(row.to || row.To || row['Policy End Date'] || row['End Date']),
            pospName: this.cleanStr(row.posName || row['POS Name']),
            branchName: this.cleanStr(row.branchName || row['Branch Name']),
            sumInsured: this.toDecimalOrNull(row.sumInsured || row['Sum Insured'] || row.SA),
            odPremium: this.toDecimalOrNull(row.basicOdPremium || row['Basic/OD Premium'] || row['Basic/OD'] || row['OD Premium']),
            tpPremium: this.toDecimalOrNull(row.tpPremium || row['TP Premium'] || row.TP),
            netPremium: this.toDecimalOrNull(row.netPremium || row.NetPremium || row['Net Premium']),
            gstAmount: this.toDecimalOrNull(row.gst || row.GST),
            grossPremium: this.toDecimalOrNull(row.finalPremium || row['Final Premium'] || row['Gross Premium'] || row.Total),
            vehicleRegNo: this.cleanStr(row.regNo || row['Reg No'] || row['Reg. No']),
            vehicleMake: this.cleanStr(row.make || row.Make),
            policyType: policyTypeStr,
            status: 'VERIFIED',
            makerId: userId,
          },
        });

        if (policyNo) existingPolicies.add(policyNo.toUpperCase());
        results.created++;
      } catch (err) {
        results.errors.push(`Row ${results.created + results.skipped + results.errors.length + 1}: ${err.message}`);
      }
    }

    this.logger.log(`Policy import complete: ${results.created} created, ${results.skipped} skipped`);
    return results;
  }

  // ─── 3. Import POS Payout / Commission Data ──────────────
  async importPayoutData(rows: any[], userId: string) {
    this.logger.log(`Importing ${rows.length} payout records as MIS entries...`);

    const results = { created: 0, skipped: 0, updated: 0, errors: [] as string[] };
    let misSeq = await this.prisma.mISEntry.count();

    for (const row of rows) {
      try {
        const policyNo = this.cleanStr(row.policyNo || row['Policy No']);
        const customerName = this.cleanStr(row.customerName || row['Customer Name']);

        if (!customerName && !policyNo) {
          results.skipped++;
          continue;
        }

        // Check if a MIS entry with this policy number already exists
        if (policyNo) {
          const existing = await this.prisma.mISEntry.findFirst({
            where: { policyNumber: { equals: policyNo, mode: 'insensitive' } },
          });

          if (existing) {
            // Update with commission data
            await this.prisma.mISEntry.update({
              where: { id: existing.id },
              data: {
                commissionAmount: this.toDecimalOrNull(row['POS Payable Amount'] || row.posPayableAmount),
                pospName: this.cleanStr(row['POS Name'] || row.posName) || existing.pospName,
                referredBy: this.cleanStr(row['RM Name'] || row.rmName) || existing.referredBy,
              },
            });
            results.updated++;
            continue;
          }
        }

        // Create new MIS entry from payout data
        const insType = (row['Insurance Type'] || row.insuranceType || '').toUpperCase();
        let lob = 'OTHER';
        if (insType.includes('MOTOR')) lob = 'MOTOR_FOUR_WHEELER';
        else if (insType.includes('HEALTH')) lob = 'HEALTH_INDIVIDUAL';
        else if (insType.includes('FIRE')) lob = 'FIRE';
        else if (insType.includes('MARINE')) lob = 'MARINE';

        misSeq++;
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');

        const payoutPolicyType = this.cleanStr(row['Policy Type'] || row.policyType);

        await this.prisma.mISEntry.create({
          data: {
            misCode: `MIS-VJ-${date}-${String(misSeq).padStart(6, '0')}`,
            customerName: customerName || 'Unknown',
            policyNumber: policyNo,
            insurerName: this.cleanStr(row['Company Name'] || row.companyName),
            lob,
            department: this.resolveDepartment(lob, payoutPolicyType || insType),
            sourceType: 'VJ_INFOSOFT_IMPORT',
            entryDate: this.toDateOrNull(row['Login Date'] || row.loginDate) || new Date(),
            entryMonth: this.getEntryMonth(this.toDateOrNull(row['Login Date'] || row.loginDate)),
            policyStartDate: this.toDateOrNull(row['Policy Start Date'] || row.policyStartDate),
            policyEndDate: this.toDateOrNull(row['Policy End Date'] || row.policyEndDate),
            pospName: this.cleanStr(row['POS Name'] || row.posName),
            branchName: this.cleanStr(row['Branch Name'] || row.branchName),
            sumInsured: this.toDecimalOrNull(row['Sum Insured'] || row.sumInsured),
            odPremium: this.toDecimalOrNull(row['OD Premium'] || row.odPremium),
            tpPremium: this.toDecimalOrNull(row['TP Premium'] || row.tpPremium),
            netPremium: this.toDecimalOrNull(row['Net Premium'] || row.netPremium),
            grossPremium: this.toDecimalOrNull(row['Gross Premium'] || row.grossPremium),
            commissionAmount: this.toDecimalOrNull(row['POS Payable Amount'] || row.posPayableAmount),
            vehicleRegNo: this.cleanStr(row['Reg No'] || row.regNo),
            vehicleMake: this.cleanStr(row.Make || row.make),
            policyType: payoutPolicyType,
            referredBy: this.cleanStr(row['RM Name'] || row.rmName),
            status: 'VERIFIED',
            makerId: userId,
          },
        });

        results.created++;
      } catch (err) {
        results.errors.push(`Row ${results.created + results.skipped + results.errors.length + 1}: ${err.message}`);
      }
    }

    this.logger.log(`Payout import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`);
    return results;
  }

  // ─── 4. Import Renewal Due Data ───────────────────────────
  async importRenewalDue(rows: any[], userId: string) {
    this.logger.log(`Importing ${rows.length} renewal due records...`);

    const results = { created: 0, skipped: 0, updated: 0, errors: [] as string[] };
    let misSeq = await this.prisma.mISEntry.count();

    for (const row of rows) {
      try {
        const policyNo = this.cleanStr(row.policyNo || row['Policy No']);
        const insuredName = this.cleanStr(row.insuredName || row['Insured Name']);

        if (!insuredName && !policyNo) {
          results.skipped++;
          continue;
        }

        // Check if policy already exists as MIS entry
        if (policyNo) {
          const existing = await this.prisma.mISEntry.findFirst({
            where: { policyNumber: { equals: policyNo.replace(/^\*/, ''), mode: 'insensitive' } },
          });

          if (existing) {
            // Update with renewal info
            await this.prisma.mISEntry.update({
              where: { id: existing.id },
              data: {
                isRenewal: true,
                customerPhone: this.cleanStr(row.ContNo || row.contNo) || existing.customerPhone,
                customerEmail: this.cleanStr(row.Email || row.email) || existing.customerEmail,
              },
            });
            results.updated++;
            continue;
          }
        }

        // Create as new MIS entry for renewal tracking
        const insType = (row['Insurance Type'] || row.insuranceType || '').toUpperCase();
        let lob = 'OTHER';
        if (insType.includes('MOTOR')) lob = 'MOTOR_FOUR_WHEELER';
        else if (insType.includes('HEALTH')) lob = 'HEALTH_INDIVIDUAL';
        else if (insType.includes('FIRE')) lob = 'FIRE';

        misSeq++;
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');

        const renewalPolicyType = this.cleanStr(row['Product Name'] || row.productName);

        await this.prisma.mISEntry.create({
          data: {
            misCode: `MIS-VJ-${date}-${String(misSeq).padStart(6, '0')}`,
            customerName: insuredName || 'Unknown',
            customerPhone: this.cleanStr(row.ContNo || row.contNo),
            customerEmail: this.cleanStr(row.Email || row.email),
            policyNumber: policyNo ? policyNo.replace(/^\*/, '') : null,
            insurerName: this.cleanStr(row['Ins. Co.'] || row.insCo),
            lob,
            department: this.resolveDepartment(lob, renewalPolicyType || insType),
            sourceType: 'VJ_INFOSOFT_IMPORT',
            entryDate: this.toDateOrNull(row['Login Date'] || row.loginDate) || new Date(),
            entryMonth: this.getEntryMonth(this.toDateOrNull(row['Login Date'] || row.loginDate)),
            policyStartDate: this.toDateOrNull(row['Risk Start'] || row.riskStart),
            policyEndDate: this.toDateOrNull(row['End Date'] || row.endDate),
            pospName: this.cleanStr(row['POS Name'] || row.posName),
            branchName: this.cleanStr(row['Branch Name'] || row.branchName),
            sumInsured: this.toDecimalOrNull(row.SA || row.sa),
            odPremium: this.toDecimalOrNull(row['Basic/OD'] || row.basicOd),
            tpPremium: this.toDecimalOrNull(row.TP || row.tp),
            netPremium: this.toDecimalOrNull(row['Net Premium'] || row.netPremium),
            gstAmount: this.toDecimalOrNull(row.GST || row.gst),
            grossPremium: this.toDecimalOrNull(row.Total || row.total),
            vehicleRegNo: this.cleanStr(row['Reg. No'] || row.regNo),
            vehicleMake: this.cleanStr(row.Make || row.make),
            policyType: renewalPolicyType,
            referredBy: this.cleanStr(row['RM Name'] || row.rmName),
            isRenewal: true,
            status: 'VERIFIED',
            makerId: userId,
          },
        });

        results.created++;
      } catch (err) {
        results.errors.push(`Row ${results.created + results.skipped + results.errors.length + 1}: ${err.message}`);
      }
    }

    this.logger.log(`Renewal import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`);
    return results;
  }

  // ─── 5. SYNC MIS Entries → InsurancePolicy ─────────────────
  // This creates InsurancePolicy records from VJ Infosoft imported MISEntry data
  // so they appear in the IB Dashboard and Policies page
  async syncMISToInsurancePolicies(userId: string) {
    this.logger.log('Syncing VJ Infosoft MIS entries to InsurancePolicy table...');

    const results = { synced: 0, skipped: 0, errors: [] as string[] };

    // Get all VJ Infosoft imported MIS entries that have a policy number
    const misEntries = await this.prisma.mISEntry.findMany({
      where: {
        sourceType: 'VJ_INFOSOFT_IMPORT',
        policyNumber: { not: null },
      },
    });

    this.logger.log(`Found ${misEntries.length} VJ Infosoft MIS entries to sync`);

    // Get existing InsurancePolicy numbers to avoid duplicates
    const existingPolicies = await this.prisma.insurancePolicy.findMany({
      select: { policyNumber: true },
    });
    const existingPolicySet = new Set(existingPolicies.map(p => p.policyNumber?.toUpperCase()));

    // Get or create a default POSP agent for imported data
    const defaultPosp = await this.getOrCreateDefaultPosp(userId);

    // Cache for companies and products (to avoid repeated lookups)
    const companyCache: Record<string, string> = {};
    const productCache: Record<string, string> = {};

    let seqCounter = await this.prisma.insurancePolicy.count();

    // Deduplicate MIS entries by policyNumber (keep first occurrence)
    const seenPolicyNumbers = new Set<string>();

    for (const mis of misEntries) {
      try {
        if (!mis.policyNumber) {
          results.skipped++;
          continue;
        }

        const policyUpper = mis.policyNumber.toUpperCase();

        // Skip if already synced to InsurancePolicy or already processed in this batch
        if (existingPolicySet.has(policyUpper) || seenPolicyNumbers.has(policyUpper)) {
          results.skipped++;
          continue;
        }
        seenPolicyNumbers.add(policyUpper);

        // Resolve LOB enum - ensure it's a valid InsuranceLOB value
        const lob = this.resolveValidLOB(mis.lob);

        // Get or create company
        const companyName = mis.insurerName || 'Unknown Insurer';
        const companyId = await this.getOrCreateCompany(companyName, companyCache);

        // Get or create product
        const productName = mis.policyType || `${lob} Policy`;
        const productKey = `${companyId}_${productName}`;
        const productId = await this.getOrCreateProduct(productName, companyId, lob, productCache, productKey);

        // Generate internal ref code with unique counter
        seqCounter++;
        const datePrefix = dayjs(mis.entryDate || mis.createdAt).format('YYYYMMDD');
        const internalRefCode = `TIBPL-POL-${datePrefix}-${String(seqCounter).padStart(6, '0')}`;

        // Calculate premium fields
        const netPremium = mis.netPremium ? Number(mis.netPremium) : 0;
        const gstAmount = mis.gstAmount ? Number(mis.gstAmount) : 0;
        const grossPremium = mis.grossPremium ? Number(mis.grossPremium) : 0;
        const odPremium = mis.odPremium ? Number(mis.odPremium) : 0;
        const tpPremium = mis.tpPremium ? Number(mis.tpPremium) : 0;
        const basePremium = odPremium + tpPremium || netPremium;
        const totalPremium = grossPremium || (netPremium + gstAmount) || netPremium;
        const sumInsured = mis.sumInsured ? Number(mis.sumInsured) : 0;

        // Determine policy status based on dates
        const now = new Date();
        const endDate = mis.policyEndDate;
        let status: PolicyStatus = PolicyStatus.POLICY_ACTIVE;
        if (endDate && endDate < now) {
          status = PolicyStatus.POLICY_EXPIRED;
        }

        await this.prisma.insurancePolicy.create({
          data: {
            policyNumber: mis.policyNumber,
            internalRefCode,
            pospId: defaultPosp.id,
            companyId,
            productId,
            lob: lob as any,
            status,
            customerName: mis.customerName || 'Unknown',
            customerPhone: mis.customerPhone || 'N/A',
            customerEmail: mis.customerEmail,
            sumInsured,
            basePremium,
            addOnPremium: 0,
            gstAmount,
            totalPremium,
            stampDuty: 0,
            netPremium,
            startDate: mis.policyStartDate,
            endDate: mis.policyEndDate,
            vehicleRegNumber: mis.vehicleRegNo,
            vehicleMake: mis.vehicleMake,
            policyType: mis.policyType,
            remarks: `Imported from VJ Infosoft. MIS Code: ${mis.misCode}`,
            createdAt: mis.entryDate || mis.createdAt,
          },
        });

        existingPolicySet.add(policyUpper);
        results.synced++;
      } catch (err) {
        results.errors.push(`MIS ${mis.misCode} (${mis.policyNumber}): ${err.message}`);
      }
    }

    this.logger.log(`Sync complete: ${results.synced} synced, ${results.skipped} skipped, ${results.errors.length} errors`);
    return results;
  }

  // ─── 6. SMART IMPORT: auto-detect, import, and sync ────────
  async smartImport(rows: any[], headers: string[], userId: string) {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('No data rows provided');
    }
    if (!headers || !Array.isArray(headers)) {
      // Try to extract headers from the first row's keys
      headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    }
    this.logger.log(`Smart import: ${rows.length} rows, headers: ${headers.slice(0, 5).join(', ')}...`);

    // Auto-detect CSV type from column headers
    const headerSet = new Set(headers.map(h => h.trim().toLowerCase()));
    let detectedType: 'clients' | 'policyRegister' | 'payoutData' | 'renewalDue' | 'unknown' = 'unknown';

    // Detection rules based on unique column signatures
    if (headerSet.has('group head') || headerSet.has('grouphead') ||
        (headerSet.has('name') && headerSet.has('mobileno') && !headerSet.has('policy no'))) {
      detectedType = 'clients';
    } else if (headerSet.has('pos payable amount') || headerSet.has('pospayableamount') ||
               headerSet.has('rm name') || headerSet.has('rmname')) {
      detectedType = 'payoutData';
    } else if ((headerSet.has('end date') || headerSet.has('enddate')) &&
               (headerSet.has('risk start') || headerSet.has('riskstart')) &&
               (headerSet.has('contno') || headerSet.has('cont no'))) {
      detectedType = 'renewalDue';
    } else if (headerSet.has('policy no') || headerSet.has('policyno') ||
               headerSet.has('insured name') || headerSet.has('insuredname') ||
               headerSet.has('insurance type') || headerSet.has('insurancetype')) {
      detectedType = 'policyRegister';
    }

    if (detectedType === 'unknown') {
      // Try broader detection
      if (headers.some(h => /policy/i.test(h)) && headers.some(h => /premium|insured/i.test(h))) {
        detectedType = 'policyRegister';
      } else if (headers.some(h => /name/i.test(h)) && headers.some(h => /mobile|phone/i.test(h))) {
        detectedType = 'clients';
      }
    }

    this.logger.log(`Detected CSV type: ${detectedType}`);

    // Run the appropriate import
    let importResult: any;
    switch (detectedType) {
      case 'clients':
        importResult = await this.importClients(rows, userId);
        break;
      case 'policyRegister':
        importResult = await this.importPolicyRegister(rows, userId);
        break;
      case 'payoutData':
        importResult = await this.importPayoutData(rows, userId);
        break;
      case 'renewalDue':
        importResult = await this.importRenewalDue(rows, userId);
        break;
      default:
        return {
          detectedType: 'unknown',
          error: 'Could not determine CSV type from column headers. Please use the individual import buttons instead.',
          headers: headers.slice(0, 10),
        };
    }

    // Auto-sync to InsurancePolicy (if we imported policy/payout/renewal data)
    let syncResult = null;
    if (detectedType !== 'clients') {
      try {
        syncResult = await this.syncMISToInsurancePolicies(userId);
      } catch (syncErr) {
        this.logger.error(`Sync failed: ${syncErr.message}`);
        syncResult = { synced: 0, skipped: 0, errors: [`Sync failed: ${syncErr.message}`] };
      }
    }

    return {
      detectedType,
      importResult,
      syncResult,
    };
  }

  // ─── 7. Get migration status ──────────────────────────────
  async getMigrationStatus() {
    const [totalClients, totalMIS, importedMIS, importedClients, totalPolicies, syncedPolicies] = await Promise.all([
      this.prisma.insuranceClient.count(),
      this.prisma.mISEntry.count(),
      this.prisma.mISEntry.count({ where: { sourceType: 'VJ_INFOSOFT_IMPORT' } }),
      this.prisma.insuranceClient.count(),
      this.prisma.insurancePolicy.count(),
      this.prisma.insurancePolicy.count({ where: { remarks: { contains: 'VJ Infosoft' } } }),
    ]);

    return {
      totalClients,
      totalMISEntries: totalMIS,
      importedFromVJ: importedMIS,
      importedClients,
      totalInsurancePolicies: totalPolicies,
      syncedToInsurancePolicy: syncedPolicies,
      needsSync: importedMIS - syncedPolicies,
    };
  }

  // ─── Private helpers ──────────────────────────────────────

  private getEntryMonth(date?: Date | null): string {
    const d = date || new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /** Determine InsuranceDepartment from LOB or insurance type string */
  private resolveDepartment(lob: string, insType?: string): InsuranceDepartment {
    const lobUpper = (lob || '').toUpperCase();
    const typeUpper = (insType || '').toUpperCase();

    // Life insurance
    if (lobUpper.startsWith('LIFE_') || typeUpper.includes('LIFE') || typeUpper.includes('ULIP') || typeUpper.includes('ENDOWMENT') || typeUpper.includes('TERM')) {
      return InsuranceDepartment.LIFE;
    }

    // Health insurance
    if (lobUpper.startsWith('HEALTH_') || lobUpper === 'HEALTH' || typeUpper.includes('HEALTH') || typeUpper.includes('MEDICLAIM') || typeUpper.includes('MEDICAL')) {
      return InsuranceDepartment.HEALTH;
    }

    // Everything else is General Insurance (motor, fire, marine, PA, travel, home, etc.)
    return InsuranceDepartment.GENERAL;
  }

  /** Ensure LOB value is a valid Prisma InsuranceLOB enum */
  private resolveValidLOB(lob: string | null): string {
    const validLOBs = [
      'MOTOR_TWO_WHEELER', 'MOTOR_FOUR_WHEELER', 'MOTOR_COMMERCIAL',
      'HEALTH_INDIVIDUAL', 'HEALTH_FAMILY_FLOATER', 'HEALTH_GROUP',
      'HEALTH_CRITICAL_ILLNESS', 'HEALTH_TOP_UP',
      'LIFE_TERM', 'LIFE_ENDOWMENT', 'LIFE_ULIP', 'LIFE_WHOLE_LIFE',
      'TRAVEL', 'HOME', 'FIRE', 'MARINE', 'LIABILITY', 'PA_PERSONAL_ACCIDENT', 'CYBER', 'OTHER',
    ];
    if (lob && validLOBs.includes(lob)) return lob;
    if (lob === 'PERSONAL_ACCIDENT' || lob === 'PA') return 'PA_PERSONAL_ACCIDENT';
    return 'OTHER';
  }

  /** Get or create a default POSP for VJ imports */
  private async getOrCreateDefaultPosp(userId: string) {
    const existing = await this.prisma.pOSPAgent.findFirst({
      where: { agentCode: 'TIBPL-VJ-DEFAULT' },
    });
    if (existing) return existing;

    return this.prisma.pOSPAgent.create({
      data: {
        agentCode: 'TIBPL-VJ-DEFAULT',
        firstName: 'VJ Infosoft',
        lastName: 'Import',
        phone: '0000000000',
        email: 'vjimport@trustner.in',
        status: 'ACTIVE',
      },
    });
  }

  /** Get or create insurance company by name */
  private async getOrCreateCompany(
    companyName: string,
    cache: Record<string, string>,
  ): Promise<string> {
    const key = companyName.toUpperCase().trim();
    if (cache[key]) return cache[key];

    // Try exact match first
    const existing = await this.prisma.insuranceCompany.findFirst({
      where: { companyName: { equals: companyName, mode: 'insensitive' } },
    });
    if (existing) {
      cache[key] = existing.id;
      return existing.id;
    }

    // Create new
    const company = await this.prisma.insuranceCompany.create({
      data: {
        companyName,
        shortCode: companyName.replace(/[^A-Z]/gi, '').substring(0, 8).toUpperCase() || 'UNK',
        status: 'ACTIVE',
      },
    });
    cache[key] = company.id;
    return company.id;
  }

  /** Get or create insurance product */
  private async getOrCreateProduct(
    productName: string,
    companyId: string,
    lob: string,
    cache: Record<string, string>,
    cacheKey: string,
  ): Promise<string> {
    if (cache[cacheKey]) return cache[cacheKey];

    const existing = await this.prisma.insuranceProduct.findFirst({
      where: {
        productName: { equals: productName, mode: 'insensitive' },
        companyId,
      },
    });
    if (existing) {
      cache[cacheKey] = existing.id;
      return existing.id;
    }

    const product = await this.prisma.insuranceProduct.create({
      data: {
        productName,
        companyId,
        lob: lob as any,
        status: 'ACTIVE',
      },
    });
    cache[cacheKey] = product.id;
    return product.id;
  }
}
