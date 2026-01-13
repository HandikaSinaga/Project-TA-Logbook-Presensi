'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('logbooks', {
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
      time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
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
    await queryInterface.addConstraint('logbooks', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'logbooks_user_id_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('logbooks', {
      fields: ['reviewed_by'],
      type: 'foreign key',
      name: 'logbooks_reviewed_by_fk',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add indexes
    await queryInterface.addIndex('logbooks', ['user_id', 'date']);
    await queryInterface.addIndex('logbooks', ['status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('logbooks');
  }
};
