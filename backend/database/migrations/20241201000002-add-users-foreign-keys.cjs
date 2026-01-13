'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add foreign keys to users table
    await queryInterface.addConstraint('users', {
      fields: ['division_id'],
      type: 'foreign key',
      name: 'users_division_id_fk',
      references: {
        table: 'divisions',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('users', {
      fields: ['supervisor_id'],
      type: 'foreign key',
      name: 'users_supervisor_id_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('users', 'users_division_id_fk');
    await queryInterface.removeConstraint('users', 'users_supervisor_id_fk');
  }
};
