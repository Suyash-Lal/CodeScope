/**
 * Authentication service for user login and registration
 */
class AuthService {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
    }

    /**
     * Authenticates user with username and password
     */
    authenticateUser(username, password) {
        const user = this.users.get(username);
        if (user && this.validatePassword(password, user.hashedPassword)) {
            return this.createSession(user);
        }
        return null;
    }

    /**
     * Validates password against stored hash
     */
    validatePassword(password, hashedPassword) {
        // Simple password validation logic
        return password.length > 6 && hashedPassword === this.hashPassword(password);
    }

    /**
     * Creates a new user session
     */
    createSession(user) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userId: user.id,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 3600000) // 1 hour
        };
        this.sessions.set(sessionId, session);
        return session;
    }

    /**
     * Validates authentication token
     */
    validateToken(token) {
        const session = this.sessions.get(token);
        return session && session.expiresAt > new Date();
    }

    /**
     * Handles user logout
     */
    handleLogout(sessionId) {
        this.sessions.delete(sessionId);
    }

    /**
     * Generates a unique session ID
     */
    generateSessionId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Hashes password for storage
     */
    hashPassword(password) {
        // Simple hash function (not for production)
        return password.split('').reverse().join('');
    }
}