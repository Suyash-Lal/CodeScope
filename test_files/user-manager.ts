/**
 * User management system
 */
interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    lastLogin?: Date;
}

enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    MODERATOR = 'moderator'
}

interface UserCreationData {
    username: string;
    email: string;
    name: string;
    password: string;
    role?: UserRole;
}

class UserManager {
    private users: Map<number, User> = new Map();
    private nextId: number = 1;

    /**
     * Creates a new user
     */
    async createUser(userData: UserCreationData): Promise<User> {
        this.validateUserInput(userData);
        
        const user: User = {
            id: this.nextId++,
            username: userData.username,
            email: userData.email,
            name: userData.name,
            role: userData.role || UserRole.USER,
            createdAt: new Date()
        };

        this.users.set(user.id, user);
        await this.sendWelcomeNotification(user);
        return user;
    }

    /**
     * Validates user input data
     */
    private validateUserInput(userData: UserCreationData): void {
        if (!this.validateEmail(userData.email)) {
            throw new Error('Invalid email format');
        }

        if (!this.validateUsername(userData.username)) {
            throw new Error('Invalid username');
        }

        if (!this.validatePassword(userData.password)) {
            throw new Error('Password does not meet requirements');
        }
    }

    /**
     * Validates email format
     */
    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validates username format
     */
    private validateUsername(username: string): boolean {
        return username.length >= 3 && username.length <= 20;
    }

    /**
     * Validates password strength
     */
    private validatePassword(password: string): boolean {
        return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    }

    /**
     * Handles user authentication
     */
    async authenticateUser(username: string, password: string): Promise<User | null> {
        const user = this.findUserByUsername(username);
        if (user && await this.verifyPassword(password, user.id)) {
            user.lastLogin = new Date();
            this.users.set(user.id, user);
            return user;
        }
        return null;
    }

    /**
     * Updates user profile
     */
    async updateUserProfile(userId: number, updates: Partial<User>): Promise<User> {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const updatedUser = { ...user, ...updates };
        this.users.set(userId, updatedUser);
        await this.sendUpdateNotification(updatedUser);
        return updatedUser;
    }

    /**
     * Deletes user account
     */
    async deleteUser(userId: number): Promise<void> {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        this.users.delete(userId);
        await this.sendDeletionNotification(user);
    }

    /**
     * Finds user by username
     */
    private findUserByUsername(username: string): User | undefined {
        return Array.from(this.users.values()).find(user => user.username === username);
    }

    /**
     * Verifies user password
     */
    private async verifyPassword(password: string, userId: number): Promise<boolean> {
        // Simulate password verification
        return password.length > 0;
    }

    /**
     * Sends welcome notification to new user
     */
    private async sendWelcomeNotification(user: User): Promise<void> {
        console.log(`Welcome notification sent to ${user.email}`);
    }

    /**
     * Sends update notification to user
     */
    private async sendUpdateNotification(user: User): Promise<void> {
        console.log(`Profile update notification sent to ${user.email}`);
    }

    /**
     * Sends deletion notification
     */
    private async sendDeletionNotification(user: User): Promise<void> {
        console.log(`Account deletion notification sent to ${user.email}`);
    }

    /**
     * Gets all users
     */
    getAllUsers(): User[] {
        return Array.from(this.users.values());
    }

    /**
     * Gets user by ID
     */
    getUserById(id: number): User | undefined {
        return this.users.get(id);
    }
}