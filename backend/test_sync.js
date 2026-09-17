import HolidaySyncService from './services/HolidaySyncService.js';
import models from './models/index.js';

async function test() {
    await models.sequelize.sync();
    const count = await HolidaySyncService.syncForYear(2024);
    console.log("Created count:", count);
    const holidays = await models.Holiday.findAll({ where: { year: 2024 }});
    console.log("Total holidays for 2024:", holidays.length);
    process.exit(0);
}
test();
