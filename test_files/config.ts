/**
 * Configuration management system
 */
interface AppConfig {
    database: DatabaseConfig;
    redis: RedisConfig;
    email: EmailConfig;
    security: SecurityConfig;
    logging: LoggingConfig;
}

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
}

interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    database: number;
}

interface EmailConfig {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    fromAddress: string;
}

interface SecurityConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
    corsOrigins: string[];
}

interface LoggingConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    output: 'console' | 'file' | 'both';
    filename?: string;
}

class ConfigManager {
    private config: AppConfig;
    private environment: string;

    constructor(environment: string = 'development') {
        this.environment = environment;
        this.config = this.loadConfiguration();
    }

    /**
     * Loads configuration from environment
     */
    private loadConfiguration(): AppConfig {
        const config: AppConfig = {
            database: this.loadDatabaseConfig(),
            redis: this.loadRedisConfig(),
            email: this.loadEmailConfig(),
            security: this.loadSecurityConfig(),
            logging: this.loadLoggingConfig()
        };

        this.validateConfiguration(config);
        return config;
    }

    /**
     * Loads database configuration
     */
    private loadDatabaseConfig(): DatabaseConfig {
        return {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'myapp',
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            ssl: process.env.DB_SSL === 'true',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
        };
    }

    /**
     * Loads Redis configuration
     */
    private loadRedisConfig(): RedisConfig {
        return {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            database: parseInt(process.env.REDIS_DB || '0')
        };
    }

    /**
     * Loads email configuration
     */
    private loadEmailConfig(): EmailConfig {
        return {
            smtpHost: process.env.SMTP_HOST || 'localhost',
            smtpPort: parseInt(process.env.SMTP_PORT || '587'),
            username: process.env.SMTP_USER || '',
            password: process.env.SMTP_PASSWORD || '',
            fromAddress: process.env.FROM_EMAIL || 'noreply@example.com'
        };
    }

    /**
     * Loads security configuration
     */
    private loadSecurityConfig(): SecurityConfig {
        return {
            jwtSecret: process.env.JWT_SECRET || 'default-secret',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
            corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',')
        };
    }

    /**
     * Loads logging configuration
     */
    private loadLoggingConfig(): LoggingConfig {
        return {
            level: (process.env.LOG_LEVEL as any) || 'info',
            format: (process.env.LOG_FORMAT as any) || 'json',
            output: (process.env.LOG_OUTPUT as any) || 'console',
            filename: process.env.LOG_FILE
        };
    }

    /**
     * Validates configuration settings
     */
    private validateConfiguration(config: AppConfig): void {
        this.validateDatabaseConfig(config.database);
        this.validateSecurityConfig(config.security);
        this.validateEmailConfig(config.email);
    }

    /**
     * Validates database configuration
     */
    private validateDatabaseConfig(config: DatabaseConfig): void {
        if (!config.host || !config.database || !config.username) {
            throw new Error('Database configuration is incomplete');
        }
    }

    /**
     * Validates security configuration
     */
    private validateSecurityConfig(config: SecurityConfig): void {
        if (!config.jwtSecret || config.jwtSecret === 'default-secret') {
            console.warn('Using default JWT secret - not recommended for production');
        }

        if (config.bcryptRounds < 10) {
            throw new Error('BCrypt rounds must be at least 10');
        }
    }

    /**
     * Validates email configuration
     */
    private validateEmailConfig(config: EmailConfig): void {
        if (!config.smtpHost || !config.fromAddress) {
            throw new Error('Email configuration is incomplete');
        }
    }

    /**
     * Gets complete configuration
     */
    getConfig(): AppConfig {
        return this.config;
    }

    /**
     * Gets database configuration
     */
    getDatabaseConfig(): DatabaseConfig {
        return this.config.database;
    }

    /**
     * Gets Redis configuration
     */
    getRedisConfig(): RedisConfig {
        return this.config.redis;
    }

    /**
     * Gets email configuration
     */
    getEmailConfig(): EmailConfig {
        return this.config.email;
    }

    /**
     * Gets security configuration
     */
    getSecurityConfig(): SecurityConfig {
        return this.config.security;
    }

    /**
     * Gets logging configuration
     */
    getLoggingConfig(): LoggingConfig {
        return this.config.logging;
    }

    /**
     * Checks if running in development mode
     */
    isDevelopment(): boolean {
        return this.environment === 'development';
    }

    /**
     * Checks if running in production mode
     */
    isProduction(): boolean {
        return this.environment === 'production';
    }

    /**
     * Updates configuration value
     */
    updateConfig<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
        this.config[key] = value;
    }
}