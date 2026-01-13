'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date();

    // Insert divisions first
    await queryInterface.bulkInsert('divisions', [
      {
        id: 1,
        name: 'Engineering',
        description: 'Engineering department',
        supervisor_id: null,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        name: 'Marketing',
        description: 'Marketing department',
        supervisor_id: null,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        name: 'Operations',
        description: 'Operations department',
        supervisor_id: null,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // Insert users
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'Admin System',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        division_id: null,
        supervisor_id: null,
        is_active: true,
        email_verified_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        name: 'Supervisor Satu',
        email: 'supervisor@example.com',
        password: hashedPassword,
        role: 'supervisor',
        division_id: 1,
        supervisor_id: null,
        is_active: true,
        email_verified_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'user',
        division_id: 1,
        supervisor_id: 2,
        is_active: true,
        email_verified_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'user',
        division_id: 2,
        supervisor_id: 2,
        is_active: true,
        email_verified_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: 5,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: hashedPassword,
        role: 'user',
        division_id: 3,
        supervisor_id: 2,
        is_active: true,
        email_verified_at: now,
        created_at: now,
        updated_at: now
      }
    ]);

    // Update divisions with supervisor_id
    await queryInterface.bulkUpdate('divisions', { supervisor_id: 2 }, { id: 1 });

    // Insert sample attendances
    await queryInterface.bulkInsert('attendances', [
      {
        user_id: 3,
        date: '2024-12-01',
        check_in_time: '08:00:00',
        check_out_time: '17:00:00',
        check_in_latitude: -6.2088,
        check_in_longitude: 106.8456,
        check_out_latitude: -6.2088,
        check_out_longitude: 106.8456,
        status: 'present',
        created_at: now,
        updated_at: now
      },
      {
        user_id: 4,
        date: '2024-12-01',
        check_in_time: '08:15:00',
        check_out_time: '17:05:00',
        check_in_latitude: -6.2088,
        check_in_longitude: 106.8456,
        check_out_latitude: -6.2088,
        check_out_longitude: 106.8456,
        status: 'late',
        created_at: now,
        updated_at: now
      }
    ]);

    // Insert sample logbooks
    await queryInterface.bulkInsert('logbooks', [
      {
        user_id: 3,
        date: '2024-12-01',
        time: '14:00:00',
        description: 'Completed feature development for attendance module',
        status: 'approved',
        reviewed_by: 2,
        review_notes: 'Good work!',
        reviewed_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 4,
        date: '2024-12-01',
        time: '15:00:00',
        description: 'Created marketing campaign for Q1',
        status: 'pending',
        created_at: now,
        updated_at: now
      }
    ]);

    // Insert sample leaves
    await queryInterface.bulkInsert('leaves', [
      {
        user_id: 3,
        type: 'sakit',
        start_date: '2024-12-05',
        end_date: '2024-12-05',
        duration: 1,
        reason: 'Flu dan demam',
        status: 'approved',
        reviewed_by: 2,
        review_notes: 'Get well soon!',
        reviewed_at: now,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 4,
        type: 'keperluan',
        start_date: '2024-12-10',
        end_date: '2024-12-11',
        duration: 2,
        reason: 'Family event',
        status: 'pending',
        created_at: now,
        updated_at: now
      }
    ]);

    // Insert app settings
    await queryInterface.bulkInsert('app_settings', [
      {
        key: 'leave_deadline_hours',
        value: '24',
        type: 'number',
        description: 'Batas waktu pengajuan izin dalam jam sebelum tanggal mulai',
        created_at: now,
        updated_at: now
      },
      {
        key: 'leave_deadline_enabled',
        value: 'true',
        type: 'boolean',
        description: 'Aktifkan batas waktu pengajuan izin',
        created_at: now,
        updated_at: now
      },
      {
        key: 'work_start_time',
        value: '08:00',
        type: 'string',
        description: 'Jam mulai kerja',
        created_at: now,
        updated_at: now
      },
      {
        key: 'late_threshold_minutes',
        value: '15',
        type: 'number',
        description: 'Toleransi keterlambatan dalam menit',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('app_settings', null, {});
    await queryInterface.bulkDelete('leaves', null, {});
    await queryInterface.bulkDelete('logbooks', null, {});
    await queryInterface.bulkDelete('attendances', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('divisions', null, {});
  }
};
