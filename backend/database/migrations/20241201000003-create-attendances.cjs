'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('attendances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      check_in_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      check_out_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      check_in_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      check_in_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      check_out_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      check_out_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('present', 'late', 'early', 'absent'),
        defaultValue: 'present'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add foreign key
    await queryInterface.addConstraint('attendances', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'attendances_user_id_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add unique constraint
    await queryInterface.addConstraint('attendances', {
      fields: ['user_id', 'date'],
      type: 'unique',
      name: 'attendances_user_date_unique'
    });

    // Add indexes
    await queryInterface.addIndex('attendances', ['user_id', 'date']);
    await queryInterface.addIndex('attendances', ['status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('attendances');
  }
};
