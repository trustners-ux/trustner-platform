# Insurance Broking Backend - Implementation Guide

## Quick Start

### 1. Import Insurance Module into App.module.ts

```typescript
import { InsuranceModule } from './insurance/insurance.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    // ... other modules
    InsuranceModule  // Add this
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 2. Update Prisma Schema

Copy all models from `/prisma/schema-insurance.prisma` into your main `/prisma/schema.prisma`

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_insurance_models

# Apply migration
npx prisma db push
```

### 3. Ensure Guard Files Exist

Create these guard files if they don't exist:

**src/common/guards/jwt-auth.guard.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**src/common/guards/roles.guard.ts**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**src/common/decorators/roles.decorator.ts**
```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**src/common/decorators/current-user.decorator.ts**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 4. Install Dependencies

If not already installed:

```bash
npm install decimal.js
npm install dayjs
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
```

### 5. Test a Simple Endpoint

```bash
# Start dev server
npm run start:dev

# Test POSP registration
curl -X POST http://localhost:3000/insurance/posp/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "category": "GENERAL",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "gender": "Male",
    "email": "john@example.com",
    "phone": "+919876543210"
  }'
```

---

## Key Implementation Details

### Commission Calculation Example

```typescript
// 1. Setup commission slabs
POST /insurance/commissions/slabs/configure
{
  "companyId": "company-001",
  "lob": "MOTOR_FOUR_WHEELER",
  "slabs": [
    {
      "slabName": "0-25L",
      "minPremium": 0,
      "maxPremium": 2500000,
      "brokerRate": 12.5,
      "pospShareRate": 80,
      "effectiveFrom": "2025-01-01"
    },
    {
      "slabName": "25L-50L",
      "minPremium": 2500001,
      "maxPremium": 5000000,
      "brokerRate": 13.5,
      "pospShareRate": 85,
      "effectiveFrom": "2025-01-01"
    }
  ]
}

// 2. When policy is issued, calculate commission
POST /insurance/commissions/calculate/policy-001

// Response:
{
  "policyId": "policy-001",
  "pospId": "posp-001",
  "netPremium": 50000,
  "brokerCommissionAmt": 6250,      // 12.5% of 50000
  "pospSharePct": 80,
  "pospCommissionAmt": 5000,         // 80% of 6250
  "trustnerRetention": 1250,         // 20% of 6250
  "tdsAmount": 500,                  // 10% of 5000
  "gstAmount": 900,                  // 18% of 5000
  "netPayable": 3600,                // 5000 - 500 - 900
  "slabApplied": "0-25L"
}

// 3. Batch calculate for entire month
POST /insurance/commissions/batch-calculate
{ "month": 2, "year": 2025 }

// 4. Reconcile with insurer
POST /insurance/commissions/reconcile
{
  "companyId": "company-001",
  "month": 2,
  "year": 2025,
  "receivedAmount": 50000
}

// 5. Generate payouts
POST /insurance/commissions/payouts/generate
{ "month": 2, "year": 2025 }

// 6. Approve payout
PATCH /insurance/commissions/payouts/payout-001/approve

// 7. Mark as paid
PATCH /insurance/commissions/payouts/payout-001/mark-paid
{ "bankRef": "TXN-202502-0001" }
```

### Policy State Machine Example

```
Initial State: QUOTE_GENERATED
  ↓
PROPOSAL_SUBMITTED (customer interested)
  ↓
PAYMENT_PENDING (waiting for payment)
  ↓
PAYMENT_RECEIVED (payment confirmed)
  ↓
POLICY_ISSUED (policy document generated)
  ↓
POLICY_ACTIVE (premium period started)
  ↓
Options:
- POLICY_EXPIRED (term ended)
- POLICY_CANCELLED (customer cancellation)
- CLAIM_IN_PROGRESS (claim filed)
- ENDORSEMENT_IN_PROGRESS (amendment in progress)
```

### POSP Lifecycle Example

```typescript
// 1. Register agent
POST /insurance/posp/register
{
  "category": "GENERAL",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
// Status: APPLICATION_RECEIVED

// 2. Start training
POST /insurance/posp/:id/training/start
// Status: TRAINING_IN_PROGRESS

// 3. Add training modules (5 modules x 3 hours each = 15 hours)
POST /insurance/posp/:id/training/progress
{
  "moduleTitle": "Module 1: Insurance Basics",
  "duration": 3,
  "score": 85,
  "videoUrl": "..."
}

// 4. Complete training
POST /insurance/posp/:id/training/complete
// Status: TRAINING_COMPLETED

// 5. Schedule exam
POST /insurance/posp/:id/exam/schedule
{ "examDate": "2025-03-15" }
// Status: EXAM_SCHEDULED

// 6. Record exam result
POST /insurance/posp/:id/exam/result
{ "passed": true, "score": 92 }
// Status: EXAM_PASSED

// 7. Issue certificate
POST /insurance/posp/:id/certificate/issue
{
  "certNumber": "CERT-2025-001",
  "expiryDate": "2027-03-15"
}
// Status: CERTIFICATE_ISSUED

// 8. Activate
POST /insurance/posp/:id/activate
// Status: ACTIVE
```

---

## Common Workflows

### Lead to Policy Conversion

```typescript
// 1. Create lead
POST /insurance/leads
{
  "customerName": "Amit Kumar",
  "customerPhone": "+919876543210",
  "lob": "MOTOR_FOUR_WHEELER",
  "vehicleRegNumber": "MH02AB1234",
  ...
}
// Status: NEW

// 2. Add activity (contact)
POST /insurance/leads/lead-001/activity
{
  "action": "CALLED",
  "description": "Customer interested in comprehensive coverage"
}

// 3. Get quotes from multiple insurers
POST /insurance/leads/lead-001/quotes
{
  "insurerName": "HDFC ERGO",
  "productName": "4W Complete",
  "premium": 12500,
  ...
}

// 4. Select one quote
POST /insurance/leads/lead-001/quotes/quote-001/select
// Status: PROPOSAL_STAGE

// 5. Convert to policy
POST /insurance/leads/lead-001/convert-to-policy
// Status: CONVERTED
// Creates Policy with TIBPL-POL-XXXXX
```

### Claim Intimation to Settlement

```typescript
// 1. Intimate claim
POST /insurance/claims/intimate
{
  "policyId": "policy-001",
  "claimType": "OWN_DAMAGE",
  "incidentDate": "2025-02-20",
  "description": "Minor fender bender"
}
// Status: INTIMATED

// 2. Request documents
PATCH /insurance/claims/claim-001/status
{
  "status": "DOCUMENTS_PENDING",
  "reason": "Waiting for police report and photos"
}

// 3. Customer submits documents
POST /insurance/claims/claim-001/documents
{
  "filePath": "s3://bucket/claim-001/FIR.pdf",
  "fileName": "FIR.pdf",
  "documentType": "FIR"
}

// 4. Appoint surveyor
POST /insurance/claims/claim-001/surveyor
{
  "name": "Rajesh Kumar",
  "phone": "+919876543210"
}

// 5. Approve claim
POST /insurance/claims/claim-001/approve
{ "approvedAmount": 45000 }

// 6. Settle claim
POST /insurance/claims/claim-001/settle
{ "settledAmount": 45000 }
```

---

## Testing with Postman

### Setup Collection

1. Create Postman collection "Insurance API"
2. Set variables:
   - `{{base_url}}` = `http://localhost:3000`
   - `{{jwt_token}}` = Your JWT token
   - `{{posp_id}}` = Created POSP ID
   - `{{policy_id}}` = Created policy ID

3. Create folders for each module:
   - POSP Management
   - Lead Management
   - Policy Management
   - Claims
   - Commissions
   - Dashboard

### Sample Request

```
GET /insurance/posp
Headers:
  Authorization: Bearer {{jwt_token}}
  Content-Type: application/json
Query Params:
  skip: 0
  take: 10
  status: ACTIVE
```

---

## Database Queries

### Get top POSPs by commission

```sql
SELECT
  pa.agent_code,
  pa.first_name,
  pa.last_name,
  COUNT(ic.id) as total_commissions,
  SUM(ic.posp_commission_amt) as total_commission
FROM posp_agent pa
LEFT JOIN insurance_commission ic ON pa.id = ic.posp_id
WHERE pa.status = 'ACTIVE'
GROUP BY pa.id
ORDER BY total_commission DESC
LIMIT 10;
```

### Get renewal status summary

```sql
SELECT
  status,
  COUNT(*) as count,
  SUM(premium_amount) as total_premium
FROM renewal_tracker
WHERE status NOT IN ('RENEWED', 'LAPSED')
GROUP BY status;
```

### Get monthly commission summary

```sql
SELECT
  period_month,
  period_year,
  COUNT(*) as policy_count,
  SUM(broker_commission_amt) as total_commission,
  SUM(posp_commission_amt) as total_posp_commission
FROM insurance_commission
WHERE status = 'APPROVED'
GROUP BY period_month, period_year
ORDER BY period_year DESC, period_month DESC;
```

---

## Troubleshooting

### "Cannot find module" errors
- Ensure all imports use correct relative paths
- Check that node_modules is installed: `npm install`

### JWT authentication issues
- Verify JWT token is valid and not expired
- Include `Authorization: Bearer {token}` header
- Check that user.role is set correctly

### Decimal precision issues
- Always use `Number(value)` to convert Decimal to JS number for responses
- Use `new Decimal(value)` for calculations

### Duplicate code generation
- Ensure database count is working correctly
- Check that codes are being generated sequentially

### Commission calculation wrong
- Verify commission slabs are configured
- Check POSP cumulative premium is calculated correctly
- Ensure TDS threshold (5000) and percentage (10%) are correct

---

## Performance Optimization Tips

1. **Add indexes** on frequently queried fields:
   ```sql
   CREATE INDEX idx_policy_status ON insurance_policy(status);
   CREATE INDEX idx_posp_id ON insurance_policy(posp_id);
   CREATE INDEX idx_commission_period ON insurance_commission(period_month, period_year);
   ```

2. **Pagination** - Always use skip/take for large queries

3. **Batch operations** - Use batch calculation for monthly commissions

4. **Caching** - Cache Vaahan data for 24 hours

5. **Indexes in Prisma schema** - Already defined with `@@index`

---

## Monitoring & Logging

### Enable Query Logging
```typescript
// In PrismaService
if (process.env.LOG_QUERIES === 'true') {
  this.$on('query', (e) => {
    console.log(`Query: ${e.query}`);
    console.log(`Duration: ${e.duration}ms`);
  });
}
```

### Key Metrics to Monitor
- Commission calculation batch execution time
- Policy conversion rate
- Claim settlement time (TAT)
- POSP activation completion rate
- Renewal conversion rate

---

## Security Considerations

1. **Never log sensitive data** (account numbers, PAN, Aadhaar)
2. **Encrypt** sensitive fields in database
3. **Use parameterized queries** (Prisma handles this)
4. **Rate limit** API endpoints
5. **Validate** all input with class-validator
6. **Use HTTPS** in production
7. **Rotate JWT secrets** regularly
8. **Audit** all financial transactions

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Prisma client generated
- [ ] JWT secrets set
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error handling tested
- [ ] All tests passing
- [ ] Swagger docs accessible
- [ ] Health check endpoint responding
- [ ] Database backups configured
- [ ] Monitoring alerts set up

---

## Support & Maintenance

For issues or enhancements:
1. Check INSURANCE_MODULES_SUMMARY.md for detailed module info
2. Review method signatures in service files
3. Check controller routes and parameters
4. Verify DTOs and validation rules
5. Test with Postman collection

---

**Last Updated:** 2025-02-25
**Version:** 1.0.0
**Maintainer:** Trustner Team
