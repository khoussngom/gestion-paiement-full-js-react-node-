# 🔌 API Documentation: Attendance Tracking System

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Scanner un Code QR (Scan QR Code)

**Endpoint**: `POST /pointages/scanner`

**Description**: Enregistre le pointage d'un employé après le scan de son code QR.

**Rôles autorisés**: VIGILE, ADMIN_ENTREPRISE, SUPER_ADMIN

**Request Body**:
```json
{
  "codeQR": "Y21nNHdoNmd2MDAwMHJ5cnBwa3VmMWlqdzo...",
  "latitude": "14.6928",
  "longitude": "-17.4467"
}
```

**Response (Success - 201)**:
```json
{
  "succes": true,
  "message": "Pointage enregistré avec succès",
  "donnees": {
    "id": "clxxx123...",
    "employeId": "clyyy456...",
    "entrepriseId": "cmg4wh6gv...",
    "datePointage": "2025-01-15T00:00:00.000Z",
    "heurePointage": "2025-01-15T08:25:30.000Z",
    "statut": "PRESENT",
    "latitude": "14.6928",
    "longitude": "-17.4467",
    "dateCreation": "2025-01-15T08:25:30.000Z",
    "employe": {
      "id": "clyyy456...",
      "nomComplet": "Fallou Senghor",
      "poste": "Coach"
    }
  }
}
```

**Response (Error - 400)**:
```json
{
  "succes": false,
  "message": "Un pointage a déjà été enregistré aujourd'hui",
  "erreur": "Un pointage a déjà été enregistré aujourd'hui"
}
```

---

### 2. Obtenir les Pointages (Get Attendance Records)

**Endpoint**: `GET /pointages`

**Description**: Récupère la liste des pointages avec filtres optionnels.

**Rôles autorisés**: ADMIN_ENTREPRISE, SUPER_ADMIN

**Query Parameters**:
- `dateDebut` (optional): Date de début (format: YYYY-MM-DD)
- `dateFin` (optional): Date de fin (format: YYYY-MM-DD)
- `employeId` (optional): ID de l'employé
- `statut` (optional): PRESENT | RETARD | ABSENT

**Example Request**:
```
GET /pointages?dateDebut=2025-01-01&dateFin=2025-01-31&statut=PRESENT
```

**Response (Success - 200)**:
```json
{
  "succes": true,
  "donnees": [
    {
      "id": "clxxx123...",
      "employeId": "clyyy456...",
      "datePointage": "2025-01-15T00:00:00.000Z",
      "heurePointage": "2025-01-15T08:25:30.000Z",
      "statut": "PRESENT",
      "employe": {
        "id": "clyyy456...",
        "nomComplet": "Fallou Senghor",
        "poste": "Coach",
        "email": "fallou@example.com",
        "telephone": "+221 77 123 45 67"
      }
    }
  ],
  "total": 45
}
```

---

### 3. Obtenir les Statistiques (Get Statistics)

**Endpoint**: `GET /pointages/statistiques`

**Description**: Récupère les statistiques de pointage pour une période donnée.

**Rôles autorisés**: ADMIN_ENTREPRISE, SUPER_ADMIN

**Query Parameters**:
- `dateDebut` (optional): Date de début (format: YYYY-MM-DD)
- `dateFin` (optional): Date de fin (format: YYYY-MM-DD)

**Example Request**:
```
GET /pointages/statistiques?dateDebut=2025-01-01&dateFin=2025-01-31
```

**Response (Success - 200)**:
```json
{
  "succes": true,
  "donnees": {
    "total": 450,
    "presents": 380,
    "retards": 45,
    "absents": 25,
    "tauxPresence": 84.44,
    "tauxRetard": 10.00,
    "tauxAbsence": 5.56
  }
}
```

---

### 4. Obtenir le Rapport par Employé (Get Employee Report)

**Endpoint**: `GET /pointages/rapport-employes`

**Description**: Récupère un rapport détaillé de pointage par employé.

**Rôles autorisés**: ADMIN_ENTREPRISE, SUPER_ADMIN

**Query Parameters**:
- `dateDebut` (optional): Date de début
- `dateFin` (optional): Date de fin

**Example Request**:
```
GET /pointages/rapport-employes?dateDebut=2025-01-01&dateFin=2025-01-31
```

**Response (Success - 200)**:
```json
{
  "succes": true,
  "donnees": [
    {
      "employe": {
        "id": "clyyy456...",
        "nomComplet": "Fallou Senghor",
        "poste": "Coach",
        "email": "fallou@example.com",
        "telephone": "+221 77 123 45 67"
      },
      "presents": 18,
      "retards": 2,
      "absents": 1,
      "total": 21,
      "tauxPresence": 85.71,
      "tauxRetard": 9.52,
      "tauxAbsence": 4.76
    }
  ]
}
```

---

### 5. Marquer les Absents (Mark Absentees)

**Endpoint**: `POST /pointages/marquer-absents`

**Description**: Marque automatiquement comme absents tous les employés qui n'ont pas pointé aujourd'hui.

**Rôles autorisés**: ADMIN_ENTREPRISE, SUPER_ADMIN

**Note**: Cette fonction doit être exécutée après 16h00.

**Request Body**: Aucun

**Response (Success - 200)**:
```json
{
  "succes": true,
  "message": "Employés absents marqués avec succès",
  "donnees": [
    {
      "id": "clxxx789...",
      "employeId": "clyyy999...",
      "statut": "ABSENT",
      "notes": "Marqué automatiquement comme absent après 16h00"
    }
  ],
  "total": 5
}
```

---

### 6. Générer un Code QR (Generate QR Code)

**Endpoint**: `POST /pointages/generer-qr/:employeId`

**Description**: Génère ou régénère un code QR pour un employé.

**Rôles autorisés**: ADMIN_ENTREPRISE, SUPER_ADMIN

**URL Parameters**:
- `employeId`: ID de l'employé

**Example Request**:
```
POST /pointages/generer-qr/clyyy456...
```

**Response (Success - 200)**:
```json
{
  "succes": true,
  "message": "Code QR généré avec succès",
  "donnees": {
    "employe": {
      "id": "clyyy456...",
      "nomComplet": "Fallou Senghor",
      "poste": "Coach",
      "codeQR": "Y21nNHdoNmd2MDAwMHJ5cnBwa3VmMWlqdzo..."
    },
    "codeQR": "Y21nNHdoNmd2MDAwMHJ5cnBwa3VmMWlqdzo...",
    "imageQR": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

---

### 7. Obtenir le Code QR d'un Employé (Get Employee QR Code)

**Endpoint**: `GET /pointages/qr/:employeId`

**Description**: Récupère le code QR existant d'un employé.

**Rôles autorisés**: ADMIN_ENTREPRISE, SUPER_ADMIN

**URL Parameters**:
- `employeId`: ID de l'employé

**Example Request**:
```
GET /pointages/qr/clyyy456...
```

**Response (Success - 200)**:
```json
{
  "succes": true,
  "donnees": {
    "codeQR": "Y21nNHdoNmd2MDAwMHJ5cnBwa3VmMWlqdzo...",
    "imageQR": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "employe": {
      "id": "clyyy456...",
      "nomComplet": "Fallou Senghor",
      "poste": "Coach"
    }
  }
}
```

**Response (Error - 404)**:
```json
{
  "succes": false,
  "message": "Aucun code QR généré pour cet employé"
}
```

---

### 8. Obtenir l'Historique d'un Employé (Get Employee History)

**Endpoint**: `GET /pointages/employe/:employeId`

**Description**: Récupère l'historique de pointage d'un employé spécifique.

**Rôles autorisés**: ADMIN_ENTREPRISE, SUPER_ADMIN

**URL Parameters**:
- `employeId`: ID de l'employé

**Query Parameters**:
- `dateDebut` (optional): Date de début
- `dateFin` (optional): Date de fin

**Example Request**:
```
GET /pointages/employe/clyyy456...?dateDebut=2025-01-01&dateFin=2025-01-31
```

**Response (Success - 200)**:
```json
{
  "succes": true,
  "donnees": [
    {
      "id": "clxxx123...",
      "employeId": "clyyy456...",
      "datePointage": "2025-01-15T00:00:00.000Z",
      "heurePointage": "2025-01-15T08:25:30.000Z",
      "statut": "PRESENT"
    },
    {
      "id": "clxxx124...",
      "employeId": "clyyy456...",
      "datePointage": "2025-01-16T00:00:00.000Z",
      "heurePointage": "2025-01-16T08:45:00.000Z",
      "statut": "RETARD"
    }
  ],
  "total": 21
}
```

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | BAD_REQUEST | Données invalides ou code QR invalide |
| 401 | UNAUTHORIZED | Token d'authentification manquant ou invalide |
| 403 | FORBIDDEN | Permissions insuffisantes |
| 404 | NOT_FOUND | Ressource non trouvée |
| 500 | INTERNAL_SERVER_ERROR | Erreur serveur |

---

## Common Error Responses

### Invalid QR Code
```json
{
  "succes": false,
  "message": "Code QR invalide ou expiré",
  "erreur": "Code QR invalide pour cette entreprise"
}
```

### Already Scanned Today
```json
{
  "succes": false,
  "message": "Un pointage a déjà été enregistré aujourd'hui",
  "erreur": "Un pointage a déjà été enregistré aujourd'hui"
}
```

### Employee Not Found
```json
{
  "succes": false,
  "message": "Employé introuvable",
  "erreur": "Employé non trouvé"
}
```

### Unauthorized
```json
{
  "succes": false,
  "message": "Token d'authentification invalide"
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. However, it's recommended to:
- Limit QR generation to 10 requests per minute per user
- Limit scan operations to 100 requests per minute per enterprise

---

## Security Considerations

1. **QR Code Format**: Base64 encoded string containing `entrepriseId:employeId:timestamp:randomToken`
2. **Token Validation**: Always validate enterprise ID in QR code matches the authenticated user's enterprise
3. **Geolocation**: Optional but recommended for fraud prevention
4. **One Scan Per Day**: System prevents multiple scans for the same employee on the same day
5. **HTTPS**: Use HTTPS in production to protect JWT tokens

---

## Testing with cURL

### Scan QR Code
```bash
curl -X POST http://localhost:3001/api/pointages/scanner \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codeQR": "Y21nNHdoNmd2MDAwMHJ5cnBwa3VmMWlqdzo...",
    "latitude": "14.6928",
    "longitude": "-17.4467"
  }'
```

### Get Statistics
```bash
curl -X GET "http://localhost:3001/api/pointages/statistiques?dateDebut=2025-01-01&dateFin=2025-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Generate QR Code
```bash
curl -X POST http://localhost:3001/api/pointages/generer-qr/clyyy456... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Integration Examples

### JavaScript/React
```javascript
import attendanceService from './services/attendanceService';

// Scan QR Code
const scanResult = await attendanceService.scanQRCode(qrCode, latitude, longitude);

// Get statistics
const stats = await attendanceService.getAttendanceStatistics('2025-01-01', '2025-01-31');

// Generate QR
const qrData = await attendanceService.generateQRCode(employeeId);
```

### Node.js
```javascript
const axios = require('axios');

const scanQRCode = async (qrCode, token) => {
  const response = await axios.post(
    'http://localhost:3001/api/pointages/scanner',
    { codeQR: qrCode },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-15  
**Contact**: See main documentation for support
