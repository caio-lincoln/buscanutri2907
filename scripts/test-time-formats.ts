
import { fromZonedTime } from 'date-fns-tz';

console.log('Testing time string formats...');

const dateStr = '2026-02-24';
const tz = 'America/Sao_Paulo';

const times = ['08:00', '8:00', '18:00', '9:30'];

times.forEach(t => {
    const iso = `${dateStr}T${t}:00`;
    try {
        const d = fromZonedTime(iso, tz);
        console.log(`Time "${t}" -> ISO "${iso}" -> ${d.toISOString()} (Valid: ${!isNaN(d.getTime())})`);
    } catch (e) {
        console.log(`Time "${t}" -> ISO "${iso}" -> ERROR: ${e}`);
    }
});

// Test with full seconds if that's what comes from DB
const timesWithSeconds = ['08:00:00', '8:00:00'];
timesWithSeconds.forEach(t => {
    // My code appends :00, so "08:00:00" becomes "08:00:00:00" which is invalid
    const iso = `${dateStr}T${t}:00`; 
    console.log(`Checking double seconds: ${iso}`);
    try {
        const d = fromZonedTime(iso, tz);
        console.log(`Result: ${d.toISOString()}`);
    } catch (e) {
        console.log(`Result: Invalid/Error`);
    }
});
