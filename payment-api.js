/**
 * Payment API Client
 * Handles payment-related API calls
 */
class PaymentAPI {
    static baseUrl = `${appConfig.apiBaseUrl}/payments`;

    /**
     * Create a checkout preference for a payment
     * @param {Object} paymentData - { studentId, franchiseId, amount, description, type }
     * @returns {Promise} - Preference with initPoint URL
     */
    static async createCheckout(paymentData) {
        try {
            const response = await fetch(`${this.baseUrl}/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create checkout');
            }

            return await response.json();
        } catch (error) {
            console.error('PaymentAPI.createCheckout error:', error);
            throw error;
        }
    }

    /**
     * Get payment history for a student
     * @param {String} studentId
     * @returns {Promise<Array>}
     */
    static async getByStudent(studentId) {
        try {
            const response = await fetch(`${this.baseUrl}/student/${studentId}`);
            if (!response.ok) throw new Error('Failed to fetch payments');
            return await response.json();
        } catch (error) {
            console.error('PaymentAPI.getByStudent error:', error);
            throw error;
        }
    }

    /**
     * Get payment history for a franchise
     * @param {String} franchiseId
     * @returns {Promise<Array>}
     */
    static async getByFranchise(franchiseId) {
        try {
            const response = await fetch(`${this.baseUrl}/franchise/${franchiseId}`);
            if (!response.ok) throw new Error('Failed to fetch payments');
            return await response.json();
        } catch (error) {
            console.error('PaymentAPI.getByFranchise error:', error);
            throw error;
        }
    }
}
