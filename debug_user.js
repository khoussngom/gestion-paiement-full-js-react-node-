// Script de debug pour vérifier l'état de l'utilisateur
console.log('=== DEBUG USER INFO ===');
console.log('Token:', localStorage.getItem('authToken'));
console.log('User:', JSON.parse(localStorage.getItem('user') || 'null'));
console.log('======================');