'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('leaves', {
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
      type: {
        type: Sequelize.ENUM('sakit', 'keperluan'),
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      attachment: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      review_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewed_at: {
        type: Sequelize.DATE,
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

    // Add foreign keys
    await queryInterface.addConstraint('leaves', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'leaves_user_id_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('leaves', {
      fields: ['reviewed_by'],
      type: 'foreign key',
      name: 'leaves_reviewed_by_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add indexes
    await queryInterface.addIndex('leaves', ['user_id', 'start_date']);
    await queryInterface.addIndex('leaves', ['status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('leaves');
  }
};
