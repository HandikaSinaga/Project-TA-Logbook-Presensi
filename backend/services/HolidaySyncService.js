import Holiday from '../models/settingsModels/Holiday.js';
import cron from 'node-cron';
import { Op } from 'sequelize';

class HolidaySyncService {
    /**
     * Synchronize holidays for a given year.
     * Tries multiple sources to ensure redundancy.
     * @param {number} year - The year to sync
     * @returns {Promise<number>} - Number of holidays created
     */
    static async syncForYear(year) {
        try {
            console.log(`[HolidaySyncService] Starting sync for year ${year}...`);

            // We proceed with sync to fetch any missing holidays.
            let fetchedHolidays = [];
            
            // --- SOURCE: Google Calendar ICS (Primary, Matches Google Calendar exactly) ---
            try {
                console.log(`[HolidaySyncService] Attempting to fetch from Google Calendar ICS`);
                const icsUrl = 'https://calendar.google.com/calendar/ical/id.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics';
                const res = await globalThis.fetch(icsUrl);
                
                if (!res.ok) throw new Error(`Google Calendar ICS HTTP error: ${res.status}`);
                
                const text = await res.text();
                const lines = text.split(/\r?\n/);
                
                let currentEvent = null;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line === 'BEGIN:VEVENT') {
                        currentEvent = {};
                    } else if (line === 'END:VEVENT' && currentEvent) {
                        // Check if event belongs to the requested year
                        if (currentEvent.date && currentEvent.date.startsWith(String(year))) {
                            fetchedHolidays.push({
                                date: currentEvent.date,
                                name: currentEvent.summary || 'Libur Nasional',
                                type: "national",
                                description: (currentEvent.summary && currentEvent.summary.toLowerCase().includes("cuti bersama")) 
                                    ? "Cuti Bersama" 
                                    : "Libur Nasional Resmi",
                                is_national: true,
                                year: year
                            });
                        }
                        currentEvent = null;
                    } else if (currentEvent) {
                        if (line.startsWith('DTSTART;VALUE=DATE:')) {
                            const rawDate = line.split(':')[1];
                            if (rawDate && rawDate.length === 8) {
                                // Format from YYYYMMDD to YYYY-MM-DD
                                currentEvent.date = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;
                            }
                        } else if (line.startsWith('SUMMARY:')) {
                            currentEvent.summary = line.substring(8);
                        }
                    }
                }
                
                console.log(`[HolidaySyncService] Google Calendar ICS success. Found ${fetchedHolidays.length} holidays for ${year}.`);
            } catch (error) {
                console.error(`[HolidaySyncService] Google Calendar ICS failed: ${error.message}`);
                throw new Error("Failed to sync holidays from Google Calendar.");
            }

            if (fetchedHolidays.length === 0) {
                console.log(`[HolidaySyncService] No holidays found for year ${year} from APIs.`);
                return 0;
            }

            // Insert into Database, avoiding duplicates by date
            let createdCount = 0;
            for (const h of fetchedHolidays) {
                const [record, created] = await Holiday.findOrCreate({
                    where: { date: h.date },
                    defaults: h
                });
                
                // Mengabaikan (skip) jika data sudah ada, baik itu kostum maupun nasional
                // Sesuai request: "jika melakukan sinkronisasi ulang abaikan saja hari libur kostum yang ditambahkan manual"
                
                if (created) createdCount++;
            }

            console.log(`[HolidaySyncService] Sync completed. Inserted ${createdCount} new holidays for ${year}.`);
            return createdCount;

        } catch (error) {
            console.error(`[HolidaySyncService] Fatal error during sync:`, error);
            return 0;
        }
    }

    /**
     * Delete holidays that are older than 3 years from current year
     */
    static async cleanupOldHolidays() {
        try {
            const currentYear = new Date().getFullYear();
            const minYear = currentYear - 3;
            
            console.log(`[HolidaySyncService] Cleaning up holidays older than ${minYear}...`);
            
            const deleted = await Holiday.destroy({
                where: {
                    date: {
                        [Op.lt]: `${minYear}-01-01`
                    }
                }
            });
            
            if (deleted > 0) {
                console.log(`[HolidaySyncService] Cleanup complete. Deleted ${deleted} old holidays.`);
            }
        } catch (error) {
            console.error(`[HolidaySyncService] Error during old holidays cleanup:`, error);
        }
    }

    /**
     * Start the cron job for automatic yearly holiday sync
     */
    static startCron() {
        console.log('[HolidaySyncService] Initializing Holiday Sync Cron Job...');
        
        // Run immediately on startup to check current year
        const currentYear = new Date().getFullYear();
        HolidaySyncService.syncForYear(currentYear);
        HolidaySyncService.cleanupOldHolidays();

        // Run every January 1st at 00:05 (Minute 5, Hour 0, Day 1, Month 1)
        cron.schedule('5 0 1 1 *', async () => {
            console.log('[HolidaySyncService] Executing Yearly Scheduled Holiday Sync & Cleanup');
            const year = new Date().getFullYear();
            await HolidaySyncService.syncForYear(year);
            await HolidaySyncService.cleanupOldHolidays();
        });
    }
}

export default HolidaySyncService;
