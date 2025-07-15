/**
 * Logging service for application events
 */
class Logger {
    constructor(config = {}) {
        this.level = config.level || 'info';
        this.format = config.format || 'json';
        this.output = config.output || 'console';
        this.filename = config.filename;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
    }

    /**
     * Logs debug message
     */
    debug(message, meta = {}) {
        if (this.shouldLog('debug')) {
            this.writeLog('debug', message, meta);
        }
    }

    /**
     * Logs info message
     */
    info(message, meta = {}) {
        if (this.shouldLog('info')) {
            this.writeLog('info', message, meta);
        }
    }

    /**
     * Logs warning message
     */
    warn(message, meta = {}) {
        if (this.shouldLog('warn')) {
            this.writeLog('warn', message, meta);
        }
    }

    /**
     * Logs error message
     */
    error(message, meta = {}) {
        if (this.shouldLog('error')) {
            this.writeLog('error', message, meta);
        }
    }

    /**
     * Logs HTTP request
     */
    logRequest(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: responseTime,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress
        };

        this.info('HTTP Request', logData);
    }

    /**
     * Logs database query
     */
    logDatabaseQuery(query, params, duration) {
        const logData = {
            query: query,
            params: params,
            duration: duration,
            timestamp: new Date().toISOString()
        };

        this.debug('Database Query', logData);
    }

    /**
     * Logs authentication events
     */
    logAuthEvent(event, userId, success, details = {}) {
        const logData = {
            event: event,
            userId: userId,
            success: success,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.info('Authentication Event', logData);
    }

    /**
     * Logs error with stack trace
     */
    logError(error, context = {}) {
        const logData = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            context: context,
            timestamp: new Date().toISOString()
        };

        this.error('Application Error', logData);
    }

    /**
     * Logs performance metrics
     */
    logPerformance(operation, duration, metadata = {}) {
        const logData = {
            operation: operation,
            duration: duration,
            metadata: metadata,
            timestamp: new Date().toISOString()
        };

        this.info('Performance Metric', logData);
    }

    /**
     * Logs security events
     */
    logSecurityEvent(event, severity, details = {}) {
        const logData = {
            event: event,
            severity: severity,
            details: details,
            timestamp: new Date().toISOString()
        };

        this.warn('Security Event', logData);
    }

    /**
     * Determines if message should be logged
     */
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    /**
     * Writes log entry
     */
    writeLog(level, message, meta) {
        const logEntry = this.formatLogEntry(level, message, meta);
        
        if (this.output === 'console' || this.output === 'both') {
            this.writeToConsole(level, logEntry);
        }
        
        if (this.output === 'file' || this.output === 'both') {
            this.writeToFile(logEntry);
        }
    }

    /**
     * Formats log entry
     */
    formatLogEntry(level, message, meta) {
        const timestamp = new Date().toISOString();
        
        if (this.format === 'json') {
            return JSON.stringify({
                timestamp: timestamp,
                level: level,
                message: message,
                meta: meta
            });
        } else {
            return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(meta)}`;
        }
    }

    /**
     * Writes to console
     */
    writeToConsole(level, logEntry) {
        switch (level) {
            case 'debug':
                console.log(logEntry);
                break;
            case 'info':
                console.info(logEntry);
                break;
            case 'warn':
                console.warn(logEntry);
                break;
            case 'error':
                console.error(logEntry);
                break;
        }
    }

    /**
     * Writes to file
     */
    writeToFile(logEntry) {
        if (this.filename) {
            // File writing logic would go here
            console.log(`Writing to file ${this.filename}: ${logEntry}`);
        }
    }

    /**
     * Creates child logger with additional context
     */
    createChild(context) {
        return new ChildLogger(this, context);
    }

    /**
     * Flushes log buffer
     */
    flush() {
        // Flush any buffered logs
        console.log('Flushing log buffer...');
    }
}

/**
 * Child logger with additional context
 */
class ChildLogger {
    constructor(parent, context) {
        this.parent = parent;
        this.context = context;
    }

    debug(message, meta = {}) {
        this.parent.debug(message, { ...this.context, ...meta });
    }

    info(message, meta = {}) {
        this.parent.info(message, { ...this.context, ...meta });
    }

    warn(message, meta = {}) {
        this.parent.warn(message, { ...this.context, ...meta });
    }

    error(message, meta = {}) {
        this.parent.error(message, { ...this.context, ...meta });
    }
}

module.exports = Logger;