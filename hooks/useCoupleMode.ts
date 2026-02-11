import { useState, useEffect } from 'react';
import { tasksService } from '../services/tasks';
import { coupleService } from '../services/couple';

export const useCoupleMode = () => {
    const [isCouple, setIsCouple] = useState(false);
    const [partnerName, setPartnerName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        try {
            // Check service/mock first
            const servicePartner = await coupleService.getPartner();
            if (servicePartner) {
                setIsCouple(true);
                setPartnerName(servicePartner.name);
                return;
            }

            // Fallback to household check
            const household = await tasksService.getHousehold();
            if (household && household.members && household.members.length > 1) {
                setIsCouple(true);
                // Find name of other member
                // For now, simpler assumption
                setPartnerName('Parceiro');
            } else {
                setIsCouple(false);
                setPartnerName(null);
            }
        } catch (error) {
            console.error('Error checking couple status:', error);
            setIsCouple(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();

        // Listen for events
        const handler = () => checkStatus();
        window.addEventListener('couple_status_changed', handler);
        return () => window.removeEventListener('couple_status_changed', handler);
    }, []);

    return { isCouple, partnerName, loading, refresh: checkStatus };
};
