/**
 * Email service for sending notifications and messages
 */
class EmailService {
    constructor(config) {
        this.smtpConfig = config;
        this.templates = new Map();
        this.loadTemplates();
    }

    /**
     * Sends email to user
     */
    async sendEmail(to, subject, body, options = {}) {
        try {
            const emailData = this.prepareEmailData(to, subject, body, options);
            await this.deliverEmail(emailData);
            console.log(`Email sent to ${to}: ${subject}`);
        } catch (error) {
            this.handleEmailError(error, to, subject);
        }
    }

    /**
     * Sends notification email
     */
    async sendNotification(userId, notificationType, data) {
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const template = this.templates.get(notificationType);
        if (!template) {
            throw new Error('Template not found');
        }

        const emailContent = this.renderTemplate(template, data);
        await this.sendEmail(user.email, emailContent.subject, emailContent.body);
    }

    /**
     * Sends welcome email to new user
     */
    async sendWelcomeEmail(user) {
        const welcomeData = {
            name: user.name,
            username: user.username,
            activationLink: this.generateActivationLink(user.id)
        };

        await this.sendNotification(user.id, 'welcome', welcomeData);
    }

    /**
     * Sends password reset email
     */
    async sendPasswordResetEmail(email, resetToken) {
        const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
        const subject = 'Password Reset Request';
        const body = `Click here to reset your password: ${resetLink}`;
        
        await this.sendEmail(email, subject, body);
    }

    /**
     * Handles email sending errors
     */
    handleEmailError(error, to, subject) {
        console.error(`Failed to send email to ${to}: ${error.message}`);
        // Log to error tracking system
        this.logEmailError(error, to, subject);
    }

    /**
     * Prepares email data for sending
     */
    prepareEmailData(to, subject, body, options) {
        return {
            to,
            subject,
            body,
            from: this.smtpConfig.from,
            ...options
        };
    }

    /**
     * Delivers email via SMTP
     */
    async deliverEmail(emailData) {
        // Simulate email delivery
        return new Promise((resolve) => {
            setTimeout(resolve, 200);
        });
    }

    /**
     * Loads email templates
     */
    loadTemplates() {
        this.templates.set('welcome', {
            subject: 'Welcome to our service!',
            body: 'Hello {{name}}, welcome to our platform!'
        });
        
        this.templates.set('notification', {
            subject: 'New notification',
            body: 'You have a new notification: {{message}}'
        });
    }

    /**
     * Renders email template with data
     */
    renderTemplate(template, data) {
        let subject = template.subject;
        let body = template.body;

        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            subject = subject.replace(placeholder, data[key]);
            body = body.replace(placeholder, data[key]);
        });

        return { subject, body };
    }

    /**
     * Generates activation link for user
     */
    generateActivationLink(userId) {
        const token = Math.random().toString(36).substr(2, 15);
        return `${process.env.BASE_URL}/activate?token=${token}&user=${userId}`;
    }

    /**
     * Gets user by ID
     */
    async getUserById(userId) {
        // Simulate user lookup
        return {
            id: userId,
            email: `user${userId}@example.com`,
            name: `User ${userId}`,
            username: `user${userId}`
        };
    }

    /**
     * Logs email errors
     */
    logEmailError(error, to, subject) {
        console.error('Email error logged:', { error, to, subject });
    }
}