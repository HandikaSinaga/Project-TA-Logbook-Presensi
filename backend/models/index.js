import { Sequelize } from "sequelize";
import db from "../database/db.js";
import UserModel from "./usersModels/userModel.js";
import DivisionModel from "./divisionsModels/divisionModel.js";
import AttendanceModel from "./attendanceModels/attendanceModel.js";
import LogbookModel from "./logbookModels/logbookModel.js";
import LeaveModel from "./leaveModels/leaveModel.js";
import OfficeNetworkModel from "./officeNetworkModels/officeNetworkModel.js";
import AppSettingModel from "./settingsModels/appSettingModel.js";

const Op = Sequelize.Op;

const User = UserModel(Sequelize.DataTypes);
const Division = DivisionModel(Sequelize.DataTypes);
const Attendance = AttendanceModel(Sequelize.DataTypes);
const Logbook = LogbookModel(Sequelize.DataTypes);
const Leave = LeaveModel(Sequelize.DataTypes);
const OfficeNetwork = OfficeNetworkModel(Sequelize.DataTypes);
const AppSetting = AppSettingModel(Sequelize.DataTypes);

// User - Division relationship
User.belongsTo(Division, { foreignKey: "division_id", as: "division" });
Division.hasMany(User, { foreignKey: "division_id", as: "members" });

// Division - Supervisor relationship
Division.belongsTo(User, { foreignKey: "supervisor_id", as: "supervisor" });
User.hasMany(Division, {
    foreignKey: "supervisor_id",
    as: "supervisedDivisions",
});

// User - Supervisor relationship
User.belongsTo(User, { foreignKey: "supervisor_id", as: "supervisorUser" });
User.hasMany(User, { foreignKey: "supervisor_id", as: "subordinates" });

// User - Attendance relationship
User.hasMany(Attendance, { foreignKey: "user_id", as: "attendances" });
Attendance.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Attendance approval relationships
Attendance.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
Attendance.belongsTo(User, { foreignKey: "rejected_by", as: "rejector" });

// User - Logbook relationship
User.hasMany(Logbook, { foreignKey: "user_id", as: "logbooks" });
Logbook.belongsTo(User, { foreignKey: "user_id", as: "user" });
Logbook.belongsTo(User, { foreignKey: "reviewed_by", as: "reviewer" });

// User - Leave relationship
User.hasMany(Leave, { foreignKey: "user_id", as: "leaves" });
Leave.belongsTo(User, { foreignKey: "user_id", as: "user" });
Leave.belongsTo(User, { foreignKey: "reviewed_by", as: "reviewer" });

const models = {
    Op,
    User,
    Division,
    Attendance,
    Logbook,
    Leave,
    OfficeNetwork,
    AppSetting,
};

export default models;
