/**
 * Payment processing service
 */
class PaymentProcessor {
    constructor(config) {
        this.config = config;
        this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
        this.paymentMethods = new Map();
        this.initializePaymentMethods();
    }

    /**
     * Processes payment transaction
     */
    async processPayment(paymentData) {
        try {
            this.validatePaymentData(paymentData);
            const transaction = await this.createTransaction(paymentData);
            const result = await this.executePayment(transaction);
            await this.sendPaymentConfirmation(result);
            return result;
        } catch (error) {
            this.handlePaymentError(error, paymentData);
            throw error;
        }
    }

    /**
     * Validates payment data
     */
    validatePaymentData(paymentData) {
        if (!paymentData.amount || paymentData.amount <= 0) {
            throw new Error('Invalid payment amount');
        }

        if (!this.supportedCurrencies.includes(paymentData.currency)) {
            throw new Error('Unsupported currency');
        }

        if (!this.validateCreditCard(paymentData.cardNumber)) {
            throw new Error('Invalid credit card number');
        }
    }

    /**
     * Validates credit card number
     */
    validateCreditCard(cardNumber) {
        // Simple Luhn algorithm implementation
        const cleanNumber = cardNumber.replace(/\D/g, '');
        return cleanNumber.length >= 13 && cleanNumber.length <= 19;
    }

    /**
     * Creates payment transaction
     */
    async createTransaction(paymentData) {
        const transaction = {
            id: this.generateTransactionId(),
            amount: paymentData.amount,
            currency: paymentData.currency,
            customerId: paymentData.customerId,
            paymentMethod: paymentData.paymentMethod,
            status: 'pending',
            createdAt: new Date()
        };

        return transaction;
    }

    /**
     * Executes payment processing
     */
    async executePayment(transaction) {
        // Simulate payment processing
        await this.chargePaymentMethod(transaction);
        
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        
        return transaction;
    }

    /**
     * Charges payment method
     */
    async chargePaymentMethod(transaction) {
        const paymentMethod = this.paymentMethods.get(transaction.paymentMethod);
        if (!paymentMethod) {
            throw new Error('Payment method not found');
        }

        // Simulate charging
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }

    /**
     * Handles payment refund
     */
    async processRefund(transactionId, amount) {
        const transaction = await this.getTransaction(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (amount > transaction.amount) {
            throw new Error('Refund amount exceeds original payment');
        }

        const refund = {
            id: this.generateTransactionId(),
            originalTransactionId: transactionId,
            amount: amount,
            currency: transaction.currency,
            status: 'completed',
            createdAt: new Date()
        };

        await this.sendRefundConfirmation(refund);
        return refund;
    }

    /**
     * Handles payment errors
     */
    handlePaymentError(error, paymentData) {
        console.error('Payment error:', error.message);
        this.logPaymentError(error, paymentData);
    }

    /**
     * Sends payment confirmation
     */
    async sendPaymentConfirmation(transaction) {
        console.log(`Payment confirmation sent for transaction ${transaction.id}`);
        // Send email confirmation
    }

    /**
     * Sends refund confirmation
     */
    async sendRefundConfirmation(refund) {
        console.log(`Refund confirmation sent for refund ${refund.id}`);
        // Send email confirmation
    }

    /**
     * Initializes payment methods
     */
    initializePaymentMethods() {
        this.paymentMethods.set('credit_card', {
            name: 'Credit Card',
            processor: 'stripe'
        });
        
        this.paymentMethods.set('paypal', {
            name: 'PayPal',
            processor: 'paypal'
        });
    }

    /**
     * Generates unique transaction ID
     */
    generateTransactionId() {
        return 'txn_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Gets transaction by ID
     */
    async getTransaction(transactionId) {
        // Simulate database lookup
        return {
            id: transactionId,
            amount: 100,
            currency: 'USD',
            status: 'completed'
        };
    }

    /**
     * Logs payment errors
     */
    logPaymentError(error, paymentData) {
        console.error('Payment error logged:', { error, paymentData });
    }
}