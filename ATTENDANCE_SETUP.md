# 🚀 Quick Setup: Attendance Tracking System

## Prerequisites

- Node.js >= 18.0.0
- MySQL >= 8.0
- Existing installation of the payroll management system

## Installation Steps

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install qrcode @types/qrcode
```

#### Frontend
```bash
cd frontend
npm install html5-qrcode qrcode.react
```

### 2. Database Migration

Run the Prisma migration to create the attendance tables:

```bash
cd backend
npx prisma migrate dev --name add_attendance_tracking
```

This will create:
- `pointages` table for attendance records
- Add `codeQR` field to `employes` table
- Add `VIGILE` role to `RoleUtilisateur` enum
- Add `StatutPointage` enum (PRESENT, RETARD, ABSENT)

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Generate QR Codes for Existing Employees (Optional)

Create a script or use the admin interface to generate QR codes:

```javascript
// scripts/generate-qr-codes.js
const { PrismaClient } = require('@prisma/client');
const { ServiceQRCode } = require('./src/services/ServiceQRCode');

const prisma = new PrismaClient();
const qrService = new ServiceQRCode();

async function generateAllQRCodes() {
  const employes = await prisma.employe.findMany({
    where: { actif: true }
  });

  console.log(`Generating QR codes for ${employes.length} employees...`);

  for (const employe of employes) {
    if (!employe.codeQR) {
      const codeQR = await qrService.genererCodeQR(employe.id, employe.entrepriseId);
      await prisma.employe.update({
        where: { id: employe.id },
        data: { codeQR }
      });
      console.log(`✓ Generated QR code for ${employe.nomComplet}`);
    }
  }

  console.log('Done!');
}

generateAllQRCodes().catch(console.error);
```

Run the script:
```bash
node scripts/generate-qr-codes.js
```

### 5. Create a Vigile User

Create a user with the VIGILE role for QR scanning:

```sql
INSERT INTO utilisateurs (id, nom, prenom, email, motDePasse, role, entrepriseId, actif)
VALUES (
  'cuid_here',
  'Vigile',
  'Principal',
  'vigile@entreprise.com',
  '$2b$10$hashedpassword', -- Use bcrypt to hash the password
  'VIGILE',
  'your_entreprise_id',
  true
);
```

Or use the API:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Vigile",
    "prenom": "Principal",
    "email": "vigile@entreprise.com",
    "motDePasse": "securepassword",
    "role": "VIGILE",
    "entrepriseId": "your_entreprise_id"
  }'
```

### 6. Setup Automatic Absent Marking (Optional)

Install a cron job library:

```bash
cd backend
npm install node-cron
```

Add to your `app.ts` or create a separate cron service:

```javascript
import cron from 'node-cron';
import { ServicePointage } from './services/ServicePointage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const servicePointage = new ServicePointage();

// Run every day at 16:05
cron.schedule('5 16 * * *', async () => {
  console.log('Running automatic absent marking...');
  
  try {
    const entreprises = await prisma.entreprise.findMany({
      where: { actif: true }
    });

    for (const entreprise of entreprises) {
      const absents = await servicePointage.marquerAbsents(entreprise.id);
      console.log(`✓ Marked ${absents.length} employees as absent for ${entreprise.nom}`);
    }
  } catch (error) {
    console.error('Error marking absents:', error);
  }
});
```

### 7. Update Frontend Routes

Add attendance routes to your route configuration:

```javascript
// routes.js or App.js
import { QRScanner, AttendanceReport } from './views/admin/attendance';

const routes = [
  // ... existing routes
  
  // Vigile routes
  {
    path: '/admin/attendance/scanner',
    component: QRScanner,
    layout: AdminLayout,
    roles: ['VIGILE', 'ADMIN_ENTREPRISE', 'SUPER_ADMIN']
  },
  
  // Admin routes
  {
    path: '/admin/attendance/report',
    component: AttendanceReport,
    layout: AdminLayout,
    roles: ['ADMIN_ENTREPRISE', 'SUPER_ADMIN']
  }
];
```

### 8. Update Sidebar Navigation

Add attendance menu items:

```javascript
// sidebar/components/Links.jsx
const routes = [
  // ... existing routes
  
  {
    name: 'Pointage',
    layout: '/admin',
    path: '/attendance/scanner',
    icon: <Icon as={MdQrCodeScanner} width='20px' height='20px' color='inherit' />,
    roles: ['VIGILE']
  },
  {
    name: 'Rapports de Pointage',
    layout: '/admin',
    path: '/attendance/report',
    icon: <Icon as={MdAssessment} width='20px' height='20px' color='inherit' />,
    roles: ['ADMIN_ENTREPRISE', 'SUPER_ADMIN']
  }
];
```

## Configuration

### Time Settings

The attendance logic uses the following time rules:
- **Present**: Scan at or before 08:30
- **Late**: Scan after 08:30
- **Absent**: No scan before 16:00 (marked automatically)

To change these times, edit `ServicePointage.ts`:

```typescript
// In enregistrerPointage method
const heureEnMinutes = heure * 60 + minutes;

// Change 510 (8:30 AM) to your preferred time in minutes
if (heureEnMinutes <= 510) {
  statut = StatutPointage.PRESENT;
} else {
  statut = StatutPointage.RETARD;
}
```

### Geolocation

Geolocation is optional but recommended. To make it required:

```typescript
// In pointages.ts route
if (!donneesValidees.latitude || !donneesValidees.longitude) {
  return res.status(400).json({
    succes: false,
    message: 'La géolocalisation est requise'
  });
}
```

## Testing

### 1. Test QR Code Generation

```bash
curl -X POST http://localhost:3001/api/pointages/generer-qr/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test QR Scanning

```bash
curl -X POST http://localhost:3001/api/pointages/scanner \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codeQR": "YOUR_QR_CODE_HERE",
    "latitude": "14.6928",
    "longitude": "-17.4467"
  }'
```

### 3. Test Statistics

```bash
curl -X GET "http://localhost:3001/api/pointages/statistiques?dateDebut=2025-01-01&dateFin=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Usage Guide

### For Vigile (Guard)

1. Login to the system with VIGILE credentials
2. Navigate to "Pointage" or "Scanner"
3. Click "Démarrer le scan"
4. Point camera at employee QR code
5. System will automatically:
   - Validate the QR code
   - Record attendance with correct status (Present/Late)
   - Show immediate feedback

### For Administrators

#### Generate QR Codes

1. Navigate to "Employés"
2. Click on an employee
3. Click "Générer Code QR"
4. Download or print the QR code

#### View Reports

1. Navigate to "Rapports de Pointage"
2. Select date range
3. Filter by status if needed
4. View statistics and detailed records
5. Export to CSV if needed

#### Mark Absents

Either:
- Wait for automatic marking at 16:05
- Or manually trigger: "Marquer les Absents" button

## Troubleshooting

### QR Scanner Not Working

**Issue**: Camera not starting

**Solutions**:
- Ensure HTTPS is enabled (browsers require secure context)
- Grant camera permissions
- Check browser compatibility (Chrome, Firefox, Safari supported)

### QR Code Not Scanning

**Issue**: QR code not recognized

**Solutions**:
- Ensure QR code image is clear and well-lit
- Try regenerating the QR code
- Check if QR code belongs to correct enterprise

### Database Error

**Issue**: Migration fails

**Solutions**:
```bash
# Reset migrations
npx prisma migrate reset

# Apply fresh migrations
npx prisma migrate dev
```

### Duplicate Scan Error

**Issue**: "Un pointage a déjà été enregistré aujourd'hui"

**Solution**: This is expected behavior. One scan per employee per day is allowed.

## Performance Tips

1. **Batch QR Generation**: Generate QR codes for multiple employees at once
2. **Cache Statistics**: Implement Redis cache for frequently accessed statistics
3. **Index Database**: Ensure indexes are created on `employeId` and `datePointage`
4. **Optimize Queries**: Use Prisma's `include` and `select` carefully

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Validate QR codes on backend, never trust frontend
3. ✅ Use geolocation to prevent remote scanning
4. ✅ Rotate QR codes periodically (monthly/quarterly)
5. ✅ Monitor for suspicious patterns (multiple failed scans)
6. ✅ Log all attendance operations for audit
7. ✅ Implement rate limiting on scan endpoint

## Monitoring

### Recommended Metrics to Track

- Number of scans per day
- Present/Late/Absent ratios
- Failed scan attempts
- QR code generation frequency
- API response times

### Log Examples

```javascript
// In production, implement proper logging
console.log('[ATTENDANCE] Scan successful', {
  employeeId,
  status,
  timestamp,
  latitude,
  longitude
});

console.error('[ATTENDANCE] Scan failed', {
  error,
  employeeId,
  timestamp
});
```

## Support & Documentation

- **Full Documentation**: See `ATTENDANCE_DOCUMENTATION.md`
- **API Reference**: See `ATTENDANCE_API.md`
- **Main README**: See `README.md`

## Changelog

### Version 1.0.0 (2025-01-15)
- Initial release
- QR code generation and scanning
- Time-based status logic (Present/Late/Absent)
- Geolocation support
- Statistics and reports
- CSV export
- Role-based access (VIGILE, ADMIN)

---

**Happy tracking! 📊**
