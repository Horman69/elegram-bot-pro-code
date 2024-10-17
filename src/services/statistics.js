const { logger } = require('../utils/logger');

let statistics = {
    totalUsers: 0,
    commandUsage: {},
    courseViews: {},
};

function incrementTotalUsers() {
    statistics.totalUsers++;
    logger.info(`Общее количество пользователей: ${statistics.totalUsers}`);
}

function logCommandUsage(command) {
    if (!statistics.commandUsage[command]) {
        statistics.commandUsage[command] = 0;
    }
    statistics.commandUsage[command]++;
    logger.info(`Использование команды ${command}: ${statistics.commandUsage[command]}`);
}

function logCourseView(courseTitle) {
    if (!statistics.courseViews[courseTitle]) {
        statistics.courseViews[courseTitle] = 0;
    }
    statistics.courseViews[courseTitle]++;
    logger.info(`Просмотр курса ${courseTitle}: ${statistics.courseViews[courseTitle]}`);
}

function getStatistics() {
    return statistics;
}

module.exports = {
    incrementTotalUsers,
    logCommandUsage,
    logCourseView,
    getStatistics,
};