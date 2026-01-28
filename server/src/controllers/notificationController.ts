import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { recipientId } = req.params;
        const { limit = 20, unreadOnly = false } = req.query;

        let query: any = { recipientId };
        if (unreadOnly === 'true') query.read = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notificação não encontrada' });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const { recipientId } = req.params;
        await Notification.updateMany({ recipientId, read: false }, { read: true });

        res.status(200).json({
            success: true,
            message: 'Todas as notificações marcadas como lidas'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
