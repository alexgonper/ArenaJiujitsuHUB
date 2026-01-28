import Notification, { INotification } from '../models/Notification';
import { Types } from 'mongoose';

class NotificationService {
    /**
     * Create a notification for a student or teacher
     */
    static async notify({ recipientId, recipientType, title, message, type, metadata = {} }: Partial<INotification>) {
        try {
            const notification = await Notification.create({
                recipientId,
                recipientType,
                title,
                message,
                type,
                metadata,
                read: false
            });
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }

    /**
     * Notify student about eligibility for graduation
     */
    static async notifyEligibility(studentId: string, nextBelt: string, nextDegree: string) {
        return this.notify({
            recipientId: new Types.ObjectId(studentId) as any,
            recipientType: 'Student',
            title: '🎉 Elegível para Graduação!',
            message: `Você alcançou os requisitos necessários para a graduação de ${nextBelt} - ${nextDegree}. Prepare-se para seu exame!`,
            type: 'eligibility',
            metadata: { nextBelt, nextDegree }
        });
    }

    /**
     * Notify student about payment success
     */
    static async notifyPaymentSuccess(studentId: string, amount: number) {
        return this.notify({
            recipientId: new Types.ObjectId(studentId) as any,
            recipientType: 'Student',
            title: '✅ Pagamento Confirmado',
            message: `Recebemos seu pagamento de R$ ${amount.toFixed(2)}. Obrigado!`,
            type: 'payment'
        });
    }
}

export default NotificationService;
