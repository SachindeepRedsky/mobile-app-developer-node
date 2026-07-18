const winston = require('winston');
//require("winston-mongodb");
const DailyRotateFile = require('winston-daily-rotate-file');
const logLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        sql: 4,
        debug: 5
    },
    colors: {
        error: "red",
        warn: "darkred",
        info: "black",
        http: "green",
        sql: "blue",
        debug: "gray"
    }
};


module.exports.logger = winston.createLogger({
    levels: logLevels.levels,
    transports: [
        new winston.transports.File({
            level: "info",
			filename: " log/Info/logLogger-info-%DATE%.log",
			maxFiles:'10d',
            json: true,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            level: "error",
			filename: "log/Error/Logger-error-%DATE%.log",
			maxFiles:'10d',
            json: true,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json())
        }),
        new winston.transports.Console({
            level: "info",
            format: winston.format.combine(

                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

winston.addColors(logLevels.colors);